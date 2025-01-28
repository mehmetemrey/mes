const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { sendPasswordSetupEmail, sendPasswordChangeCodeEmail } = require('../utils/emailService');
const crypto = require('crypto');


function normalizePhoneNumber(phone) {
    if (!phone) return phone;
    let normalizedPhone = phone.replace(/[^\d]/g, '');

    if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+90' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+90')) {
        normalizedPhone = '+90' + normalizedPhone;
    }

    return normalizedPhone;
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Email veya telefon numarası ile kullanıcı bulma
        const user = await User.findOne({
            $or: [
                { email: email },
                { phone: email }
            ]
        }).populate({
            path: 'roles',
            populate: {
                path: 'permissions'
            }
        }).select('+password');

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Geçersiz kullanıcı bilgileri' 
            });
        }

        // Şifre kontrolü
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Geçersiz kullanıcı bilgileri' 
            });
        }

        // JWT token oluşturma - Rolleri ekle
        const token = jwt.sign(
            { 
                id: user._id,
                roles: user.roles.map(role => role.name),
                permissions: user.roles.reduce((acc, role) => {
                    role.permissions.forEach(permission => {
                        if (!acc.includes(permission.name)) {
                            acc.push(permission.name);
                        }
                    });
                    return acc;
                }, [])
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Son giriş tarihini güncelle
        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Giriş başarılı',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: user.roles.map(role => role.name),
                    permissions: user.roles.reduce((acc, role) => {
                        role.permissions.forEach(permission => {
                            if (!acc.includes(permission.name)) {
                                acc.push(permission.name);
                            }
                        });
                        return acc;
                    }, []),
                    phone: user.phone,
                    isActive: user.isActive
                }
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Sunucu hatası', 
            error: error.message 
        });
    }
};

// Kullanıcı bilgilerini getirme
exports.getProfile = async (req, res) => {
    try {
        // Kullanıcı zaten protect middleware'inden geliyor ve populate edilmiş durumda
        const user = req.user;

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }

        // Department bilgisini ayrıca populate et (eğer varsa)
        if (user.department) {
            await user.populate('department', 'name');
        }

        res.json({
            success: true,
            data: {
                user: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: user.roles.map(role => role.name),
                    phone: user.phone,
                    isActive: user.isActive,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    department: user.department?.name // Eğer department yoksa undefined olacak
                }
            }
        });
    } catch (error) {
        console.error('Error in getProfile:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'Sunucu hatası', 
            error: error.message
        });
    }
};

// Roller: Listele
exports.listRoles = async (req, res) => {
    try {
        const roles = await Role.find().populate('permissions');
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Roller alınamadı', error: error.message });
    }
};

// Rol: Ekle
exports.addRole = async (req, res) => {
    try {
        const { name, description, permissions, level, department, parentRole } = req.body;
        const existing = await Role.findOne({ name });
        if (existing) {
            return res.status(400).json({ message: 'Bu rol zaten mevcut' });
        }
        const role = new Role({ 
            name, 
            description, 
            permissions,
            level,
            department,
            parentRole
        });
        await role.save();
        res.status(201).json({ message: 'Rol eklendi', role });
    } catch (error) {
        res.status(500).json({ message: 'Rol eklenemedi', error: error.message });
    }
};

// Rol: Güncelle
exports.updateRole = async (req, res) => {
    try {
        const { roleId, name, description, permissions, level, department, parentRole } = req.body;
        const role = await Role.findByIdAndUpdate(
            roleId,
            { name, description, permissions, level, department, parentRole },
            { new: true }
        ).populate('permissions');
        
        if (!role) {
            return res.status(404).json({ message: 'Rol bulunamadı' });
        }
        res.json({ message: 'Rol güncellendi', role });
    } catch (error) {
        res.status(500).json({ message: 'Rol güncellenemedi', error: error.message });
    }
};

