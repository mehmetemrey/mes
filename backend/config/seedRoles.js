const Role = require('../models/Role');
const Permission = require('../models/Permission');

const defaultPermissions = [
    // Sistem izinleri
    { name: 'system.view', description: 'Sistem ayarlarını görüntüleme', module: 'system', action: 'view' },
    { name: 'system.manage', description: 'Sistem ayarlarını yönetme', module: 'system', action: 'manage' },
    
    // Kullanıcı izinleri
    { name: 'user.view', description: 'Kullanıcıları görüntüleme', module: 'hr', action: 'view' },
    { name: 'user.create', description: 'Kullanıcı oluşturma', module: 'hr', action: 'create' },
    { name: 'user.edit', description: 'Kullanıcı düzenleme', module: 'hr', action: 'edit' },
    { name: 'user.delete', description: 'Kullanıcı silme', module: 'hr', action: 'delete' },
    
    // Departman izinleri
    { name: 'department.view', description: 'Departmanları görüntüleme', module: 'hr', action: 'view' },
    { name: 'department.create', description: 'Departman oluşturma', module: 'hr', action: 'create' },
    { name: 'department.edit', description: 'Departman düzenleme', module: 'hr', action: 'edit' },
    { name: 'department.delete', description: 'Departman silme', module: 'hr', action: 'delete' },
    
    // Rol izinleri
    { name: 'role.view', description: 'Rolleri görüntüleme', module: 'system', action: 'view' },
    { name: 'role.create', description: 'Rol oluşturma', module: 'system', action: 'create' },
    { name: 'role.edit', description: 'Rol düzenleme', module: 'system', action: 'edit' },
    { name: 'role.delete', description: 'Rol silme', module: 'system', action: 'delete' },
    
    // Üretim izinleri
    { name: 'production.view', description: 'Üretim verilerini görüntüleme', module: 'production', action: 'view' },
    { name: 'production.create', description: 'Üretim kaydı oluşturma', module: 'production', action: 'create' },
    { name: 'production.edit', description: 'Üretim kaydı düzenleme', module: 'production', action: 'edit' },
    { name: 'production.delete', description: 'Üretim kaydı silme', module: 'production', action: 'delete' },
    
    // Kalite izinleri
    { name: 'quality.view', description: 'Kalite verilerini görüntüleme', module: 'quality', action: 'view' },
    { name: 'quality.create', description: 'Kalite kaydı oluşturma', module: 'quality', action: 'create' },
    { name: 'quality.edit', description: 'Kalite kaydı düzenleme', module: 'quality', action: 'edit' },
    { name: 'quality.delete', description: 'Kalite kaydı silme', module: 'quality', action: 'delete' },
    
    // Bakım izinleri
    { name: 'maintenance.view', description: 'Bakım verilerini görüntüleme', module: 'maintenance', action: 'view' },
    { name: 'maintenance.create', description: 'Bakım kaydı oluşturma', module: 'maintenance', action: 'create' },
    { name: 'maintenance.edit', description: 'Bakım kaydı düzenleme', module: 'maintenance', action: 'edit' },
    { name: 'maintenance.delete', description: 'Bakım kaydı silme', module: 'maintenance', action: 'delete' },
    
    // Raporlama izinleri
    { name: 'report.view', description: 'Raporları görüntüleme', module: 'reports', action: 'view' },
    { name: 'report.create', description: 'Rapor oluşturma', module: 'reports', action: 'create' },
    { name: 'report.edit', description: 'Rapor düzenleme', module: 'reports', action: 'edit' },
    { name: 'report.delete', description: 'Rapor silme', module: 'reports', action: 'delete' }
];

