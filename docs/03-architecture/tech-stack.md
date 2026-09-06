# المكدس التقني والمكتبات المحددة بالكامل (Tech Stack & Exact Packages)

> **القرار المعماري المحدث:**
> بناء النظام كـ Full-Stack Web Application باستخدام **Next.js 14+ (App Router)**، مع **Prisma ORM** لإدارة قاعدة البيانات والاستعلامات وعمليات الـ Type-safe Mutations، وقاعدة بيانات **Supabase (PostgreSQL 15)** للاستضافة والـ Auth والـ Storage والـ Realtime.

---

## 1. جدول الحزم والمكتبات المحددة بدقة (Exact Dependencies Matrix)

هذا هو ملف `package.json` المعتمد للنظام الجديد بالنسخ المتوافقة والمختبرة:

```json
{
  "name": "nilotic-frost-erp",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "prisma db seed"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  "dependencies": {
    "next": "14.2.11",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    
    "@prisma/client": "^5.19.1",
    
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.45.4",
    
    "zod": "^3.23.8",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    
    "@tanstack/react-table": "^8.20.5",
    "@tanstack/react-query": "^5.56.2",
    
    "lucide-react": "^0.439.0",
    "tailwindcss": "^3.4.11",
    "tailwind-merge": "^2.5.2",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.0",
    "tailwindcss-animate": "^1.0.7",
    
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    
    "sonner": "^1.5.0",
    
    "@react-pdf/renderer": "^3.4.4",
    "xlsx": "^0.18.5",
    
    "recharts": "^2.12.7",
    
    "date-fns": "^3.6.0",
    "numeral": "^2.0.6"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "@types/node": "^20.16.5",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/numeral": "^2.0.5",
    
    "prisma": "^5.19.1",
    "ts-node": "^10.9.2",
    
    "postcss": "^8.4.45",
    "autoprefixer": "^10.4.20",
    "@tailwindcss/forms": "^0.5.9",
    "@tailwindcss/typography": "^0.5.15"
  }
}
```

---

## 2. مبررات وتوزيع أدوار التقنيات (Why This Stack)

### أ. Prisma ORM مع Supabase (The Core Data Engine)
- **لماذا Prisma؟**
  - **Type Safety كاملة:** يمنع النموذج البرمجي المنخفض التكلفة من كتابة استعلامات خاطئة أو تمرير حقول غير موجودة.
  - **إدارة العلاقات المعقدة:** مثل جلب الشحنة مع تفاصيل العميل، والباتشات المخصصة، وعمليات التدوير التابعة لها في استعلام واحد:
    ```ts
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        customer: true,
        allocatedBatches: {
          include: { finishedGoodsBatch: true }
        }
      }
    });
    ```
  - **المعاملات الذرية الصارمة (`prisma.$transaction`):** ضمان خصم رصيد الخام والمستلزمات وتوليد باتش الجاهز وقيد المقاول دفعة واحدة، وفي حال حدوث أي خطأ يتم عمل Rollback فوري دون تلف بالبيانات.
- **كيف تتكامل Prisma مع Supabase؟**
  - قاعدة بيانات Supabase توفر اتصالين في ملف `.env`:
    1. `DATABASE_URL`: اتصال مجمّع (Connection Pooler عبر PgBouncer) على المنفذ `6543` للـ Serverless / Server Actions.
    2. `DIRECT_URL`: اتصال مباشر على المنفذ `5432` للـ Migrations عبر `prisma migrate`.

### ب. Supabase Auth + Storage + Realtime
- **Supabase Auth (`@supabase/ssr`):** إدارة الجلسات والكوكيز المشفرة وتكاملها مع Next.js Middleware لتأمين المسارات.
- **Supabase Storage:** تخزين ملفات PDF الخاصة بالفواتير المعتمدة وبوالص الشحن وصور شهادات التفتيش والتحاليل المعملية.
- **Supabase Realtime:** تنبيهات حية عند انخفاض رصيد مستلزمات التعبئة أو تحديث رصيد البنوك.

### ج. واجهة المستخدم والتفاعلية (UI & UX - shadcn/ui Architecture)
- **shadcn/ui (Radix UI + Tailwind CSS):** منظومة المكونات الرسمية المعتمدة للواجهة. ليست مكتبة خارجية مغلقة بل كود مفتوح يتم توليده وإدارته مباشرة داخل المشروع في `@/components/ui`:
  - **امتلاك الكود بالكامل (Code Ownership):** سهولة تخصيص أنماط الحقول والجداول والأزرار دون قيود المكتبات الجامدة.
  - **إمكانية الوصول القياسية (WAI-ARIA Accessibility):** مبنية على Radix UI primitives لضمان تفاعل سلس بالكامل عبر لوحة المفاتيح وقارئات الشاشة.
  - **دعم الاتجاه العربي الكامل (RTL Native):** تتكامل بسلاسة مع متغيرات الـ Tailwind وتدعم `dir="rtl"` في كافة القوائم المنسدلة (Dropdowns)، الحوارات (Dialogs)، والأدراج (Sheets).
  - **تكامل عضوي مع النماذج والجداول:** توافق مباشر مع `react-hook-form` و `zod` عبر مكونات Form/FormField، ومع `TanStack Table` لعرض جداول البيانات الكثيفة.
- **Lucide React:** حزمة الأيقونات القياسية المنسجمة مع مكونات shadcn/ui.
- **TanStack Table v8:** للجداول المعقدة ذات الأعمدة المتعددة والفلاتر والفرز اللحظي (مثل جدول كشف الحسابات وجدول تفاصيل الباتشات).
- **Sonner:** مكتبة إشعارات Toast الحديثة الموصى بها في shadcn/ui والتي تدعم الاتجاه العربي RTL وموقع التنبيهات بمرونة.
- **@react-pdf/renderer & xlsx:** لتوليد فواتير التصدير الرسمية وتصدير الدفاتر الحسابية بصيغة Excel لمدققي الحسابات.

### د. ملف إعداد shadcn المعتمد (`components.json`)
يتم وضع هذا الملف في جذر المشروع لضبط مسارات التوليد التلقائي لمكونات shadcn:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## 3. إعداد الاتصال بين Prisma و Supabase في ملف `.env`

```env
# اتصال Prisma المجمّع (للتشغيل والـ Server Actions)
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# اتصال Prisma المباشر (للـ Migrations والـ CLI فقط)
DIRECT_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# مفاتيح Supabase للواجهة والـ Auth
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"
```

---

## 4. نمط Prisma Client الموحد (Singleton Pattern)

الملف: `lib/prisma.ts`

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```
