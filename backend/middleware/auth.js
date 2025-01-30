const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Geçersiz veya pasif kullanıcı hesabı' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Geçersiz token' });
    }
};

exports.protect = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id || decoded._id)
                .populate({
                    path: 'roles',
                    populate: {
                        path: 'permissions'
                    }
                });

            if (!user) {
                return res.status(401).json({ message: 'Kullanıcı bulunamadı' });
            }

            if (!user.isActive) {
                return res.status(401).json({ message: 'Hesabınız aktif değil' });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
        }
    } catch (error) {
        return res.status(401).json({ message: 'Oturum geçersiz' });
    }
};

exports.authorize = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Yetkilendirme gerekli' });
            }

            // User rollerini al
            let userRoles = Array.isArray(req.user.roles) ? req.user.roles : [];

            // Eğer roller populate edilmemişse veya permissions eksikse MongoDB'den çek
            if (userRoles.length > 0 && (!userRoles[0]?.permissions || typeof userRoles[0] === 'string' || !userRoles[0]?.name)) {
                const Role = require('../models/Role');
                const roleIds = userRoles.map(r => (r?._id || r));
                userRoles = await Role.find({ _id: { $in: roleIds } }).populate('permissions');
            }

            // Super admin veya general manager her zaman tüm işlemlere tam yetkilidir
            const isSuperAdmin = userRoles.some(role => {
                const roleName = typeof role === 'string' ? role : role?.name;
                return roleName === 'super_admin' || roleName === 'general_manager' || role?.level === 1;
            });

            if (isSuperAdmin) {
                return next();
            }

            const permissionsArray = Array.isArray(requiredPermissions) 
                ? requiredPermissions 
                : [requiredPermissions];

            const userPermissions = userRoles.reduce((permissions, role) => {
                if (!role) return permissions;
                const rolePermissions = Array.isArray(role.permissions) 
                    ? role.permissions.map(p => typeof p === 'string' ? p : p?.name).filter(Boolean) 
                    : [];
                return [...permissions, ...rolePermissions];
            }, []);

            const hasPermission = permissionsArray.every(permission => 
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({ 
                    message: 'Bu işlem için yetkiniz bulunmuyor',
                    requiredPermissions: permissionsArray
                });
            }

            next();
        } catch (authError) {
            console.error('Authorization error:', authError);
            return res.status(500).json({ message: 'Yetki kontrolü sırasında sunucu hatası' });
        }
    };
};
