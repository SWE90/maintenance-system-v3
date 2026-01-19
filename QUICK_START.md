# 🚀 دليل التشغيل السريع | Quick Start Guide
## نظام الصيانة V3 | Maintenance System V3

---

## 📦 سحب آخر التحديثات | Pull Latest Updates

```bash
# الانتقال للمشروع
cd /Users/iivoiil/maintenance-system/maintenance-system

# عرض الفرع الحالي
git branch

# سحب آخر التحديثات
git pull origin feature/professional-development-phase1-2

# أو التبديل للفرع الرئيسي
# git checkout main && git pull origin main
```

---

## ⚙️ تثبيت المكتبات | Install Dependencies

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3

# تثبيت مكتبات المشروع
npm install

# تثبيت مكتبات API
cd apps/api && npm install

# تثبيت مكتبات Frontend
cd ../web && npm install
```

---

## 🗄️ إعداد قاعدة البيانات | Database Setup

### 1. إنشاء قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
psql -U postgres

# في PostgreSQL:
CREATE DATABASE maintenance_v3;
CREATE USER maintenance_admin WITH PASSWORD 'SecurePass123!';
GRANT ALL PRIVILEGES ON DATABASE maintenance_v3 TO maintenance_admin;
\q
```

### 2. إعداد ملف البيئة

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api

# إذا لم يكن موجود، انسخ من المثال
cp .env.example .env

# حرّر الملف
nano .env
```

**محتوى ملف `.env` الأساسي:**

```env
# Database
DATABASE_URL="postgresql://maintenance_admin:SecurePass123!@localhost:5432/maintenance_v3?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (غيّر هذه المفاتيح!)
JWT_SECRET=your-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Server
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGINS=http://localhost:3001
```

### 3. تطبيق Schema على قاعدة البيانات

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api

# توليد Prisma Client
npx prisma generate

# تطبيق Schema
npx prisma db push

# إضافة بيانات تجريبية (اختياري)
npm run db:seed
```

---

## 🔴 تشغيل Redis

```bash
# تشغيل Redis (في نافذة منفصلة)
redis-server

# أو إذا مثبت عبر Homebrew
brew services start redis

# للتحقق
redis-cli ping  # يجب أن يرجع: PONG
```

---

## 🚀 تشغيل السيرفر | Start Server

### الطريقة السريعة (الكل مع بعض):

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3
npm run dev
```

### تشغيل API لوحده:

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api
npm run dev
```

### تشغيل Frontend لوحده:

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/web
npm run dev
```

---

## 🌐 الروابط المهمة | Important Links

| الخدمة | الرابط |
|--------|--------|
| **API** | http://localhost:3000 |
| **API Docs (Swagger)** | http://localhost:3000/docs |
| **Frontend** | http://localhost:3001 |
| **Prisma Studio** | npx prisma studio → http://localhost:5555 |

---

## 👤 بيانات تسجيل الدخول | Login Credentials

### Admin (مدير النظام)
```
Email: admin@maintenance.com
Password: Admin@123456
```

### Technician (فني)
```
Email: tech@maintenance.com
Password: Tech@123456
```

### Customer (عميل)
```
Email: customer@maintenance.com
Password: Customer@123456
```

---

## ✅ اختبار سريع | Quick Test

```bash
# اختبار API
curl http://localhost:3000/api/v1/health

# تسجيل دخول
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@maintenance.com","password":"Admin@123456"}'
```

---

## 🛠️ أوامر مفيدة | Useful Commands

### إدارة قاعدة البيانات

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api

# فتح Prisma Studio (GUI للبيانات)
npx prisma studio

# إعادة توليد Prisma Client
npx prisma generate

# إعادة تعيين قاعدة البيانات (حذف كل البيانات!)
npx prisma migrate reset
```

### فحص الأخطاء

```bash
# Build TypeScript
npm run build

# فحص ESLint
npm run lint

# إصلاح ESLint
npm run lint:fix
```

---

## 🔧 حل المشاكل | Troubleshooting

### Port مشغول

```bash
# إيقاف Port 3000
lsof -ti:3000 | xargs kill -9

# إيقاف Port 3001
lsof -ti:3001 | xargs kill -9
```

### مشكلة Database

```bash
# التحقق من PostgreSQL
pg_isready

# إعادة تشغيل PostgreSQL
brew services restart postgresql
```

### مشكلة Redis

```bash
# التحقق
redis-cli ping

# إعادة تشغيل
brew services restart redis
```

### Prisma Client مش شغال

```bash
cd /Users/iivoiil/maintenance-system/maintenance-system/v3/apps/api
rm -rf node_modules/.prisma
npx prisma generate
npm run build
```

---

## 📝 سكريبت تشغيل كامل | Complete Start Script

احفظ هذا في ملف `start.sh` في مجلد `v3`:

```bash
#!/bin/bash

echo "🚀 Starting Maintenance System V3..."

# تشغيل Redis إذا مش شغال
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Starting Redis..."
    redis-server --daemonize yes
    sleep 2
fi

# التحقق من PostgreSQL
if ! pg_isready > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    exit 1
fi

# سحب آخر التحديثات
echo "Pulling latest code..."
cd /Users/iivoiil/maintenance-system/maintenance-system
git pull origin feature/professional-development-phase1-2

# تثبيت المكتبات
echo "Installing dependencies..."
cd v3
npm install --silent

# توليد Prisma Client
echo "Generating Prisma Client..."
cd apps/api
npx prisma generate > /dev/null 2>&1

# تشغيل السيرفرات
echo "Starting servers..."
cd ../..
npm run dev &

sleep 5

echo ""
echo "✅ System Started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 API: http://localhost:3000"
echo "📍 Docs: http://localhost:3000/docs"
echo "📍 Frontend: http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 Login: admin@maintenance.com / Admin@123456"
echo ""
```

### استخدام السكريبت:

```bash
# جعله قابل للتنفيذ
chmod +x /Users/iivoiil/maintenance-system/maintenance-system/v3/start.sh

# تشغيله
/Users/iivoiil/maintenance-system/maintenance-system/v3/start.sh
```

---

## 📋 متغيرات البيئة الكاملة | Full Environment Variables

ملف `.env` كامل (نسخ ولصق مباشر):

```env
# ==============================================
# DATABASE
# ==============================================
DATABASE_URL="postgresql://maintenance_admin:SecurePass123!@localhost:5432/maintenance_v3?schema=public"

# ==============================================
# REDIS
# ==============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ==============================================
# JWT SECRETS (غيّر هذي في Production!)
# ==============================================
JWT_SECRET=super-secret-jwt-key-change-this-now
JWT_REFRESH_SECRET=super-secret-refresh-key-change-this-now
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ==============================================
# SERVER
# ==============================================
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# ==============================================
# CORS
# ==============================================
CORS_ORIGINS=http://localhost:3001,http://localhost:3000

# ==============================================
# RATE LIMITING
# ==============================================
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# ==============================================
# FILE UPLOAD
# ==============================================
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# ==============================================
# SECURITY
# ==============================================
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800

# ==============================================
# CACHE
# ==============================================
CACHE_TTL=300
```

---

**آخر تحديث:** 2026-01-19
**الإصدار:** v3.0.0 - Phase 3 & 4 Complete
