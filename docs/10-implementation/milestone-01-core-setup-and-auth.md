# Milestone 01: إعداد المشروع وقاعدة البيانات والمصادقة (Core Setup & Auth)

> **المرحلة 01 من 26** — ضمن المرحلة الكبرى الأولى: التأسيس والبنية التحتية
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 1**

---

## 1. الهدف الاستراتيجي
تجهيز مشروع Next.js 14+ (App Router) مع TypeScript و Tailwind CSS، وتهيئة مكتبة المكونات الرسمية **shadcn/ui**، وربطه بقاعدة بيانات Supabase (PostgreSQL 15) عبر Prisma ORM، وتأسيس منظومة تسجيل الدخول والمصادقة (Supabase Auth) وجدول ملفات المستخدمين والأدوار (`user_profiles`).

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - صفحة البداية وشريط المستخدم: [`base_prototype/index.html`](file:///e:/web/exporting_erp/base_prototype/index.html)
- **منطق الكود في البروتوتايب:**
  - جدول المستخدمين والأدوار الافتراضية: [`base_prototype/js/state.js` Lines 15-80](file:///e:/web/exporting_erp/base_prototype/js/state.js#L15-L80) (`DEFAULT_USERS`: Admin, Supervisor, Operator, Storekeeper, Viewer).
  - دالة فحص الصلاحيات: [`base_prototype/js/state.js` Lines 540-580](file:///e:/web/exporting_erp/base_prototype/js/state.js#L540-L580) (`can(action)`).

---

## 3. المتطلبات المسبقة (Prerequisites)
- تثبيت Node.js v20+ LTS.
- إنشاء مشروع Supabase والحصول على الـ Keys وعناوين الـ Connection Strings.

---

## 4. نطاق قاعدة البيانات (Database / Prisma Scope)

في ملف `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  ADMIN       @map("admin")
  SUPERVISOR  @map("supervisor")
  OPERATOR    @map("operator")
  STOREKEEPER @map("storekeeper")
  VIEWER      @map("viewer")

  @@map("user_role_type")
}

model UserProfile {
  id        String   @id @db.Uuid
  fullName  String   @map("full_name")
  role      UserRole @default(VIEWER)
  title     String?
  stationId String?  @map("station_id")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  @@map("user_profiles")
}
```

ملف الـ SQL المساعد لإنشاء الـ Trigger في Supabase (يحفظ في `supabase/migrations/01_auth_trigger.sql`):
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role, title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role_type, 'viewer'::public.user_role_type),
    COALESCE(NEW.raw_user_meta_data->>'title', 'موظف محطة')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 5. تهيئة shadcn/ui ونطاق الواجهة (shadcn/ui Setup & UI Scope)

### أ. تهيئة مكتبة shadcn/ui وتثبيت المكونات الأساسية
يتم تشغيل أمر التهيئة وتثبيت المكونات المستخدمة في المصادقة والهيكل:
```bash
npx shadcn@latest init
npx shadcn@latest add button input card label form sonner
```

### ب. الملفات المطلوبة:
1. `components.json`: ملف إعداد shadcn المعتمد.
2. `lib/utils.ts`: دالة `cn()` لدمج كلاسات Tailwind.
3. `components/ui/*`: مكونات `button`, `input`, `card`, `label`, `form`, `sonner`.
4. `app/(auth)/layout.tsx`: شاشة مركزية أنيقة مع خلفية رمادية فاتحة `#f8f9fa` بنظام `dir="rtl"`.
5. `app/(auth)/login/page.tsx`: نموذج تسجيل الدخول بالعربية باستخدام مكونات shadcn/ui.

### ج. مواصفات نموذج الدخول المبني بـ shadcn/ui:
- مغلف في `<Card>` بعرض أقصى `max-w-md` مع شعار Nilotic Frost الأخضر `#012d1d`.
- حقول الإدخال مبنية باستخدام `<Form>` و `<FormField>` و `<Input>` مع التحقق عبر Zod.
- زر إرسال: `<Button className="w-full bg-[#012d1d] hover:bg-[#02472e]">تسجيل الدخول</Button>` مع مؤشر تحميل.
- رسائل الخطأ: عبر `<FormMessage />` باللغة العربية وتنبيهات Sonner Toast.

---

## 6. نطاق الـ Server Actions والـ Middleware

### أ. ملف `lib/prisma.ts` (Prisma Singleton)
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### ب. ملف `lib/auth.ts` (استخراج المستخدم والتحقق من الصلاحيات)
```ts
import { createServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function getCurrentUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
  });

  return profile;
}

export function can(role: UserRole, action: string): boolean {
  if (role === UserRole.ADMIN) return true;
  if (role === UserRole.SUPERVISOR) return action !== 'DELETE_OPERATION';
  if (role === UserRole.OPERATOR) return action === 'CREATE_OPERATION';
  if (role === UserRole.STOREKEEPER) return action === 'CREATE_OPERATION' || action === 'DISPATCH_SHIPMENT';
  return false;
}
```

### ج. ملف `middleware.ts`
- فحص الجلسة عبر Supabase SSR Cookies.
- إعادة توجيه أي زائر غير مسجل يحاول فتح `/dashboard/*` إلى صفحة `/login`.
- إعادة توجيه أي مستخدم مسجل يفتح `/login` إلى `/dashboard`.

---

## 7. نقطة التفتيش والاختبار (Check Point 01)
1. **تشغيل أوامر التهيئة:**
   ```bash
   npx prisma db push
   # يجب أن يؤكد نجاح إنشاء جدول user_profiles ونوع user_role_type
   ```
2. **التحقق من تهيئة shadcn/ui:**
   - وجود ملف `components.json` بمجلد المشروع.
   - التأكد من تثبيت ملفات `@/components/ui/button.tsx`, `input.tsx`, `card.tsx`, `label.tsx`, `form.tsx`.
3. **اختبار التسجيل والدخول:**
   - إنشاء مستخدم عبر Supabase Dashboard ببريد `admin@niloticfrost.com` ورتبة `admin`.
   - تسجيل الدخول من الواجهة على `http://localhost:3000/login`.
   - **النتيجة المتوقعة:** نجاح الدخول والتحويل الفوري إلى `/dashboard`.
4. **اختبار حماية المسارات:**
   - فتح نافذة متصفح متخفية (Incognito) ومحاولة طلب `http://localhost:3000/dashboard`.
   - **النتيجة المتوقعة:** التحويل الفوري الإجباري إلى `/login`.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] اتصال Prisma و Supabase يعمل بنجاح ومثبت في `.env`.
- [ ] نموذج `UserProfile` موجود في قاعدة البيانات مع الـ Trigger.
- [ ] تهيئة shadcn/ui بنجاح وتوليد المكونات الأساسية ودالة `cn()`.
- [ ] واجهة تسجيل الدخول مبنية بكروت وحقول shadcn وتعمل بالعربية مع RTL.
- [ ] الـ Middleware يحمي مسارات التطبيق بنجاح.