// Rol: Sil
exports.deleteRole = async (req, res) => {
    try {
        const { roleId } = req.body;
        const role = await Role.findByIdAndDelete(roleId);
        if (!role) {
            return res.status(404).json({ message: 'Rol bulunamadı' });
        }
        res.json({ message: 'Rol silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Rol silinemedi', error: error.message });
    }
};

// Kullanıcıya rol ata/güncelle
exports.assignRolesToUser = async (req, res) => {
    try {
        const { userId, roleIds } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { roles: roleIds },
            { new: true }
        ).populate({
            path: 'roles',
            populate: {
                path: 'permissions'
            }
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
        }
        res.json({ message: 'Kullanıcı rolleri güncellendi', user });
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcı rolleri atanamadı', error: error.message });
    }
};

// Yeni kullanıcı kaydı (şifresiz)
exports.registerWithoutPassword = async (req, res) => {
    try {
        const {
            email,
            roles,
            firstName,
            lastName,
            phone,
            isActive
        } = req.body;

        // Telefon numarasını normalize et
        const normalizedPhone = normalizePhoneNumber(phone);

        // Email kontrolü
        const existingUser = await User.findOne({
            $or: [
                { email },
                { phone: normalizedPhone }
            ]
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu email veya telefon zaten kullanımda' });
        }

        const roleDocs = await Role.find({ name: { $in: roles } });
        if (roleDocs.length !== roles.length) {
            return res.status(400).json({ message: 'Bazı roller bulunamadı' });
        }
        const roleIds = roleDocs.map(role => role._id);

        const passwordSetupToken = crypto.randomBytes(32).toString('hex');
        const passwordSetupTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const user = new User({
            email,
            roles: roleIds,
            firstName,
            lastName,
            phone: normalizedPhone,
            passwordSetupToken,
            passwordSetupTokenExpires,
            isActive
        });

        await user.save();

        // Email gönder
        const emailSent = await sendPasswordSetupEmail(email, passwordSetupToken);
        if (!emailSent) {
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ message: 'Email gönderilemedi' });
        }

        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu. Lütfen email adresinizi kontrol edin.',
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Şifre oluşturma
exports.setupPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            passwordSetupToken: token,
            passwordSetupTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token' });
        }

        // Şifre hashleme
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Kullanıcıyı güncelle
        user.password = hashedPassword;
        user.passwordSetupToken = undefined;
        user.passwordSetupTokenExpires = undefined;
        user.isActive = true;
        user.lastLogin = new Date();
        await user.save();

        // JWT token oluşturma
        const jwtToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Şifre başarıyla oluşturuldu',
            token: jwtToken,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
};

// Token doğrulama
exports.validateResetToken = async (req, res) => {
    try {
        const { token } = req.body;

        const user = await User.findOne({
            passwordSetupToken: token,
            passwordSetupTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Geçersiz veya süresi dolmuş token' 
            });
        }

        res.json({
            success: true,
            message: 'Token geçerli'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Sunucu hatası', 
            error: error.message 
        });
    }
};

// Profil güncelleme
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { firstName, lastName, phone: normalizePhoneNumber(phone) },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Kullanıcı bulunamadı' 
            });
        }

        res.json({
            success: true,
            message: 'Profil başarıyla güncellendi',
            data: { user }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Profil güncellenirken bir hata oluştu',
            error: error.message 
        });
    }
};

// Mevcut şifreyi doğrula
exports.verifyCurrentPassword = async (req, res) => {
    try {

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }


        const isMatch = await user.matchPassword(req.body.currentPassword);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut şifre yanlış'
            });
        }

        res.json({
            success: true,
            message: 'Şifre doğrulandı'
        });
    } catch (error) {
        console.error('Şifre doğrulama hatası:', error.message);
        console.error(error.stack);
        res.status(500).json({
            success: false,
            message: 'Şifre doğrulanırken bir hata oluştu',
            error: error.message
        });
    }
};


