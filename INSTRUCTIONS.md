# 📖 تعليمات تشغيل نظام الصيانة V3
# Maintenance System V3 - Complete Instructions

---

## 🎯 طريقة التشغيل السريعة | Quick Start (Recommended)

### خطوة واحدة فقط:

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3
./start.sh
```

السكريبت يقوم بكل شيء تلقائياً:
- ✅ التحقق من Redis و PostgreSQL
- ✅ سحب آخر التحديثات من GitHub
- ✅ تثبيت المكتبات
- ✅ توليد Prisma Client
- ✅ تشغيل API + Frontend

---

## 📥 سحب آخر التحديثات | Pull Latest Updates

### الطريقة 1: من داخل السكريبت (تلقائي)
السكريبت `start.sh` يسحب التحديثات تلقائياً

### الطريقة 2: يدوياً

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system

# معرفة الفرع الحالي
git branch

# سحب آخر التحديثات
git pull origin feature/professional-development-phase1-2

# أو للفرع الرئيسي
# git checkout main && git pull origin main
```

---

## 🚀 تشغيل السيرفر | Start Server

### الطريقة 1: باستخدام السكريبت (موصى به) ⭐

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3
./start.sh
```

### الطريقة 2: تشغيل يدوي

```bash
# 1. تشغيل Redis
redis-server --daemonize yes
# أو
brew services start redis

# 2. التأكد من PostgreSQL
pg_isready

# 3. الانتقال للمشروع
cd /Users/iivoiil/maintenance-system/maintenance-system/v3

# 4. تثبيت المكتبات
npm install

# 5. توليد Prisma Client
cd apps/api
npx prisma generate

# 6. تشغيل السيرفرات
cd ../..
npm run dev
```

### الطريقة 3: تشغيل API فقط

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api
npm run dev
```

### الطريقة 4: تشغيل Frontend فقط

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/web
npm run dev
```

---

## 🌐 الروابط المهمة | Important Links

بعد تشغيل السيرفر، استخدم هذه الروابط:

| الخدمة | الرابط | الوصف |
|--------|--------|-------|
| **🔌 API Server** | http://localhost:3000 | Backend API |
| **📚 API Documentation** | http://localhost:3000/docs | Swagger Docs |
| **🌐 Frontend** | http://localhost:3001 | Next.js App |
| **🗄️ Prisma Studio** | `npx prisma studio` → http://localhost:5555 | Database GUI |

### فتح الروابط:

```bash
# فتح API Docs
open http://localhost:3000/docs

# فتح Frontend
open http://localhost:3001

# فتح Prisma Studio
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api
npx prisma studio
```

---

## 👤 بيانات تسجيل الدخول | Login Credentials

### مدير النظام | Admin
```
البريد الإلكتروني | Email: admin@maintenance.com
كلمة المرور | Password: Admin@123456
الدور | Role: admin
```

**استخدمه للوصول الكامل للنظام**

### الفني | Technician
```
البريد الإلكتروني | Email: tech@maintenance.com
كلمة المرور | Password: Tech@123456
الدور | Role: technician
```

**استخدمه لاختبار وظائف الفني**

### العميل | Customer
```
البريد الإلكتروني | Email: customer@maintenance.com
كلمة المرور | Password: Customer@123456
الدور | Role: customer
```

**استخدمه لاختبار وظائف العميل**

---

## ✅ اختبار سريع | Quick Test

### 1. اختبار API

```bash
# اختبار صحة السيرفر
curl http://localhost:3000/api/v1/health

# يجب أن يرجع:
# {"status":"ok","timestamp":"...","uptime":...}
```

### 2. تسجيل الدخول

```bash
# تسجيل دخول Admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@maintenance.com",
    "password": "Admin@123456"
  }'

# يجب أن يرجع access_token و refresh_token
```

### 3. اختبار من المتصفح

افتح: http://localhost:3000/docs

جرب API endpoints مباشرة من Swagger UI.

---

## 🔧 أوامر مفيدة | Useful Commands

### إدارة قاعدة البيانات

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api

# فتح Prisma Studio (GUI للبيانات)
npx prisma studio

# إضافة بيانات تجريبية
npm run db:seed

# إعادة توليد Prisma Client بعد تغيير Schema
npx prisma generate

# تطبيق Schema على Database
npx prisma db push

# إعادة تعيين Database (حذف كل البيانات!)
npx prisma migrate reset
```

### فحص الأخطاء

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api

# Build TypeScript
npm run build

# فحص ESLint
npm run lint

# إصلاح ESLint تلقائياً
npm run lint:fix

# تشغيل الاختبارات
npm run test
```

### إيقاف السيرفرات

```bash
# إيقاف Port 3000 (API)
lsof -ti:3000 | xargs kill -9

# إيقاف Port 3001 (Frontend)
lsof -ti:3001 | xargs kill -9

# أو إذا شغال بـ start.sh، اضغط Ctrl+C
```

---

## 🆘 حل المشاكل | Troubleshooting

### ❌ Port already in use

```bash
# إيقاف العملية على Port 3000
lsof -ti:3000 | xargs kill -9

