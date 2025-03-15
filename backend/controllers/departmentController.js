const Department = require('../models/Department');
const User = require('../models/User');
const Role = require('../models/Role');
const notificationService = require('../services/notificationService');

exports.listDepartments = async (req, res) => {
    try {
        const departments = await Department.find()
            .populate('manager', 'firstName lastName email')
            .populate('parentDepartment', 'name code');
        res.json(departments);
    } catch (error) {
        res.status(500).json({ message: 'Departmanlar alınamadı', error: error.message });
    }
};

exports.getDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id)
            .populate('manager', 'firstName lastName email')
            .populate('parentDepartment', 'name code');
        
        if (!department) {
            return res.status(404).json({ message: 'Departman bulunamadı' });
        }

        const employees = await User.find({ department: department._id })
            .select('-password')
            .populate('roles', 'name description');

        const roles = await Role.find({ department: department._id })
            .populate('permissions');

        res.json({
            department,
            employees,
            roles
        });
    } catch (error) {
        res.status(500).json({ message: 'Departman detayı alınamadı', error: error.message });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const department = new Department({
            ...req.body,
            createdBy: req.user._id
        });
        
        await department.save();
        
        const populatedDepartment = await Department.findById(department._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        await notificationService.createNotificationForAllUsers(
            'Yeni Departman Eklendi',
            `${department.name} departmanı sisteme eklendi.`,
            'info',
            `/dashboard/departments/${department._id}`
        );

        res.status(201).json(populatedDepartment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        Object.assign(department, req.body);
        department.updatedBy = req.user._id;
        
        await department.save();

        const updatedDepartment = await Department.findById(department._id)
            .populate('createdBy', 'firstName lastName email')
            .populate('updatedBy', 'firstName lastName email');

        await notificationService.createNotificationForAllUsers(
            'Departman Güncellendi',
            `${department.name} departmanı güncellendi.`,
            'info',
            `/dashboard/departments/${department._id}`
        );

        res.json(updatedDepartment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        await Department.findByIdAndDelete(req.params.id);

        await notificationService.createNotificationForAllUsers(
            'Departman Silindi',
            `${department.name} departmanı sistemden silindi.`,
            'error',
            '/dashboard/departments'
        );

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Departman hiyerarşisini getir
exports.getDepartmentHierarchy = async (req, res) => {
    try {
        const departments = await Department.find()
            .populate('manager', 'firstName lastName email')
            .populate('parentDepartment', 'name code');

        // Hiyerarşiyi oluştur
        const hierarchy = departments.reduce((acc, dept) => {
            if (!dept.parentDepartment) {
                acc.push({
                    ...dept.toObject(),
                    children: []
                });
            }
            return acc;
        }, []);

        // Alt departmanları ekle
        const addChildren = (parent) => {
            departments.forEach(dept => {
                if (dept.parentDepartment && 
                    dept.parentDepartment._id.toString() === parent._id.toString()) {
                    parent.children.push({
                        ...dept.toObject(),
                        children: []
                    });
                }
            });
            parent.children.forEach(child => addChildren(child));
        };

        hierarchy.forEach(root => addChildren(root));
        res.json(hierarchy);
    } catch (error) {
        res.status(500).json({ message: 'Departman hiyerarşisi alınamadı', error: error.message });
    }
}; 