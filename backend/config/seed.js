const dotenv = require('dotenv');
const connectDB = require('./db');
const seedRoles = require('./seedRoles');
const seedAdmin = require('./seedAdmin');
const seedMockData = require('./seedMockData');

dotenv.config();

const runSeed = async () => {
  try {
    await connectDB();
    console.log('Roller ve izinler oluşturuluyor...');
    await seedRoles();
    console.log('Varsayılan yönetici hesabı oluşturuluyor...');
    await seedAdmin();
    console.log('Örnek fabrika ve makine verileri oluşturuluyor...');
    await seedMockData();
    console.log('[Seed] Veritabanı kurulumu ve seed işlemi tamamlandı.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Hata:', err.message);
    process.exit(1);
  }
};

runSeed();
