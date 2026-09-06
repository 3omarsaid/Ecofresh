# Milestone 06: مستلزمات التعبئة والتغليف والكراتين (Packaging & Supplies)

> **المرحلة 06 من 26** — ضمن المرحلة الكبرى الثانية: البيانات الأساسية والكتالوجات
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء موديول إدارة مواد التعبئة والتغليف والكراتين ومواد التبخير المصاحبة لعمليات التصدير، وتتبع سعة كل كرتونة بالكيلوجرام (`capacity_kg`)، ورصيد المخزون المتاح، وتكلفة الوحدة للشراء.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - دليل المستلزمات: [`base_prototype/pages/supplies.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplies.html)
  - شاشة الكراتين: [`base_prototype/pages/cartons.html`](file:///e:/web/exporting_erp/base_prototype/pages/cartons.html)
- **منطق الكود في البروتوتايب:**
  - مصفوفة المستلزمات الافتراضية: [`base_prototype/js/state.js` Lines 185-235](file:///e:/web/exporting_erp/base_prototype/js/state.js#L185-L235) (`DEFAULT_SUPPLIES`).
  - الأصناف الأساسية الخمسة وأسعارها ورصيدها.

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 01** و **Milestone 02** (الواجهة والـ Auth).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
model Supply {
  id          String   @id // SUP-01
  code        String   @unique // CTN-EXP-10K
  name        String
  category    String // كرتونة / أكياس / بالتات / لاصق / تغليف
  capacityKg  Decimal? @map("capacity_kg") @db.Decimal(8, 2)
  unit        String   @default("كرتونة")
  stock       Decimal  @default(0.0) @db.Decimal(12, 2)
  unitPrice   Decimal  @default(0.0) @map("unit_price") @db.Decimal(10, 2)
  createdAt   DateTime @default(now()) @map("created_at")

  supplyIssues OperationSupplyIssue[]

  @@map("supplies")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/supplies/
│   ├── page.tsx                      # جدول المستلزمات والكراتين مع فلاتر التصنيف
│   └── new/page.tsx                  # نموذج إضافة مستلزم تعبئة جديد
├── components/modules/supplies/
│   ├── supply-table.tsx              # جدول الأرصدة والأسعار وتنبيهات المخزون الحرج
│   └── supply-form.tsx               # نموذج الإدخال
└── lib/validations/supply.ts         # Zod Schema للمستلزم
```

### كود الـ Validation بـ Zod (`lib/validations/supply.ts`):
```ts
import { z } from 'zod';

export const SupplySchema = z.object({
  id: z.string().min(2, 'كود المستلزم مطلوب (مثل SUP-06)'),
  code: z.string().min(3, 'كود التكويد مطلوب (مثل CTN-EXP-5K)'),
  name: z.string().min(3, 'اسم المستلزم مطلوب'),
  category: z.enum(['كرتونة', 'أكياس', 'بالتات', 'لاصق', 'تغليف']),
  capacityKg: z.coerce.number().positive().optional().nullable(),
  unit: z.string().default('قطعة'),
  stock: z.coerce.number().min(0).default(0),
  unitPrice: z.coerce.number().positive('سعر الوحدة يجب أن يكون أكبر من 0'),
});
```

---

## 6. نطاق الـ Server Actions (`actions/supplies.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { SupplySchema } from '@/lib/validations/supply';

export async function createSupply(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة مستلزمات' };
  }

  const validated = SupplySchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const supply = await prisma.supply.create({
      data: validated.data,
    });
    revalidatePath('/supplies');
    return { success: true, message: `تم قيد المستلزم ${supply.name} برصيد ${supply.stock} ${supply.unit}` };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'كود المستلزم مسجل مسبقاً' };
    }
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 06)
1. **تسجيل المستلزمات الخمسة الأساسية:**
   - كرتونة تصدير 10 كجم: رصيد `2,020 كرتونة`، سعر `18.00 ج.م`، سعة `10 كجم`.
   - كيس بوليثيلين 10 كجم: رصيد `3,800 كيس`، سعر `3.50 ج.م`.
   - بالتات خشبية تبخير معتمد: رصيد `120 باليتة`، سعر `450.00 ج.م`.
   - شريط لاصق عريض: رصيد `85 بكرة`، سعر `25.00 ج.م`.
   - رول استرتش: رصيد `40 رول`، سعر `180.00 ج.م`.
2. **التحقق من الواجهة:**
   - فتح صفحة `/supplies` والتأكد من إظهار إجمالي قيمة المخزون لكل مستلزم ($\text{stock} \times \text{unitPrice}$).
3. **فحص تنبيه المخزون المنخفض:**
   - إضافة مستلزم برصيد أقل من 100 والتأكد من ظهور شارة تحذير صفراء على السطر.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] جدول `supplies` مجهز برصيد المخزون وسعر الشراء.
- [ ] جدول الواجهة يدعم الفلترة حسب الفئة (كرتونة، أكياس، بالتات).
- [ ] التحقق يضمن إدخال سعة الكرتونة بالكيلوجرام للأصناف ذات الصلة.