// Şifre değiştirme kodu gönder
exports.sendPasswordChangeCode = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Kullanıcı bulunamadı' 
            });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.passwordChangeCode = verificationCode;
        user.passwordChangeCodeExpires = codeExpires;
        await user.save();

        const emailSent = await sendPasswordChangeCodeEmail(user.email, verificationCode);
        if (!emailSent) {
            user.passwordChangeCode = undefined;
            user.passwordChangeCodeExpires = undefined;
            await user.save();
            
            return res.status(500).json({ 
                success: false,
                message: 'Doğrulama kodu gönderilemedi' 
            });
        }

        res.json({
            success: true,
            message: 'Doğrulama kodu e-posta adresinize gönderildi'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Doğrulama kodu gönderilirken bir hata oluştu',
            error: error.message 
        });
    }
};

// Şifre değiştirme kodu doğrula ve şifreyi güncelle
exports.verifyAndChangePassword = async (req, res) => {
    try {
        const { code, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+passwordChangeCode +passwordChangeCodeExpires');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Kullanıcı bulunamadı' 
            });
        }

        if (!user.passwordChangeCode || user.passwordChangeCode !== code) {
            return res.status(400).json({ 
                success: false,
                message: 'Geçersiz doğrulama kodu' 
            });
        }

        if (!user.passwordChangeCodeExpires || user.passwordChangeCodeExpires < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Doğrulama kodunun süresi dolmuş' 
            });
        }

        // Şifreyi güncelle
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordChangeCode = undefined;
        user.passwordChangeCodeExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Şifreniz başarıyla değiştirildi'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Şifre değiştirilirken bir hata oluştu',
            error: error.message 
        });
    }
};

// Şifre sıfırlama kodu gönder
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı' 
            });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.passwordChangeCode = verificationCode;
        user.passwordChangeCodeExpires = codeExpires;
        await user.save();

        const emailSent = await sendPasswordChangeCodeEmail(user.email, verificationCode);
        if (!emailSent) {
            user.passwordChangeCode = undefined;
            user.passwordChangeCodeExpires = undefined;
            await user.save();
            
            return res.status(500).json({ 
                success: false,
                message: 'Doğrulama kodu gönderilemedi' 
            });
        }

        res.json({
            success: true,
            message: 'Doğrulama kodu e-posta adresinize gönderildi'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Doğrulama kodu gönderilirken bir hata oluştu',
            error: error.message 
        });
    }
};

// Şifre sıfırlama
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await User.findOne({ email }).select('+passwordChangeCode +passwordChangeCodeExpires');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Kullanıcı bulunamadı' 
            });
        }

        if (!user.passwordChangeCode || user.passwordChangeCode !== code) {
            return res.status(400).json({ 
                success: false,
                message: 'Geçersiz doğrulama kodu' 
            });
        }

        if (!user.passwordChangeCodeExpires || user.passwordChangeCodeExpires < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Doğrulama kodunun süresi dolmuş' 
            });
        }

        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordChangeCode = undefined;
        user.passwordChangeCodeExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Şifreniz başarıyla sıfırlandı'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Şifre sıfırlanırken bir hata oluştu',
            error: error.message 
        });
    }
};

// Şifre sıfırlama kodu doğrula
exports.verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email }).select('+passwordChangeCode +passwordChangeCodeExpires');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Kullanıcı bulunamadı' 
            });
        }

        if (!user.passwordChangeCode || user.passwordChangeCode !== code) {
            return res.status(400).json({ 
                success: false,
                message: 'Geçersiz doğrulama kodu' 
            });
        }

        if (!user.passwordChangeCodeExpires || user.passwordChangeCodeExpires < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Doğrulama kodunun süresi dolmuş' 
            });
        }

        res.json({
            success: true,
            message: 'Doğrulama kodu geçerli'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Doğrulama kodu kontrol edilirken bir hata oluştu',
            error: error.message 
        });
    }
};
