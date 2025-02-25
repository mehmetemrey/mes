const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        // Super admin rolünü bul
        const superAdminRole = await Role.findOne({ name: 'super_admin' });
        
        if (!superAdminRole) {
            console.log('Super admin rolü bulunamadı. Önce rolleri oluşturun.');
            return;
        }

        // Şifreyi hashle
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt);

        // Super admin kullanıcısı var mı kontrol et
        let admin = await User.findOne({ email: 'johndoe@gmail.com' });
        
        if (admin) {
            admin.password = hashedPassword;
            admin.isActive = true;
            admin.roles = [superAdminRole._id];
            await admin.save();
            console.log('Super admin hesabı güncellendi (Şifre: admin)');
            return;
        }

        // Super admin kullanıcısını oluştur
        admin = new User({
            email: 'johndoe@gmail.com',
            password: hashedPassword,
            firstName: 'John',
            lastName: 'Doe',
            roles: [superAdminRole._id],
            phone: '05555555555',
            isActive: true
        });

        await admin.save();

        console.log('Super admin hesabı başarıyla oluşturuldu');
        console.log('Email: johndoe@gmail.com');
        console.log('Şifre: admin');
    } catch (error) {
        console.error('Super admin oluşturulurken hata:', error);
        throw error;
    }
};

module.exports = seedAdmin; 