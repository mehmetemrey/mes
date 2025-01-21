const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false, // Changed to false as password will be set later
        select: false
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    }],
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date
    },
    passwordSetupToken: {
        type: String
    },
    passwordSetupTokenExpires: {
        type: Date
    },
    passwordChangeCode: {
        type: String,
    },
    passwordChangeCodeExpires: {
        type: Date,
    }
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Kullanıcının tam adını döndüren virtual
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.methods.getAllDepartments = async function() {
    if (!this.department) return [];
    
    const department = await this.model('Department').findById(this.department);
    if (!department) return [];
    
    const children = await department.getAllChildren();
    return [department, ...children];
};

module.exports = mongoose.model('User', userSchema); 