const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    description: {
        type: String
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    parentDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    location: {
        type: String
    },
    contactInfo: {
       email: String,
       phone: String
    },
    workingHours: {
        start: String,
        end: String
    },
    type: {
        type: String,
        enum: [
            'production',      // Üretim
            'quality',         // Kalite
            'maintenance',     // Bakım
            'warehouse',       // Depo
            'hr',             // İnsan Kaynakları
            'planning',       // Planlama
            'management',     // Yönetim
            'system'          // Sistem
        ],
        required: true
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

// Departman hiyerarşisini kontrol eden metod
departmentSchema.methods.isChildOf = async function(parentId) {
    if (!this.parentDepartment) return false;
    if (this.parentDepartment.toString() === parentId.toString()) return true;
    
    const parent = await this.model('Department').findById(this.parentDepartment);
    if (!parent) return false;
    
    return await parent.isChildOf(parentId);
};

// Departmanın tüm alt departmanlarını getiren metod
departmentSchema.methods.getAllChildren = async function() {
    const children = await this.model('Department').find({ parentDepartment: this._id });
    let allChildren = [...children];
    
    for (const child of children) {
        const grandChildren = await child.getAllChildren();
        allChildren = [...allChildren, ...grandChildren];
    }
    
    return allChildren;
};

module.exports = mongoose.model('Department', departmentSchema); 