# Milestone 04: مقاولو العمالة وتعريفات التشغيل (Contractors & Tariffs)

> **المرحلة 04 من 26** — ضمن المرحلة الكبرى الثانية: البيانات الأساسية والكتالوجات
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء موديول إدارة مقاولي العمالة المتخصصين في فرز وتجهيز وتجميد الحاصلات الزراعية، وربط كل مقاول بمحطته التشغيلية، وحفظ تعريفة أتعاب الفرز والتجهيز لكل كيلوجرام منتج تام جاهز (`tariff_rate_per_kg`).

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - دليل المقاولين: [`base_prototype/pages/contractors.html`](file:///e:/web/exporting_erp/base_prototype/pages/contractors.html)
  - تفاصيل المقاول: [`base_prototype/pages/contractor-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/contractor-details.html)
- **منطق الكود في البروتوتايب:**
  - قائمة المقاولين الافتراضية: [`base_prototype/js/state.js` Lines 285-320](file:///e:/web/exporting_erp/base_prototype/js/state.js#L285-L320) (`DEFAULT_CONTRACTORS`).
  - المقاولون الثلاثة: "مقاول أحمد للتجهيز" (محطة النخيل - 2.00 ج.م/كجم)، "مقاول شركة الصفا" (محطة السلام - 2.20 ج.م/كجم)، "مقاول النور لفرز وتجميد الخضار" (محطة المدينة - 1.90 ج.م/كجم).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 03** (وجود المحطات في جدول `stations` للربط بها كـ Foreign Key).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
model Contractor {
  id               String   @id // CONT-001
  name             String
  tariffRatePerKg  Decimal  @default(2.00) @map("tariff_rate_per_kg") @db.Decimal(8, 2)
  stationId        String?  @map("station_id")
  phone            String?
  specialization   String?
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")

  // العلاقات
  station          Station?              @relation(fields: [stationId], references: [id])
  operations       ProcessingOperation[]

  @@map("contractors")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/contractors/
│   ├── page.tsx                      # جدول المقاولين مع كروت سريعة للتعريفات
│   └── new/page.tsx                  # نموذج إضافة مقاول جديد
├── components/modules/contractors/
│   ├── contractor-table.tsx          # جدول المقاولين مع زر الاتصال والمحطة المرتبطة
│   └── contractor-form.tsx           # نموذج الإدخال مع قائمة اختيار المحطة
└── lib/validations/contractor.ts     # Zod Schema للمقاول
```

### كود الـ Validation بـ Zod (`lib/validations/contractor.ts`):
```ts
import { z } from 'zod';

export const ContractorSchema = z.object({
  id: z.string().min(2, 'كود المقاول مطلوب (مثل CONT-001)'),
  name: z.string().min(3, 'اسم المقاول مطلوب'),
  tariffRatePerKg: z.coerce.number().positive('تعريفة الكيلو يجب أن تكون أكبر من 0').default(2.0),
  stationId: z.string().min(1, 'يجب ربط المقاول بمحطة عمل'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
});
```

---

## 6. نطاق الـ Server Actions (`actions/contractors.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { ContractorSchema } from '@/lib/validations/contractor';

export async function createContractor(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة مقاولين' };
  }

  const validated = ContractorSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const contractor = await prisma.contractor.create({
      data: validated.data,
      include: { station: true },
    });
    revalidatePath('/contractors');
    return { success: true, message: `تم تسجيل المقاول ${contractor.name} بتعريفة ${contractor.tariffRatePerKg} ج.م/كجم` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 04)
1. **تسجيل المقاولين الثلاثة:**
   - مقاول أحمد: كود `CONT-001`، محطة النخيل `STN-01`، تعريفة `2.00 ج.م/كجم`.
   - مقاول الصفا: كود `CONT-002`، محطة السلام `STN-02`، تعريفة `2.20 ج.م/كجم`.
   - مقاول النور: كود `CONT-003`، محطة المدينة `STN-03`، تعريفة `1.90 ج.م/كجم`.
2. **التحقق من الواجهة:**
   - فتح صفحة `/contractors` والتأكد من ظهور الجدول وربط كل مقاول بمحطته المحددة.
3. **فحص علاقة الـ Foreign Key:**
   - محاولة إضافة مقاول بمحطة غير موجودة والتأكد من رفض قاعدة البيانات للعملية.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] جدول `contractors` مرتبط علائقياً بجدول `stations`.
- [ ] جدول الواجهة يعرض اسم المحطة ورقم الهاتف والتعريفة بدقة.
- [ ] نموذج الإدخال يتحقق من الحقول بـ Zod بنجاح.
