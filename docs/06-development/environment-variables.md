# متغيرات البيئة — Nilotic Frost ERP

> **ملاحظة:** البروتوتايب الحالي **لا يستخدم متغيرات بيئة (Environment Variables)** لأنه Frontend-only.
> هذا الملف يوثّق المتغيرات المطلوبة **للتطوير المستقبلي مع Backend**.

---

## الوضع الحالي

| العنصر | القيمة |
|-------|-------|
| ملف `.env` | **غير موجود** |
| ملف `.env.example` | **غير موجود** |
| الإعدادات الحالية | مضمّنة في HTML و JS مباشرة |

---

## القيم المُشفَّرة حالياً في الكود (Hard-coded)

هذه القيم موجودة مباشرة في الكود وستحتاج لتحويلها لمتغيرات بيئة:

### في `index.html` و كل صفحة (Tailwind Theme)
```javascript
// الألوان — hard-coded في كل صفحة HTML
colors: {
  "primary": "#012d1d",
  "secondary": "#0054cd",
  "background": "#f8f9fa",
  "error": "#ba1a1a"
}
```

### في `state.js`
```javascript
// مفتاح التخزين
const ERP_STORAGE_KEY = "NILOTIC_ERP_STATE"; // hard-coded

// سعر الصرف الافتراضي
const DEFAULT_FX_RATE = 53.20; // hard-coded

// أسعار افتراضية للمقاولين
const DEFAULT_CONTRACTOR_RATE = 2.00; // hard-coded

// رسوم المحطة الافتراضية
const DEFAULT_STATION_RATE = 2.50; // hard-coded
```

---

## متغيرات البيئة المطلوبة للـ Backend

### ملف `.env.example` المقترح

```bash
# ============================================
# Nilotic Frost ERP — Environment Variables
# ============================================

# --- Application ---
APP_NAME="Nilotic Frost ERP"
APP_ENV=development          # development | staging | production
APP_VERSION=1.0.0
APP_PORT=3000
APP_URL=http://localhost:3000
APP_DEBUG=true

# --- Database ---
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nilotic_frost_erp
DB_USER=erp_user
DB_PASSWORD=your_secure_password
DB_POOL_MIN=2
DB_POOL_MAX=10

# --- Authentication & Security ---
JWT_SECRET=your_very_long_and_random_secret_key_here
JWT_EXPIRES_IN=8h              # مدة صلاحية التوكن (8 ساعات)
JWT_REFRESH_EXPIRES_IN=7d      # مدة الـ refresh token
BCRYPT_ROUNDS=12               # تعقيد تشفير كلمة المرور

# --- Frontend (CORS) ---
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5500

# --- File Storage ---
STORAGE_DRIVER=local           # local | s3 | gcs
STORAGE_PATH=./storage
# (للـ S3)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=eu-west-1
# AWS_BUCKET=nilotic-frost-erp-files

# --- PDF Generation ---
PDF_GENERATOR=puppeteer        # puppeteer | weasyprint
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# --- Email (للإشعارات) ---
MAIL_DRIVER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=noreply@niloticfrost.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_NAME="Nilotic Frost ERP"

# --- Currency Exchange API (مستقبلي) ---
CURRENCY_API_KEY=your_exchangerate_api_key
CURRENCY_BASE=EGP
CURRENCY_UPDATE_INTERVAL=3600  # كل ساعة

# --- Cache (Redis) ---
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# --- Logging ---
LOG_LEVEL=info                 # debug | info | warn | error
LOG_FILE=./logs/erp.log

# --- Business Defaults (قابل للتغيير) ---
DEFAULT_FX_RATE=53.20          # سعر الصرف الافتراضي عند غياب البيانات
DEFAULT_CONTRACTOR_RATE=2.00   # أتعاب المقاول الافتراضية (ج.م/كجم)
DEFAULT_STATION_RATE=2.50      # رسوم المحطة الافتراضية (ج.م/كجم)
DEFAULT_CURRENCY=EUR
DEFAULT_DELIVERY_TERMS=FOB
```

---

## وصف المتغيرات الحرجة

| المتغير | الوصف | ملاحظة أمنية |
|--------|-------|------------|
| `JWT_SECRET` | مفتاح توقيع JWT tokens | يجب أن يكون 256 bit عشوائي على الأقل — **لا تشاركه** |
| `DB_PASSWORD` | كلمة مرور قاعدة البيانات | **لا تكتبه في الكود مطلقاً** |
| `MAIL_PASSWORD` | كلمة مرور البريد الإلكتروني | استخدم App Password مع Gmail |
| `CURRENCY_API_KEY` | مفتاح API سعر الصرف | خدمات مثل exchangerate-api.com |
| `JWT_EXPIRES_IN` | مدة صلاحية التوكن | 8 ساعات مناسبة لبيئة العمل |

---

## الفرق بين البيئات

| المتغير | Development | Staging | Production |
|--------|------------|---------|-----------|
| `APP_DEBUG` | true | false | false |
| `DB_NAME` | `nilotic_erp_dev` | `nilotic_erp_stg` | `nilotic_erp_prod` |
| `LOG_LEVEL` | debug | info | warn |
| `JWT_EXPIRES_IN` | 24h | 12h | 8h |
| `BCRYPT_ROUNDS` | 8 | 10 | 12 |
