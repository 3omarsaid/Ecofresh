# Milestone 07: دليل الموردين وتصنيفاتهم (Suppliers Directory)

> **المرحلة 07 من 26** — ضمن المرحلة الكبرى الثانية: البيانات الأساسية والكتالوجات
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء دليل موردي الشركة وتصنيفهم إلى 3 فئات رئيسية: (مورد خام زراعي للمزارع، مورد بضاعة جاهزة لمصانع الصفقات، مورد مستلزمات لمصانع الكرتون والتغليف)، وحفظ المواقع والمحاصيل الموردة وسجلات الاتصال.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - دليل الموردين: [`base_prototype/pages/suppliers.html`](file:///e:/web/exporting_erp/base_prototype/pages/suppliers.html)
  - تفاصيل المورد: [`base_prototype/pages/supplier-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplier-details.html)
- **منطق الكود في البروتوتايب:**
  - مصفوفة الموردين الافتراضية: [`base_prototype/js/state.js` Lines 85-110](file:///e:/web/exporting_erp/base_prototype/js/state.js#L85-L110) (`DEFAULT_SUPPLIERS`).
  - الموردون الثمانية وتصنيفاتهم ومواقعهم (البحيرة، الإسماعيلية، القليوبية، السادات، النوبارية، العاشر من رمضان، بلبيس، 6 أكتوبر).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 01** و **Milestone 02** (الواجهة والـ Auth).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
enum SupplierCategory {
  RAW_AGRICULTURAL @map("مورد خام زراعي")
  FINISHED_GOODS   @map("مورد بضاعة جاهزة")
  PACKAGING        @map("مورد مستلزمات")

  @@map("supplier_category")
}

model Supplier {
  id          String           @id // SUPP-001
  code        String           @unique
  name        String
  type        SupplierCategory
  mainProduct String?          @map("main_product")
  phone       String?
  location    String?
  status      String           @default("معتمد")
  createdAt   DateTime         @default(now()) @map("created_at")

  // العلاقات اللاحقة
  rawBatches  RawBatch[]
  deals       DirectPurchaseDeal[]

  @@map("suppliers")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/suppliers/
│   ├── page.tsx                      # جدول الموردين مع فلاتر التصنيف والمحافظات
│   └── new/page.tsx                  # نموذج تسجيل مورد جديد
├── components/modules/suppliers/
│   ├── supplier-table.tsx            # جدول الموردين مع الشارات الملونة
│   └── supplier-form.tsx             # نموذج الإدخال
└── lib/validations/supplier.ts       # Zod Schema للمورد
```

### شارات الألوان للتصنيفات:
- `مورد خام زراعي`: شارة خضراء (`bg-emerald-100 text-emerald-900 border-emerald-300`).
- `مورد بضاعة جاهزة`: شارة زرقاء (`bg-blue-100 text-blue-900 border-blue-300`).
- `مورد مستلزمات`: شارة بنفسجية (`bg-purple-100 text-purple-900 border-purple-300`).

---

## 6. نطاق الـ Server Actions (`actions/suppliers.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { SupplierSchema } from '@/lib/validations/supplier';

export async function createSupplier(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة موردين' };
  }

  const validated = SupplierSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const supplier = await prisma.supplier.create({
      data: validated.data,
    });
    revalidatePath('/suppliers');
    return { success: true, message: `تم تسجيل المورد ${supplier.name} بنجاح` };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'كود المورد مسجل مسبقاً' };
    }
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 07)
1. **تسجيل الموردين الثمانية من البروتوتايب:**
   - مزارع الوادي الحديثة (`SUPP-001`): مورد خام زراعي - فراولة - البحيرة.
   - شركة الخير للتنمية (`SUPP-002`): مورد خام زراعي - مانجو - الإسماعيلية.
   - مزارع التوفيق (`SUPP-003`): مورد خام زراعي - فراولة وبامية - القليوبية.
   - شركة النيل للصناعات (`SUPP-004`): مورد بضاعة جاهزة - فراولة مجمدة - السادات.
   - مزارع النوبارية (`SUPP-005`): مورد خام زراعي - فراولة - النوبارية.
   - الأهرام للتبريد (`SUPP-006`): مورد بضاعة جاهزة - مانجو مجمد - العاشر من رمضان.
   - مزارع الشرقية (`SUPP-007`): مورد خام زراعي - بامية - بلبيس.
   - الشركة المصرية للكرتون (`SUPP-008`): مورد مستلزمات - كرتون ومواد تغليف - 6 أكتوبر.
2. **التحقق من الواجهة:**
   - فتح صفحة `/suppliers` والتأكد من إمكانية التصفية بالضغط على تبويب "موردو الخام فقط".

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] جدول `suppliers` يدعم الفئات الثلاث عبر Prisma Enum.
- [ ] جدول الواجهة يعرض الشارات الملونة بدقة.
- [ ] نموذج الإدخال يتحقق من الحقول بـ Zod بنجاح.
