# 🏭 MESSS - Manufacturing Execution System (Üretim Yürütme ve Takip Sistemi)

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20UmiJS-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![WebSocket](https://img.shields.io/badge/RealTime-WebSocket%20%7C%20Socket.IO-010101?logo=socket.io&logoColor=white)](https://socket.io)
[![Python](https://img.shields.io/badge/Simulator-Python%203-3776AB?logo=python&logoColor=white)](https://python.org)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

Endüstri 4.0 ve akıllı fabrika standartlarına uygun; gerçek zamanlı makine telemetrisi, dinamik iş emri yaşam döngüsü, hiyerarşik departman yönetimi ve akıllı anomali tespiti sunan **Bilgisayar Mühendisliği Lisans Bitirme Projesi** kapsamında geliştirilmiş tam teşekküllü bir **Manufacturing Execution System (MES)** platformudur.

---

## 🌟 Temel Fonksiyonel Yetenekler

- **📡 Canlı IoT Telemetrisi:** Python tabanlı simülatör üzerinden endüstriyel makinelerin sıcaklık, RPM (devir), anlık güç tüketimi, çevrim süresi (cycle time), toplam üretim ve fire (rejected) sayaçlarının gerçek zamanlı yayını (WebSocket: `8765`).
- **🚨 Akıllı Anomali ve Alarm Yönetimi:** Kritik sıcaklık artışları (>85°C), aşırı devir dalgalanmaları veya makine arıza durumlarında otomatik anomali sınıflandırması ve Socket.IO üzerinden tüm bağlı kullanıcılara anlık uyarı iletimi.
- **📋 Uçtan Uca İş Emri Takibi:** Planlandı, Devam Ediyor, Duraklatıldı ve Tamamlandı evrelerine sahip iş emirlerinin duraklatma gerekçeleri, gecikme kayıtları ve operatör atamaları ile yönetimi.
- **🏢 Fabrika Organizasyon Hiyerarşisi:** Departmanlar, üretim hatları (Production Lines) ve ardışık üretim aşamalarının (Production Stages) modellenmesi ve görselleştirilmesi.
- **🔐 Granüler Yetkilendirme (RBAC):** CASL ve JWT tabanlı çok katmanlı rol ve izin mimarisi (Super Admin, Yönetici, Mühendis, Vardiya Amiri, Operatör).
- **📊 Performans ve OEE Raporlaması:** Toplam Ekipman Etkinliği (OEE = Kullanılabilirlik × Performans × Kalite), vardiya analitiği ve PDF/dışa aktarım rapor desteği.

---

## 🏛️ Sistem Mimarisi ve Veri Akışı

```text
┌──────────────────────────┐     WebSocket (8765)      ┌───────────────────────────┐
│ Python Machine Simulator │ ────────────────────────> │   Frontend (React/Umi)    │
│  (Sensör Veri Motoru)    │                           │        Port: 8000         │
└────────────┬─────────────┘                           └─────────────┬─────────────┘
             │                                                       │
             │ WebSocket (8765)                                      │ REST API / Socket.IO
             v                                                       v
┌──────────────────────────────────────────────────────────────────────────────────┐
│                           Backend (Node.js / Express)                            │
│                                    Port: 5055                                    │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────────┐   │
│   │   REST Controllers  │  │   Auth Middleware   │  │ Metrics Collector Svc  │   │
│   └─────────────────────┘  └─────────────────────┘  └────────────────────────┘   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Mongoose ODM
                                         v
                            ┌──────────────────────────┐
                            │    MongoDB Veritabanı    │
                            │        Port: 27017       │
                            └──────────────────────────┘
```

---

## 🚀 Hızlı Başlangıç (Yerel Kurulum)

### Sistem Gereksinimleri
- **Node.js:** v18.x veya v20.x
- **MongoDB:** v6.x veya üzeri (yerel servis, Docker veya MongoDB Atlas)
- **Python:** v3.10 veya üzeri

---

### 1. Veritabanını Başlatın (MongoDB)

Eğer Docker kullanıyorsanız:
```bash
docker run -d -p 27017:27017 --name mes-mongo mongo:latest
```
Veya macOS (Homebrew) ile:
```bash
brew services start mongodb-community
```

---

### 2. Backend Kurulumu ve Başlatma

```bash
cd backend

# 1. Bağımlılıkları yükleyin
npm install

# 2. Çevre değişkenlerini hazırlayın
cp .env.example .env

# 3. Veritabanını hazırla (roller, kullanıcılar, makineler, departmanlar, iş emirleri)
npm run seed

# 4. Backend sunucusunu başlatın
npm run dev
```
> Backend API: `http://localhost:5055/api`  
> Sağlık Kontrolü (Healthcheck): `http://localhost:5055/api/health`

---

### 3. Makine Telemetri Simülatörünü Başlatın (Python)

Ayrı bir terminalde:
```bash
# Bağımlılıkları kurun (ilk sefer için):
pip install -r simulator/requirements.txt

# Simülatörü çalıştırın:
python3 simulator/simulator.py
# (Alternatif olarak backend klasöründen: npm run simulator)
```
> Simülatör WebSocket portu: `ws://localhost:8765`

---

### 4. Frontend Kurulumu ve Başlatma

Ayrı bir terminalde:
```bash
cd frontend

# 1. Bağımlılıkları yükleyin
npm install

# 2. Geliştirme sunucusunu başlatın
npm run dev
```
> Uygulama adresi: **`http://localhost:8000`**

---

## 🔑 Örnek Test Kullanıcıları

`npm run seed` komutu çalıştırıldığında oluşturulan fabrika personeli:

| Ad Soyad | E-posta | Şifre | Rol | Departman |
| :--- | :--- | :--- | :--- | :--- |
| **John Doe** | `johndoe@gmail.com` | `admin` | `super_admin` | Sistem Geneli |
| **Ahmet Yılmaz** | `ahmet.yilmaz@fabrika.com` | `123456` | `production_manager` | Üretim Departmanı |
| **Murat Kaya** | `murat.kaya@fabrika.com` | `123456` | `quality_manager` | Kalite Kontrol |
| **Caner Demir** | `caner.demir@fabrika.com` | `123456` | `maintenance_manager` | Bakım ve Onarım |
| **Ayşe Çelik** | `ayse.celik@fabrika.com` | `123456` | `production_supervisor` | Üretim Departmanı |
| **Burak Öztürk** | `burak.ozturk@fabrika.com` | `123456` | `operator` | Üretim Departmanı |

---

## 📡 REST API Endpoint Özeti

| Kategori | Metot & Rota | Açıklama | Yetki |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/auth/login` | JWT ile kullanıcı girişi | Herkes |
| **Auth** | `GET /api/auth/profile` | Profil bilgilerini getirme | Kullanıcı |
| **Makineler** | `GET /api/machines` | Makine listesini getirme ve filtreleme | `maintenance.view` |
| **Makineler** | `POST /api/machines` | Yeni makine tanımlama | `maintenance.create` |
| **İş Emirleri** | `GET /api/job-orders` | İş emirlerini listeleme (sayfalamalı) | `production.view` |
| **İş Emirleri** | `PATCH /api/job-orders/:id/status` | İş emri durumu güncelleme | `production.edit` |
| **Departmanlar**| `GET /api/departments` | Departman listesi | `department.view` |
| **Üretim Hatları**| `GET /api/production-lines` | Üretim hatları listesi | Kullanıcı |
| **Üretim Aşamaları**| `GET /api/production-stages` | Sıralı üretim aşamaları | `production.view` |
| **Raporlar** | `GET /api/reports/factory/performance` | Fabrika genel OEE ve performans | Kullanıcı |
| **Bildirimler**| `GET /api/notifications` | Kullanıcı bildirimlerini getirme | Kullanıcı |
| **Sistem** | `GET /api/health` | DB ve Socket durum sağlık kontrolü | Herkes |

---

## ⚙️ Çevre Değişkenleri (`backend/.env`)

| Değişken | Varsayılan | Açıklama |
| :--- | :--- | :--- |
| `PORT` | `5055` | Express HTTP sunucu dinleme portu |
| `NODE_ENV` | `development` | Çalışma ortamı (`development` / `production`) |
| `MONGO_URI` | `mongodb://localhost:27017/mes_db` | MongoDB bağlantı adresi |
| `JWT_SECRET` | - | JWT kimlik doğrulama gizli anahtarı |
| `FRONTEND_URL` | `http://localhost:8000` | İzin verilen istemci kök adresi |
| `ALLOWED_ORIGINS`| `http://localhost:8000,http://127.0.0.1:8000` | CORS izinli ek istemci adresleri |
| `SIMULATOR_WS_URL`| `ws://localhost:8765` | Telemetri simülatörünün WebSocket adresi |

---

## 🧪 Kalite ve Doğrulama

- **TypeScript Tip Güvenliği:** Frontend için `npx tsc --noEmit` ile 0 tip hatası doğrulanmıştır.
- **Üretim Paketi:** Frontend `npm run build` ile başarılı bir şekilde derlenmektedir.
- **API Sağlığı:** `GET /api/health` yanıtı ile veritabanı ve Socket.IO servisleri teyit edilmektedir.

---

## 📄 Lisans

Bu proje [GPL-3.0](LICENSE) lisansı altında korunmaktadır.
