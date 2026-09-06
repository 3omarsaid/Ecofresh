# Milestone 03: المحطات وسعات التبريد (Stations Management)

> **المرحلة 03 من 26** — ضمن المرحلة الكبرى الثانية: البيانات الأساسية والكتالوجات
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء موديول إدارة محطات التجميد وتبريد الخضار والفاكهة (Stations)، وحفظ السعات التخزينية القصوى لكل محطة بالكيلوجرام، ورسوم استهلاك الكهرباء والتبريد المعتمدة لكل كيلوجرام منتج (`electricity_rate_per_kg`).

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - دليل المحطات: [`base_prototype/pages/stations.html`](file:///e:/web/exporting_erp/base_prototype/pages/stations.html)
  - تفاصيل المحطة: [`base_prototype/pages/station-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/station-details.html)
- **منطق الكود في البروتوتايب:**
  - مصفوفة المحطات الافتراضية: [`base_prototype/js/state.js` Lines 245-280](file:///e:/web/exporting_erp/base_prototype/js/state.js#L245-L280) (`DEFAULT_STATIONS`).
  - المحطات الثلاث: محطة النخيل (البحيرة)، محطة السلام (الإسماعيلية)، محطة المدينة (السادات).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 01** و **Milestone 02** (الواجهة والـ Auth جاهزة).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
model Station {
  id                    String   @id // STN-01
  name                  String   @unique
  location              String
  coldStorageCapacityKg Int      @default(100000) @map("cold_storage_capacity_kg")
  electricityRatePerKg  Decimal  @default(2.50) @map("electricity_rate_per_kg") @db.Decimal(8, 2)
  supervisorName        String?  @map("supervisor_name")
  phone                 String?
  isActive              Boolean  @default(true) @map("is_active")
  createdAt             DateTime @default(now()) @map("created_at")

  // العلاقات اللاحقة
  contractors          Contractor[]
  rawBatches           RawBatch[]
  operations           ProcessingOperation[]
  finishedGoodsBatches FinishedGoodsBatch[]

  @@map("stations")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/stations/
│   ├── page.tsx                      # قائمة المحطات على شكل كروت سعة وإحصائيات
│   └── new/page.tsx                  # نموذج إضافة محطة جديدة
├── components/modules/stations/
│   ├── station-card.tsx              # كارت المحطة التفاعلي (السعة، المشرف، الهاتف)
│   └── station-form.tsx              # نموذج الإدخال مع التحقق
└── lib/validations/station.ts        # Zod Schema للمحطة
```

### كود الـ Validation بـ Zod (`lib/validations/station.ts`):
```ts
import { z } from 'zod';

export const StationSchema = z.object({
  id: z.string().min(2, 'كود المحطة مطلوب (مثل STN-01)'),
  name: z.string().min(3, 'اسم المحطة مطلوب'),
  location: z.string().min(3, 'الموقع الجغرافي مطلوب'),
  coldStorageCapacityKg: z.coerce.number().positive('سعة التخزين يجب أن تكون أكبر من 0'),
  electricityRatePerKg: z.coerce.number().min(0, 'سعر الكهرباء لا يمكن أن يكون سالباً').default(2.5),
  supervisorName: z.string().optional(),
  phone: z.string().optional(),
});
```

---

## 6. نطاق الـ Server Actions (`actions/stations.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { StationSchema } from '@/lib/validations/station';

export async function createStation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة محطات' };
  }

  const validated = StationSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const station = await prisma.station.create({
      data: validated.data,
    });
    revalidatePath('/stations');
    return { success: true, message: `تم تسجيل المحطة ${station.name} بنجاح` };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'اسم المحطة أو الكود مسجل مسبقاً' };
    }
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 03)
1. **تشغيل أمر البذر أو إدخال المحطات:**
   - إدخال محطة النخيل: كود `STN-01`، سعة `150,000 كجم`، سعر كهرباء `2.50 ج.م`.
   - إدخال محطة السلام: كود `STN-02`، سعة `120,000 كجم`، سعر كهرباء `2.30 ج.م`.
   - إدخال محطة المدينة: كود `STN-03`، سعة `200,000 كجم`، سعر كهرباء `2.60 ج.م`.
2. **التحقق من الواجهة:**
   - فتح صفحة `/stations` والتأكد من ظهور الكروت الثلاثة بالسعات الصحيحة.
3. **فحص التحقق (Validation):**
   - محاولة إدخال محطة بسعة سالبة أو بدون اسم وتأكيد ظهور رسالة خطأ باللون الأحمر.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] جدول `stations` يعمل عبر Prisma و Supabase.
- [ ] كروت المحطات تعرض السعات وتكلفة الكهرباء بدقة.
- [ ] نموذج إضافة المحطة يتحقق بـ Zod بنسبة 100%.
