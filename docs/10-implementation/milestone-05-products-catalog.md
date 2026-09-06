# Milestone 05: كتالوج المنتجات التصديرية (Products Catalog)

> **المرحلة 05 من 26** — ضمن المرحلة الكبرى الثانية: البيانات الأساسية والكتالوجات
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء كتالوج المنتجات التصديرية الزراعية المعتمدة للتجميد السريع (IQF)، وتثبيت نسب الهالك المعيارية (Standard Waste %) ونسب الإنتاجية والتصافي المعيارية (Standard Yield %) لكل صنف لاستخدامها كمعيار مقارنة لجودة التشغيل بالمصانع.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - دليل المنتجات: [`base_prototype/pages/products.html`](file:///e:/web/exporting_erp/base_prototype/pages/products.html)
  - تفاصيل المنتج: [`base_prototype/pages/product-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/product-details.html)
- **منطق الكود في البروتوتايب:**
  - مصفوفة المنتجات الافتراضية: [`base_prototype/js/state.js` Lines 110-145](file:///e:/web/exporting_erp/base_prototype/js/state.js#L110-L145) (`DEFAULT_PRODUCTS`).
  - المنتجات الأربعة الأساسية:
    1. `PRD-01` (PRD-STW-IQF): فراولة مجمدة IQF (هالك 20% / تصافي 80%).
    2. `PRD-02` (PRD-STW-SLC): فراولة شرائح مجمدة (هالك 22% / تصافي 78%).
    3. `PRD-03` (PRD-MNG-CBD): مانجو مكعبات مجمدة (هالك 28% / تصافي 72%).
    4. `PRD-04` (PRD-OKR-EXT): بامية ممتازة مجمدة (هالك 15% / تصافي 85%).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 01** و **Milestone 02** (الواجهة والـ Auth).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
model Product {
  id               String   @id // PRD-01
  code             String   @unique // PRD-STW-IQF
  name             String
  category         String // فواكه مجمدة / خضار مجمد
  defaultUnit      String   @default("KG") @map("default_unit")
  standardWastePct Decimal  @default(20.0) @map("standard_waste_pct") @db.Decimal(5, 2)
  standardYieldPct Decimal  @default(80.0) @map("standard_yield_pct") @db.Decimal(5, 2)
  createdAt        DateTime @default(now()) @map("created_at")

  agreements       CustomerAgreement[]

  @@map("products")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/products/
│   ├── page.tsx                      # جدول كتالوج المنتجات
│   └── new/page.tsx                  # نموذج إضافة صنف تصديري جديد
├── components/modules/products/
│   ├── product-table.tsx             # جدول الأصناف وشارات التصنيف والنسب المعيارية
│   └── product-form.tsx              # نموذج الإدخال مع معادلة التحقق (Waste + Yield = 100)
└── lib/validations/product.ts        # Zod Schema للمنتج
```

### كود الـ Validation بـ Zod (`lib/validations/product.ts`):
```ts
import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().min(2, 'معرف الصنف مطلوب (مثل PRD-05)'),
  code: z.string().min(3, 'كود الصنف التصديري مطلوب (مثل PRD-STW-IQF)'),
  name: z.string().min(3, 'اسم المنتج بالعربية مطلوب'),
  category: z.enum(['فواكه مجمدة', 'خضار مجمد']),
  defaultUnit: z.string().default('KG'),
  standardWastePct: z.coerce.number().min(0).max(100),
  standardYieldPct: z.coerce.number().min(0).max(100),
}).refine((data) => (data.standardWastePct + data.standardYieldPct) <= 100, {
  message: 'مجموع نسبة الهالك ونسبة الإنتاجية لا يمكن أن يتجاوز 100%',
  path: ['standardYieldPct'],
});
```

---

## 6. نطاق الـ Server Actions (`actions/products.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { ProductSchema } from '@/lib/validations/product';

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة منتجات' };
  }

  const validated = ProductSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const product = await prisma.product.create({
      data: validated.data,
    });
    revalidatePath('/products');
    return { success: true, message: `تم قيد الصنف ${product.name} بالكود ${product.code} بنجاح` };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'كود المنتج مسجل مسبقاً' };
    }
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 05)
1. **تسجيل المنتجات الأربعة الأساسية:**
   - فراولة مجمدة IQF: كود `PRD-STW-IQF`، هالك `20%`، تصافي `80%`.
   - فراولة شرائح: كود `PRD-STW-SLC`، هالك `22%`، تصافي `78%`.
   - مانجو مكعبات: كود `PRD-MNG-CBD`، هالك `28%`، تصافي `72%`.
   - بامية ممتازة: كود `PRD-OKR-EXT`، هالك `15%`، تصافي `85%`.
2. **التحقق من الواجهة:**
   - فتح صفحة `/products` والتأكد من ظهور جدول الأصناف وشارات الألوان للفاكهة والخضار.
3. **فحص التحقق الرياضي:**
   - محاولة إدخال صنف بنسبة هالك 50% ونسبة تصافي 60% (المجموع 110%) والتأكد من رفض Zod للنموذج.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] جدول `products` يعمل بكفاءة عبر Prisma.
- [ ] جدول الواجهة يعرض الأكواد والنسب المعيارية.
- [ ] التحقق الصارم يمنع إدخال نسب غير منطقية رياضياً.