const defaultRoles = [
    {
        name: 'super_admin',
        description: 'Sistem yöneticisi - Tüm yetkilere sahip',
        level: 1,
        scope: 'global',
        permissions: [] // Tüm izinler eklenecek
    },
    {
        name: 'general_manager',
        description: 'Genel müdür - Tüm departmanları yönetebilir',
        level: 2,
        scope: 'global',
        permissions: [] // Tüm izinler eklenecek
    },
    {
        name: 'production_manager',
        description: 'Üretim müdürü - Üretim departmanını yönetir',
        level: 3,
        scope: 'department',
        permissions: [] // Üretim ve ilgili izinler eklenecek
    },
    {
        name: 'quality_manager',
        description: 'Kalite müdürü - Kalite departmanını yönetir',
        level: 3,
        scope: 'department',
        permissions: [] // Kalite ve ilgili izinler eklenecek
    },
    {
        name: 'maintenance_manager',
        description: 'Bakım müdürü - Bakım departmanını yönetir',
        level: 3,
        scope: 'department',
        permissions: [] // Bakım ve ilgili izinler eklenecek
    },
    {
        name: 'production_supervisor',
        description: 'Üretim süpervizörü - Üretim hattını yönetir',
        level: 4,
        scope: 'team',
        permissions: [] // Üretim görüntüleme ve düzenleme izinleri eklenecek
    },
    {
        name: 'operator',
        description: 'Operatör - Temel işlemleri gerçekleştirir',
        level: 5,
        scope: 'team',
        permissions: [] // Sadece görüntüleme ve temel işlem izinleri eklenecek
    }
];

const seedRoles = async () => {
    try {
        // Mevcut izinleri kontrol et veya oluştur
        let createdPermissions = await Permission.find({});
        if (createdPermissions.length === 0) {
            createdPermissions = await Permission.insertMany(defaultPermissions);
        } else {
            // Eksik izinleri ekle
            for (const p of defaultPermissions) {
                const exists = createdPermissions.some(cp => cp.name === p.name);
                if (!exists) {
                    const newP = await Permission.create(p);
                    createdPermissions.push(newP);
                }
            }
        }
        
        // İzinleri isimlerine göre map'le
        const permissionMap = createdPermissions.reduce((map, permission) => {
            map[permission.name] = permission._id;
            return map;
        }, {});

        // Rollere izinleri ata
        for (const role of defaultRoles) {
            let rolePermissions = [];
            
            // Super admin ve genel müdür tüm izinlere sahip
            if (role.name === 'super_admin' || role.name === 'general_manager') {
                rolePermissions = createdPermissions.map(p => p._id);
            }
            // Üretim müdürü
            else if (role.name === 'production_manager') {
                rolePermissions = createdPermissions
                    .filter(p => p.name.startsWith('production.') || 
                               p.name.startsWith('report.') ||
                               p.name.startsWith('user.view') ||
                               p.name.startsWith('department.view') ||
                               p.name.startsWith('maintenance.view') ||
                               p.name.startsWith('quality.view') ||
                               p.name.startsWith('role.view'))
                    .map(p => p._id);
            }
            // Kalite müdürü
            else if (role.name === 'quality_manager') {
                rolePermissions = createdPermissions
                    .filter(p => p.name.startsWith('quality.') || 
                               p.name.startsWith('report.') ||
                               p.name.startsWith('production.view') ||
                               p.name.startsWith('user.view') ||
                               p.name.startsWith('department.view'))
                    .map(p => p._id);
            }
            // Bakım müdürü
            else if (role.name === 'maintenance_manager') {
                rolePermissions = createdPermissions
                    .filter(p => p.name.startsWith('maintenance.') || 
                               p.name.startsWith('report.') ||
                               p.name.startsWith('production.view') ||
                               p.name.startsWith('user.view') ||
                               p.name.startsWith('department.view'))
                    .map(p => p._id);
            }
            // Üretim süpervizörü: üretim tam yetkisi + tüm modülleri görüntüleme
            else if (role.name === 'production_supervisor') {
                rolePermissions = createdPermissions
                    .filter(p => p.name.startsWith('production.') ||
                               p.name.endsWith('.view'))
                    .map(p => p._id);
            }
            // Operatör: tüm görüntüleme izinleri + temel üretim işlemleri
            else if (role.name === 'operator') {
                rolePermissions = createdPermissions
                    .filter(p => p.name.endsWith('.view') || 
                               p.name === 'production.create' ||
                               p.name === 'production.edit')
                    .map(p => p._id);
            }

            // Upsert role
            let existingRole = await Role.findOne({ name: role.name });
            if (!existingRole) {
                await Role.create({
                    ...role,
                    permissions: rolePermissions
                });
            } else {
                existingRole.permissions = rolePermissions;
                existingRole.description = role.description;
                existingRole.level = role.level;
                existingRole.scope = role.scope;
                await existingRole.save();
            }
        }

        console.log('[Seed] Default roller ve izinler eşitlendi');
    } catch (error) {
        console.error('Roller ve izinler oluşturulurken hata:', error);
        throw error;
    }
};

module.exports = seedRoles; 