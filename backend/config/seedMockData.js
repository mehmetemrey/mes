const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const Machine = require('../models/Machine');
const ProductionStage = require('../models/ProductionStage');
const ProductionLine = require('../models/ProductionLine');
const JobOrder = require('../models/JobOrder');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

const seedMockData = async () => {
    try {
        const adminUser = await User.findOne({ email: 'johndoe@gmail.com' });
        if (!adminUser) {
            console.log('Admin kullanıcısı bulunamadı. Önce seedAdmin çalıştırılmalı.');
            return;
        }

        const adminId = adminUser._id;

        // 1. Departmanlar
        const departmentsData = [
            {
                name: 'Üretim Departmanı',
                code: 'URT',
                type: 'production',
                description: 'Talaşlı imalat ve montaj operasyonları',
                location: 'Fabrika A Blok',
                contactInfo: { email: 'uretim@fabrika.com', phone: '02125550101' },
                createdBy: adminId
            },
            {
                name: 'Kalite Kontrol',
                code: 'KLT',
                type: 'quality',
                description: 'Girdi ve son ürün kalite güvence',
                location: 'Laboratuvar B Blok',
                contactInfo: { email: 'kalite@fabrika.com', phone: '02125550102' },
                createdBy: adminId
            },
            {
                name: 'Bakım ve Onarım',
                code: 'BKM',
                type: 'maintenance',
                description: 'Planlı ve arızi makine bakım faaliyetleri',
                location: 'Atölye C Blok',
                contactInfo: { email: 'bakim@fabrika.com', phone: '02125550103' },
                createdBy: adminId
            }
        ];

        const savedDepartments = [];
        for (const dept of departmentsData) {
            let existing = await Department.findOne({ code: dept.code });
            if (!existing) {
                existing = await Department.create(dept);
            }
            savedDepartments.push(existing);
        }

        const productionDept = savedDepartments.find(d => d.code === 'URT') || savedDepartments[0];
        const qualityDept = savedDepartments.find(d => d.code === 'KLT') || productionDept;
        const maintenanceDept = savedDepartments.find(d => d.code === 'BKM') || productionDept;

        // 2. Kullanıcılar (Farklı rollerde örnek personel)
        const allRoles = await Role.find({});
        const roleMap = allRoles.reduce((acc, r) => {
            acc[r.name] = r._id;
            return acc;
        }, {});

        const salt = await bcrypt.genSalt(10);
        const defaultUserPassword = await bcrypt.hash('123456', salt);

        const mockUsers = [
            {
                email: 'ahmet.yilmaz@fabrika.com',
                password: defaultUserPassword,
                firstName: 'Ahmet',
                lastName: 'Yılmaz',
                roles: [roleMap['production_manager'] || roleMap['admin'] || roleMap['super_admin']],
                department: productionDept._id,
                phone: '05551112233',
                isActive: true
            },
            {
                email: 'murat.kaya@fabrika.com',
                password: defaultUserPassword,
                firstName: 'Murat',
                lastName: 'Kaya',
                roles: [roleMap['quality_manager'] || roleMap['admin'] || roleMap['super_admin']],
                department: qualityDept._id,
                phone: '05552223344',
                isActive: true
            },
            {
                email: 'caner.demir@fabrika.com',
                password: defaultUserPassword,
                firstName: 'Caner',
                lastName: 'Demir',
                roles: [roleMap['maintenance_manager'] || roleMap['admin'] || roleMap['super_admin']],
                department: maintenanceDept._id,
                phone: '05553334455',
                isActive: true
            },
            {
                email: 'ayse.celik@fabrika.com',
                password: defaultUserPassword,
                firstName: 'Ayşe',
                lastName: 'Çelik',
                roles: [roleMap['production_supervisor'] || roleMap['operator']],
                department: productionDept._id,
                phone: '05554445566',
                isActive: true
            },
            {
                email: 'burak.ozturk@fabrika.com',
                password: defaultUserPassword,
                firstName: 'Burak',
                lastName: 'Öztürk',
                roles: [roleMap['operator']],
                department: productionDept._id,
                phone: '05555556677',
                isActive: true
            }
        ];

        const savedUsers = [];
        for (const u of mockUsers) {
            let existing = await User.findOne({ $or: [{ email: u.email }, { phone: u.phone }] });
            if (!existing) {
                existing = await User.create(u);
            } else {
                await User.updateOne({ _id: existing._id }, { $set: u });
                existing = await User.findById(existing._id);
            }
            savedUsers.push(existing);
        }

        // 3. Makineler
        const machinesData = [
            {
                name: 'CNC Torna',
                code: 'CNC-001',
                type: 'CNC',
                status: 'Operational',
                manufacturer: 'DMG Mori',
                model: 'CTX beta 800',
                serialNumber: 'DMG-2024-8841',
                department: productionDept._id,
                createdBy: adminId,
                updatedBy: adminId
            },
            {
                name: 'Hidrolik Pres',
                code: 'PRS-002',
                type: 'Press',
                status: 'Operational',
                manufacturer: 'Schuler',
                model: 'HP-250T',
                serialNumber: 'SCH-2023-1120',
                department: productionDept._id,
                createdBy: adminId,
                updatedBy: adminId
            },
            {
                name: 'Lazer Kesim Tezgahı',
                code: 'LZR-003',
                type: 'Laser',
                status: 'Operational',
                manufacturer: 'Trumpf',
                model: 'TruLaser 3030',
                serialNumber: 'TRU-2024-5519',
                department: productionDept._id,
                createdBy: adminId,
                updatedBy: adminId
            },
            {
                name: 'Plastik Enjeksiyon',
                code: 'ENJ-004',
                type: 'Injection',
                status: 'Operational',
                manufacturer: 'Engel',
                model: 'victory 330',
                serialNumber: 'ENG-2022-7712',
                department: productionDept._id,
                createdBy: adminId,
                updatedBy: adminId
            }
        ];

        const savedMachines = [];
        for (const mach of machinesData) {
            let existing = await Machine.findOne({ code: mach.code });
            if (!existing) {
                existing = await Machine.create(mach);
            }
            savedMachines.push(existing);
        }

        // 3. Üretim Aşamaları
        const stagesData = [
            {
                name: 'Hammadde Hazırlama',
                description: 'Malzeme kesimi ve ebatlandırma',
                sequence: 1,
                estimatedDuration: 30,
                department: productionDept._id,
                createdBy: adminId
            },
            {
                name: 'Talaşlı İmalat',
                description: 'CNC işleme ve yüzey finisajı',
                sequence: 2,
                estimatedDuration: 60,
                department: productionDept._id,
                createdBy: adminId
            },
            {
                name: 'Kalite Kontrol',
                description: 'Ölçüsel kontrol ve tolerans denetimi',
                sequence: 3,
                estimatedDuration: 20,
                department: savedDepartments.find(d => d.code === 'KLT')?._id || productionDept._id,
                createdBy: adminId
            }
        ];

        const savedStages = [];
        for (const stg of stagesData) {
            let existing = await ProductionStage.findOne({ name: stg.name });
            if (!existing) {
                existing = await ProductionStage.create(stg);
            }
            savedStages.push(existing);
        }

        // 4. Üretim Hatları
        const productionLinesData = [
            {
                name: 'Ana İmalat Hattı',
                code: 'HAT-01',
                description: 'Motor blok ve mekanik parça işleme hattı',
                location: 'Fabrika 1. Kat - A Blok',
                department: productionDept._id,
                capacity: 120,
                capacityUnit: 'adet/saat',
                efficiency: 92,
                status: 'Aktif',
                machines: [savedMachines[0]?._id, savedMachines[3]?._id].filter(Boolean),
                productionStages: [
                    { stage: savedStages[0]._id, sequence: 1 },
                    { stage: savedStages[1]._id, sequence: 2 }
                ],
                personnel: [
                    { employee: savedUsers[0]._id, role: 'Vardiya Amiri', assignmentType: 'Tam Zamanlı' },
                    { employee: savedUsers[1]._id, role: 'Operatör', assignmentType: 'Tam Zamanlı' },
                    { employee: savedUsers[2]._id, role: 'Operatör', assignmentType: 'Vardiyalı' }
                ]
            },
            {
                name: 'Montaj & Paketleme',
                code: 'HAT-02',
                description: 'Plastik gövde montaj ve son ambalajlama hattı',
                location: 'Fabrika 2. Kat - B Blok',
                department: productionDept._id,
                capacity: 250,
                capacityUnit: 'adet/saat',
                efficiency: 85,
                status: 'Aktif',
                machines: [savedMachines[2]?._id].filter(Boolean),
                productionStages: [
                    { stage: savedStages[1]._id, sequence: 1 },
                    { stage: savedStages[2]._id, sequence: 2 }
                ],
                personnel: [
                    { employee: savedUsers[3]._id, role: 'Vardiya Amiri', assignmentType: 'Tam Zamanlı' },
                    { employee: savedUsers[4]._id, role: 'Operatör', assignmentType: 'Tam Zamanlı' }
                ]
            },
            {
                name: 'Pres & Sac Şekillendirme',
                code: 'HAT-03',
                description: 'Gövde sacı ve panel hidrolik pres şekillendirme hattı',
                location: 'Fabrika Zemin Kat - C Blok',
                department: productionDept._id,
                capacity: 80,
                capacityUnit: 'adet/saat',
                efficiency: 78,
                status: 'Aktif',
                machines: [savedMachines[1]?._id].filter(Boolean),
                productionStages: [
                    { stage: savedStages[0]._id, sequence: 1 },
                    { stage: savedStages[1]._id, sequence: 2 }
                ],
                personnel: [
                    { employee: savedUsers[1]._id, role: 'Operatör', assignmentType: 'Tam Zamanlı' },
                    { employee: savedUsers[2]._id, role: 'Teknisyen', assignmentType: 'Vardiyalı' }
                ]
            },
            {
                name: 'Hassas Finisaj Hattı',
                code: 'HAT-04',
                description: 'Yüzey taşlama, tolerans doğrulama ve mikrometrik ölçüm hattı',
                location: 'Fabrika 1. Kat - D Blok',
                department: qualityDept._id,
                capacity: 160,
                capacityUnit: 'adet/saat',
                efficiency: 88,
                status: 'Aktif',
                machines: [savedMachines[4]?._id].filter(Boolean),
                productionStages: [
                    { stage: savedStages[2]._id, sequence: 1 }
                ],
                personnel: [
                    { employee: savedUsers[0]._id, role: 'Vardiya Amiri', assignmentType: 'Tam Zamanlı' },
                    { employee: savedUsers[3]._id, role: 'Kalite Kontrol', assignmentType: 'Tam Zamanlı' }
                ]
            }
        ];

        for (const lineData of productionLinesData) {
            let existingLine = await ProductionLine.findOne({ code: lineData.code });
            if (!existingLine) {
                await ProductionLine.create({
                    ...lineData,
                    createdBy: adminId,
                    updatedBy: adminId
                });
            } else {
                existingLine.name = lineData.name;
                existingLine.description = lineData.description;
                existingLine.location = lineData.location;
                existingLine.capacity = lineData.capacity;
                existingLine.capacityUnit = lineData.capacityUnit;
                existingLine.efficiency = lineData.efficiency;
                existingLine.status = lineData.status;
                existingLine.machines = lineData.machines;
                existingLine.productionStages = lineData.productionStages;
                existingLine.personnel = lineData.personnel;
                existingLine.department = lineData.department;
                await existingLine.save();
            }
        }

        // 5. İş Emirleri
        const sampleJobOrders = [
            {
                orderNumber: 'WO-2026-001',
                jobNumber: 'JOB-8841',
                title: 'Alüminyum Mil İmalatı',
                description: '200 adet Alüminyum 7075 şaft torna işleme',
                status: 'In Progress',
                priority: 'High',
                machine: savedMachines[0]._id,
                productionStage: savedStages[1]._id,
                assignedTo: savedUsers[0]?._id || adminId,
                createdBy: adminId,
                updatedBy: adminId,
                productionTarget: {
                    quantity: 200,
                    unit: 'adet'
                },
                producedQuantity: {
                    quantity: 145,
                    unit: 'adet'
                },
                targetQuantity: 200,
                plannedStartTime: new Date(Date.now() - 3600000 * 2),
                plannedEndTime: new Date(Date.now() + 3600000 * 6),
                plannedDuration: 480
            },
            {
                orderNumber: 'WO-2026-002',
                jobNumber: 'JOB-8842',
                title: 'Gövde Sacı Pres Baskı',
                description: '500 adet pres baskı plaka üretimi',
                status: 'In Progress',
                priority: 'Medium',
                machine: savedMachines[1]._id,
                productionStage: savedStages[0]._id,
                assignedTo: savedUsers[1]?._id || adminId,
                createdBy: adminId,
                updatedBy: adminId,
                productionTarget: {
                    quantity: 500,
                    unit: 'adet'
                },
                producedQuantity: {
                    quantity: 280,
                    unit: 'adet'
                },
                targetQuantity: 500,
                plannedStartTime: new Date(Date.now() + 3600000 * 8),
                plannedEndTime: new Date(Date.now() + 3600000 * 16),
                plannedDuration: 480
            },
            {
                orderNumber: 'WO-2026-003',
                jobNumber: 'JOB-8843',
                title: 'Lazer Kesim Braket Plakaları',
                description: '350 adet paslanmaz çelik montaj braketi lazer kesim',
                status: 'Completed',
                priority: 'High',
                machine: savedMachines[2]._id,
                productionStage: savedStages[0]._id,
                assignedTo: savedUsers[2]?._id || adminId,
                createdBy: adminId,
                updatedBy: adminId,
                productionTarget: {
                    quantity: 350,
                    unit: 'adet'
                },
                producedQuantity: {
                    quantity: 350,
                    unit: 'adet'
                },
                targetQuantity: 350,
                plannedStartTime: new Date(Date.now() - 3600000 * 12),
                plannedEndTime: new Date(Date.now() - 3600000 * 2),
                plannedDuration: 600
            },
            {
                orderNumber: 'WO-2026-004',
                jobNumber: 'JOB-8844',
                title: 'Plastik Gövde Enjeksiyon',
                description: '1000 adet ABS koruma kapağı enjeksiyon baskı',
                status: 'In Progress',
                priority: 'Medium',
                machine: savedMachines[3]._id,
                productionStage: savedStages[1]._id,
                assignedTo: savedUsers[3]?._id || adminId,
                createdBy: adminId,
                updatedBy: adminId,
                productionTarget: {
                    quantity: 1000,
                    unit: 'adet'
                },
                producedQuantity: {
                    quantity: 620,
                    unit: 'adet'
                },
                targetQuantity: 1000,
                plannedStartTime: new Date(Date.now() - 3600000 * 4),
                plannedEndTime: new Date(Date.now() + 3600000 * 10),
                plannedDuration: 840
            },
            {
                orderNumber: 'WO-2026-005',
                jobNumber: 'JOB-8845',
                title: 'Hassas Taşlama ve Finisaj',
                description: '180 adet rulman yatağı taşlama işlemi',
                status: 'Paused',
                priority: 'Critical',
                machine: savedMachines[0]._id,
                productionStage: savedStages[2]._id,
                assignedTo: savedUsers[4]?._id || adminId,
                createdBy: adminId,
                updatedBy: adminId,
                productionTarget: {
                    quantity: 180,
                    unit: 'adet'
                },
                producedQuantity: {
                    quantity: 75,
                    unit: 'adet'
                },
                targetQuantity: 180,
                plannedStartTime: new Date(Date.now() - 3600000 * 6),
                plannedEndTime: new Date(Date.now() + 3600000 * 4),
                plannedDuration: 600
            }
        ];

        for (const jo of sampleJobOrders) {
            let existing = await JobOrder.findOne({ orderNumber: jo.orderNumber });
            if (!existing) {
                await JobOrder.create(jo);
            } else {
                existing.productionTarget = jo.productionTarget;
                existing.producedQuantity = jo.producedQuantity;
                existing.targetQuantity = jo.targetQuantity;
                existing.title = jo.title;
                existing.status = jo.status;
                existing.priority = jo.priority;
                existing.assignedTo = jo.assignedTo;
                await existing.save();
            }
        }

        // 6. Sistem Duyuruları
        const announcementsData = [
            {
                title: 'MES Sistemi Devreye Alındı',
                message: 'Üretim Takip Sistemi yerel sürümü başarıyla başlatıldı. Canlı telemetri ve iş emirleri aktiftir.',
                type: 'info',
                userId: adminId
            },
            {
                title: 'Haftalık Planlı Bakım',
                message: 'CNC Torna ve Hidrolik Pres tezgahlarının periyodik yağlama ve kalibrasyon kontrolü tamamlanmıştır.',
                type: 'announcement',
                userId: adminId
            }
        ];

        for (const ann of announcementsData) {
            const existing = await Announcement.findOne({ title: ann.title });
            if (!existing) {
                await Announcement.create(ann);
            }
        }

        // 7. Sistem Bildirimleri (Kullanıcı Bildirimleri)
        const notificationsData = [
            {
                title: 'İş Emri Başlatıldı',
                message: 'WO-2026-001 nolu Alüminyum Mil İmalatı torna istasyonunda başlatıldı.',
                type: 'info',
                userId: adminId,
                link: '/dashboard/job-orders',
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 15)
            },
            {
                title: 'Hammadde Uyarısı',
                message: 'Pres baskı sacı stoğu minimum seviyeye (%20) yaklaştı.',
                type: 'warning',
                userId: adminId,
                link: '/dashboard/production-lines',
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 45)
            },
            {
                title: 'Üretim Hedefi Tamamlandı',
                message: 'WO-2026-003 Lazer Kesim iş emri %100 oranında tamamlandı.',
                type: 'success',
                userId: adminId,
                link: '/dashboard/job-orders',
                read: false,
                createdAt: new Date(Date.now() - 1000 * 60 * 120)
            },
            {
                title: 'Canlı Telemetri Aktif',
                message: 'Tüm makineler simülatör üzerinden veri akışına bağlandı.',
                type: 'info',
                userId: adminId,
                link: '/dashboard/machines-live',
                read: true,
                createdAt: new Date(Date.now() - 1000 * 60 * 240)
            }
        ];

        for (const notif of notificationsData) {
            const existing = await Notification.findOne({ title: notif.title, userId: notif.userId });
            if (!existing) {
                await Notification.create(notif);
            }
        }

        console.log('[Seed] Örnek tesis verileri (Departmanlar, Makineler, Hatlar, İş Emirleri, Duyurular, Bildirimler) hazırlandı.');
    } catch (error) {
        console.error('Mock veri oluşturma hatası:', error);
    }
};

module.exports = seedMockData;