# إيقاف العملية على Port 3001
lsof -ti:3001 | xargs kill -9
```

### ❌ Cannot connect to PostgreSQL

```bash
# التحقق من تشغيل PostgreSQL
pg_isready

# إعادة تشغيل PostgreSQL
brew services restart postgresql

# عرض قواعد البيانات
psql -U postgres -c "\l"

# إنشاء قاعدة البيانات إذا لم تكن موجودة
psql -U postgres -c "CREATE DATABASE maintenance_v3;"
```

### ❌ Redis connection failed

```bash
# التحقق من Redis
redis-cli ping
# يجب أن يرجع: PONG

# تشغيل Redis
redis-server --daemonize yes

# أو عبر Homebrew
brew services start redis

# إعادة تشغيل Redis
brew services restart redis
```

### ❌ Prisma Client not generated

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api

# حذف Prisma القديم
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

# إعادة التوليد
npx prisma generate

# إعادة البناء
npm run build
```

### ❌ npm install failed

```bash
# حذف node_modules و إعادة التثبيت
cd /Users/iivoiil/maintenance-system/maintenance-system/v3
rm -rf node_modules package-lock.json
npm install

# للـ API
cd apps/api
rm -rf node_modules package-lock.json
npm install

# للـ Frontend
cd ../web
rm -rf node_modules package-lock.json
npm install
```

### ❌ Database connection error

```bash
# تأكد من صحة ملف .env
cat /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api/.env | grep DATABASE_URL

# إذا لم يكن موجود، انسخ من المثال
cp .env.example .env
nano .env

# تأكد من صحة الاتصال
npx prisma db push
```

### ❌ JWT token invalid

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api

# تأكد من وجود JWT_SECRET في .env
cat .env | grep JWT_SECRET

# إذا لم يكن موجود، أضف واحد جديد
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env
```

---

## 📁 بنية المشروع | Project Structure

```
v3/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── common/         # Shared code
│   │   │   └── main.ts         # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── seed.ts         # Seed data
│   │   ├── .env                # Environment variables
│   │   └── package.json
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router
│       │   ├── components/     # React components
│       │   └── lib/            # Utilities
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types/utils
│
├── QUICK_START.md              # هذا الملف
├── start.sh                    # سكريبت التشغيل
└── package.json                # Root package
```

---

## 🔐 الأمان | Security Notes

### في بيئة التطوير:

- ✅ استخدم بيانات اختبار فقط
- ✅ لا تشارك ملف `.env`
- ✅ المفاتيح الحالية للتطوير فقط

### قبل Production:

```bash
# غيّر JWT secrets
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env.production
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env.production

# غيّر Database password
# غيّر كل المفاتيح السرية
```

---

## 📊 المميزات المتاحة | Available Features

### Phase 3 ✅ (مكتمل)
- 🔒 نظام أمان متقدم (IP throttling, account lockout)
- 👥 إدارة الجلسات (Session management)
- 📁 أمان تحميل الملفات
- 🛡️ Helmet.js security headers
- ⚡ Redis caching layer

### Phase 4 ✅ (مكتمل)
- 🗄️ قاعدة بيانات موسعة (26 جدول)
- 🔧 إدارة قطع الغيار (Spare parts)
- 🏭 إدارة الورش (Workshops)
- 📅 نظام المواعيد (Appointments)
- 💰 تتبع التكاليف (Repair costs)
- 📊 KPI Snapshots تلقائية (Cron jobs)

### الجداول الأساسية:
- Users, RefreshTokens, Otps
- Tickets, TicketRatings
- Categories
- PartsRequests, SparePartRequestItems
- Notifications
- SparePartCategories, Suppliers, SpareParts
- Appointments
- RepairCosts
- Workshops, WorkshopJobs
- KpiSnapshots

---

## 📞 الدعم | Support

### ملفات مهمة للمراجعة:

- **دليل التشغيل السريع**: [QUICK_START.md](./QUICK_START.md)
- **وثائق الأمان**: [apps/api/SECURITY.md](./apps/api/SECURITY.md)
- **Database Schema**: [apps/api/prisma/schema.prisma](./apps/api/prisma/schema.prisma)

### الأوامر الأكثر استخداماً:

```bash
# تشغيل كل شيء
./start.sh

# سحب آخر تحديثات
git pull origin feature/professional-development-phase1-2

# إضافة بيانات تجريبية
npm run db:seed

# فتح Database GUI
npx prisma studio

# إيقاف السيرفرات
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

---

## 🎉 خلاصة

**للتشغيل السريع:**

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3
./start.sh
```

**ثم افتح:**
- API Docs: http://localhost:3000/docs
- Frontend: http://localhost:3001

**سجل دخول بـ:**
- admin@maintenance.com / Admin@123456

**استمتع! 🚀**

---

**آخر تحديث:** 2026-01-19
**الإصدار:** v3.0.0
**الحالة:** Phase 3 & 4 Complete ✅
