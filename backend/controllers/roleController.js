const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

exports.listRoles = async (req, res) => {
    try {
        const roles = await Role.find()
            .populate('permissions', 'name description')
            .populate('department', 'name code')
            .populate('parentRole', 'name description');
        
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: 'Roller alınamadı', error: error.message });
    }
};

exports.getRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id)
            .populate('permissions', 'name description')
            .populate('department', 'name code')
            .populate('parentRole', 'name description');
        
        if (!role) {
            return res.status(404).json({ message: 'Rol bulunamadı' });
        }

        const users = await User.find({ roles: role._id })
            .select('-password')
            .populate('department', 'name code');

        res.json({
            role,
            users
        });
    } catch (error) {
        res.status(500).json({ message: 'Rol detayı alınamadı', error: error.message });
    }
};

exports.createRole = async (req, res) => {
    try {
        const {
            name,
            description,
            permissions,
            level,
            department,
            parentRole,
            scope,
            isActive = true
        } = req.body;

        if (!name) {
            return res.status(400).json({ 
                message: 'Rol adı zorunludur',
                error: 'Missing name'
            });
        }

        if (!description) {
            return res.status(400).json({ 
                message: 'Rol açıklaması zorunludur',
                error: 'Missing description'
            });
        }

        if (!scope) {
            return res.status(400).json({ 
                message: 'Rol kapsamı zorunludur',
                error: 'Missing scope'
            });
        }

        if (!level) {
            return res.status(400).json({ 
                message: 'Rol seviyesi zorunludur',
                error: 'Missing level'
            });
        }

        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(400).json({ 
                message: 'Bu isimde bir rol zaten mevcut',
                error: 'Duplicate role name'
            });
        }

        if (permissions && permissions.length > 0) {
            const validPermissions = await Permission.find({ _id: { $in: permissions } });
            if (validPermissions.length !== permissions.length) {
                return res.status(400).json({ 
                    message: 'Geçersiz izinler',
                    error: 'Invalid permissions'
                });
            }
        }

        const role = new Role({
            name,
            description,
            permissions,
            level,
            department,
            parentRole,
            scope,
            isActive,
            createdBy: req.user._id
        });

        await role.save();

        let populatedRole;
        try {
            populatedRole = await Role.findById(role._id)
                .populate({
                    path: 'createdBy',
                    select: 'firstName lastName email',
                    strictPopulate: false
                })
                .populate({
                    path: 'updatedBy',
                    select: 'firstName lastName email',
                    strictPopulate: false
                });
        } catch (populateError) {
            populatedRole = role.toObject();
        }

        await notificationService.createNotificationForAllUsers(
            'Yeni Rol Eklendi',
            `${role.name} rolü sisteme eklendi.`,
            'info',
            `/dashboard/roles/${role._id}`
        );

        res.status(201).json(populatedRole);
    } catch (error) {
        console.error('Role Creation Error:', error.message);
        res.status(500).json({ 
            message: 'Rol oluşturulamadı', 
            error: error.message
        });
    }
};

// Rol güncelle
exports.updateRole = async (req, res) => {
    try {
        const {
            name,
            description,
            permissions,
            level,
            department,
            parentRole,
            scope,
            isActive
        } = req.body;

        // Rol adı değişiyorsa benzersizlik kontrolü yap
        if (name) {
            const existingRole = await Role.findOne({ name, _id: { $ne: req.params.id } });
            if (existingRole) {
                return res.status(400).json({ message: 'Bu isimde bir rol zaten mevcut' });
            }
        }

        // İzinleri kontrol et
        if (permissions && permissions.length > 0) {
            const validPermissions = await Permission.find({ _id: { $in: permissions } });
            if (validPermissions.length !== permissions.length) {
                return res.status(400).json({ message: 'Geçersiz izinler' });
            }
        }

        const role = await Role.findById(req.params.id);
        
        if (!role) {
            return res.status(404).json({ message: 'Rol bulunamadı' });
        }

        Object.assign(role, req.body);
        role.updatedBy = req.user._id;
        
        await role.save();

        const updatedRole = await Role.findById(role._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        // Send notification to all users about role update
        await notificationService.createNotificationForAllUsers(
            'Rol Güncellendi',
            `${role.name} rolü güncellendi.`,
            'info',
            `/dashboard/roles/${role._id}`
        );

        res.json(updatedRole);
    } catch (error) {
        res.status(500).json({ message: 'Rol güncellenemedi', error: error.message });
    }
};

// Rol sil
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        
        if (!role) {
            return res.status(404).json({ message: 'Rol bulunamadı' });
        }

        // Bu role sahip kullanıcıları kontrol et
        const users = await User.find({ roles: role._id });
        if (users.length > 0) {
            return res.status(400).json({ 
                message: 'Bu role sahip kullanıcılar var. Önce kullanıcıların rollerini değiştirmelisiniz.' 
            });
        }

        // Alt rolleri kontrol et
        const childRoles = await Role.find({ parentRole: role._id });
        if (childRoles.length > 0) {
            return res.status(400).json({ 
                message: 'Bu rolün alt rolleri var. Önce onları silmelisiniz.' 
            });
        }

        await Role.findByIdAndDelete(req.params.id);

        // Send notification to all users about role deletion
        await notificationService.createNotificationForAllUsers(
            'Rol Silindi',
            `${role.name} rolü sistemden silindi.`,
            'error',
            '/dashboard/roles'
        );

        res.json({ message: 'Rol başarıyla silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Rol silinemedi', error: error.message });
    }
};

// Role izin ekle
exports.addPermissionToRole = async (req, res) => {
    try {
        const { permissionId } = req.body;
        const role = await Role.findById(req.params.id);
        
        if (!role) {
            return res.status(404).json({ message: 'Rol bulunamadı' });
        }

        // İzin var mı kontrol et
        const permission = await Permission.findById(permissionId);
        if (!permission) {
            return res.status(404).json({ message: 'İzin bulunamadı' });
        }

        // İzin zaten ekli mi kontrol et
        if (role.permissions.includes(permissionId)) {
            return res.status(400).json({ message: 'Bu izin zaten role ekli' });
        }

        role.permissions.push(permissionId);
        await role.save();

        res.json({
            message: 'İzin başarıyla role eklendi',
            role: await role.populate('permissions', 'name description')
        });
    } catch (error) {
        res.status(500).json({ message: 'İzin eklenemedi', error: error.message });
    }
};

// Rolden izin kaldır
exports.removePermissionFromRole = async (req, res) => {
    try {
        const { permissionId } = req.body;
        const role = await Role.findById(req.params.id);
        
        if (!role) {
            return res.status(404).json({ message: 'Rol bulunamadı' });
        }

        // İzin role ekli mi kontrol et
        if (!role.permissions.includes(permissionId)) {
            return res.status(400).json({ message: 'Bu izin role ekli değil' });
        }

        role.permissions = role.permissions.filter(p => p.toString() !== permissionId);
        await role.save();

        res.json({
            message: 'İzin başarıyla rolden kaldırıldı',
            role: await role.populate('permissions', 'name description')
        });
    } catch (error) {
        res.status(500).json({ message: 'İzin kaldırılamadı', error: error.message });
    }
}; 