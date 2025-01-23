const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    level: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
        max: 10
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    parentRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    },
    scope: {
        type: String,
        enum: ['global', 'department', 'team'],
        default: 'department'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Rol hiyerarşisini kontrol eden metod
roleSchema.methods.hasPermission = async function(permissionId) {
    // Kendi yetkilerini kontrol et
    if (this.permissions.includes(permissionId)) {
        return true;
    }
    
    // Üst rolün yetkilerini kontrol et
    if (this.parentRole) {
        const parentRole = await this.model('Role').findById(this.parentRole);
        if (parentRole) {
            return await parentRole.hasPermission(permissionId);
        }
    }
    
    return false;
};

// Rolün departman hiyerarşisindeki tüm departmanları getiren metod
roleSchema.methods.getAllDepartments = async function() {
    if (!this.department) return [];
    
    const department = await this.model('Department').findById(this.department);
    if (!department) return [];
    
    const children = await department.getAllChildren();
    return [department, ...children];
};

module.exports = mongoose.model('Role', roleSchema); 