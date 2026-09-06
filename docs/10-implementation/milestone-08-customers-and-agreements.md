# Milestone 08: العملاء واتفاقيات أسعار التصدير (Customers & Price Agreements)

> **المرحلة 08 من 26** — ضمن المرحلة الكبرى الثانية: البيانات الأساسية والكتالوجات
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء دليل عملاء التصدير الدوليين، وموانئ الوصول البحرية المعتمدة، وعملات التعاقد (EUR / USD)، وشروط وتسهيلات السداد، وإدارة جدول اتفاقيات الأسعار التعاقدية للمنتجات (`customer_agreements`) التي ستورث أسعارها آلياً لطلبيات التصدير والشحنات.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - دليل العملاء: [`base_prototype/pages/customers.html`](file:///e:/web/exporting_erp/base_prototype/pages/customers.html)
  - تفاصيل العميل والاتفاقيات: [`base_prototype/pages/customer-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-details.html) و [`customer-agreements.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-agreements.html)
- **منطق الكود في البروتوتايب:**
  - مصفوفة العملاء الافتراضية: [`base_prototype/js/state.js` Lines 325-350](file:///e:/web/exporting_erp/base_prototype/js/state.js#L325-L350) (`DEFAULT_CUSTOMERS`).
  - العملاء الثلاثة:
    1. `CUST-001` (CUST-SAMA-NL): شركة سما للتجارة - هولندا - ميناء روتردام - EUR (اتفاقية: فراولة IQF بسعر 1.85 EUR).
    2. `CUST-002` (CUST-NOOR-SA): شركة النور للاستيراد - السعودية - ميناء جدة - USD (اتفاقية: مانجو مكعبات بسعر 2.10 USD).
    3. `CUST-003` (CUST-EURO-DE): يوروفودز الدولية - ألمانيا - ميناء هامبورغ - EUR (اتفاقية: بامية ممتازة بسعر 1.95 EUR).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 05** (وجود المنتجات في جدول `products` لربط الاتفاقيات بها).

---

## 4. نطاق قاعدة البيانات (Prisma Models Scope)

```prisma
model Customer {
  id              String   @id // CUST-001
  code            String   @unique
  name            String
  country         String
  destinationPort String   @map("destination_port")
  currency        String   @default("EUR")
  paymentTerms    String   @map("payment_terms")
  creditLimit     Decimal  @default(500000.00) @map("credit_limit") @db.Decimal(15, 2)
  contactPerson   String?  @map("contact_person")
  phone           String?
  email           String?
  status          String   @default("نشط")
  createdAt       DateTime @default(now()) @map("created_at")

  agreements      CustomerAgreement[]
  orders          ClientOrder[]
  shipments       Shipment[]

  @@map("customers")
}

model CustomerAgreement {
  id             Int      @id @default(autoincrement())
  customerId     String   @map("customer_id")
  productId      String   @map("product_id")
  targetPriceEur Decimal  @map("target_price_eur") @db.Decimal(10, 3)
  packagingSpec  String   @map("packaging_spec")
  createdAt      DateTime @default(now()) @map("created_at")

  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  product        Product  @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@unique([customerId, productId])
  @@map("customer_agreements")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/customers/
│   ├── page.tsx                      # جدول العملاء مع شارات العملة والدول
│   ├── new/page.tsx                  # نموذج إضافة عميل جديد
│   └── [id]/page.tsx                 # صفحة تفاصيل العميل واتفاقيات الأسعار
├── components/modules/customers/
│   ├── customer-table.tsx            # جدول العملاء مع قائمة الإجراءات
│   ├── customer-form.tsx             # نموذج العميل مع التحقق
│   └── agreement-modal.tsx           # نافذة إضافة اتفاقية صنف وسعر
└── lib/validations/customer.ts       # Zod Schemas للعميل والاتفاقية
```

### كود الـ Validation بـ Zod (`lib/validations/customer.ts`):
```ts
import { z } from 'zod';

export const CustomerSchema = z.object({
  id: z.string().min(2, 'كود العميل مطلوب'),
  code: z.string().min(3, 'كود التعريف مطلوب'),
  name: z.string().min(3, 'اسم شركة العميل مطلوب'),
  country: z.string().min(2, 'الدولة مطلوبة'),
  destinationPort: z.string().min(3, 'ميناء الوصول مطلوب'),
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
  paymentTerms: z.string().min(3, 'شروط الدفع مطلوبة'),
  creditLimit: z.coerce.number().min(0).default(500000),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
});

export const AgreementSchema = z.object({
  productId: z.string().min(1, 'يجب اختيار المنتج'),
  targetPriceEur: z.coerce.number().positive('السعر يجب أن يكون أكبر من 0'),
  packagingSpec: z.string().min(3, 'مواصفة التعبئة مطلوبة (مثل: كرتونة 10 كجم)'),
});
```

---

## 6. نطاق الـ Server Actions (`actions/customers.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { CustomerSchema, AgreementSchema } from '@/lib/validations/customer';

export async function createCustomer(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة عملاء' };
  }

  const validated = CustomerSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const customer = await prisma.customer.create({ data: validated.data });
    revalidatePath('/customers');
    return { success: true, message: `تم تسجيل العميل ${customer.name} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addCustomerAgreement(customerId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة اتفاقيات' };
  }

  const validated = AgreementSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    await prisma.customerAgreement.create({
      data: {
        customerId,
        productId: validated.data.productId,
        targetPriceEur: validated.data.targetPriceEur,
        packagingSpec: validated.data.packagingSpec,
      },
    });
    revalidatePath(`/customers/${customerId}`);
    return { success: true, message: 'تم حفظ اتفاقية السعر بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'هذا الصنف متعاقد عليه مسبقاً لهذا العميل' };
    }
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 08)
1. **تسجيل العملاء الثلاثة واتفاقياتهم:**
   - شركة سما (هولندا): `CUST-001`، ميناء روتردام، عملة EUR، اتفاقية فراولة IQF بسعر `1.85 EUR`.
   - شركة النور (السعودية): `CUST-002`، ميناء جدة، عملة USD، اتفاقية مانجو بسعر `2.10 USD`.
   - يوروفودز (ألمانيا): `CUST-003`، ميناء هامبورغ، عملة EUR، اتفاقية بامية بسعر `1.95 EUR`.
2. **اختبار قيد منع التكرار (Unique Constraint):**
   - محاولة إضافة اتفاقية ثانية لشركة سما لنفس صنف "فراولة IQF" والتأكد من رفض النظام وإظهار رسالة: *"هذا الصنف متعاقد عليه مسبقاً لهذا العميل"*.
3. **التحقق من الواجهة:**
   - فتح شاشة تفاصيل العميل وتأكيد ظهور كارت الاتفاقيات وسعر الكيلو باليورو بدقة.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] جدولا `customers` و `customer_agreements` يعملان بروابطهما الكاملة.
- [ ] نموذج الاتفاقيات يمنع تكرار نفس الصنف لنفس العميل.
- [ ] انتهاء كامل موديولات البيانات الأساسية واجتياز جزء كبير من **🛑 Major Checkpoint 2**.
