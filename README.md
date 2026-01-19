# 🚀 نظام الصيانة V3 | Maintenance System V3

نظام شامل لإدارة الصيانة مبني على NestJS و Next.js مع قاعدة بيانات PostgreSQL و Redis.

---

## ⚡ تشغيل سريع | Quick Start

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3
./start.sh
```

**بس كذا! السكريبت يسوي كل شي تلقائي** ✨

---

## 📚 التوثيق | Documentation

- **[📖 INSTRUCTIONS.md](./INSTRUCTIONS.md)** - دليل شامل كامل (موصى به)
- **[🚀 QUICK_START.md](./QUICK_START.md)** - دليل سريع مختصر
- **[🔒 SECURITY.md](./apps/api/SECURITY.md)** - وثائق الأمان

---

## 🌐 الروابط | Links

| الخدمة | الرابط |
|--------|--------|
| API | http://localhost:3000 |
| API Docs | http://localhost:3000/docs |
| Frontend | http://localhost:3001 |

---

## 👤 تسجيل دخول | Login

```
Email: admin@maintenance.com
Password: Admin@123456
```

---

## 🛠️ التقنيات | Tech Stack

### Backend
- **NestJS** - Node.js framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **Redis** - Caching & Sessions
- **JWT** - Authentication
- **BullMQ** - Job Queue
- **Helmet.js** - Security

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components

---

## ✅ المميزات | Features

### Phase 3 ✅
- 🔒 نظام أمان متقدم
- 👥 إدارة الجلسات
- 📁 أمان تحميل الملفات
- 🛡️ HTTP Security Headers
- ⚡ Redis Caching

### Phase 4 ✅
- 🗄️ قاعدة بيانات موسعة (26 جدول)
- 🔧 إدارة قطع الغيار
- 🏭 إدارة الورش
- 📅 نظام المواعيد
- 💰 تتبع التكاليف
- 📊 KPI Snapshots

---

## 📋 الأوامر المهمة | Important Commands

```bash
# تشغيل السيرفر
./start.sh

# سحب آخر تحديثات
git pull origin feature/professional-development-phase1-2

# إضافة بيانات تجريبية
npm run db:seed

# فتح Database GUI
npx prisma studio

# إيقاف السيرفرات
lsof -ti:3000 | xargs kill -9
```

---

## 🏗️ البنية | Structure

```
v3/
├── apps/
│   ├── api/          # NestJS Backend
│   └── web/          # Next.js Frontend
├── packages/
│   └── shared/       # Shared code
├── start.sh          # Start script
└── README.md         # هذا الملف
```

---

## 🔧 المتطلبات | Requirements

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6
- npm or yarn

---

## 📞 الدعم | Support

راجع [INSTRUCTIONS.md](./INSTRUCTIONS.md) للدليل الشامل

---

**Version:** v3.0.0 | **Status:** Phase 3 & 4 Complete ✅
