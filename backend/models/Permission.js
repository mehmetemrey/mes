const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true,
        enum: [
            'production',      // Üretim
            'quality',         // Kalite
            'maintenance',     // Bakım
            'warehouse',       // Depo
            'hr',             // İnsan Kaynakları
            'planning',       // Planlama
            'reports',        // Raporlar
            'system'          // Sistem
        ]
    },
    action: {
        type: String,
        required: true,
        enum: [
            'view',           // Görüntüleme
            'create',         // Oluşturma
            'edit',           // Düzenleme
            'delete',         // Silme
            'approve',        // Onaylama
            'export',         // Dışa Aktarma
            'manage'          // Yönetme
        ]
    }
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema); 