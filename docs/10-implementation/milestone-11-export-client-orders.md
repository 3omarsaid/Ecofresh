# Milestone 11: إدارة طلبيات التصدير للعملاء (Export Client Orders)

> **المرحلة 11 من 26** — ضمن المرحلة الكبرى الثالثة: المشتريات والتوريد والطلبيات
> **بوابة الفحص المرتبطة:** جزء رئيسي من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء موديول إدارة طلبيات التصدير الدولية (Export Orders)، والوراثة التلقائية للأسعار التعاقدية بالعملة الأجنبية (EUR / USD) ومواصفات التعبئة وموانئ الوصول من اتفاقيات العميل، وتتبع رصيد الكميات المتبقية غير المشحونة (`unfulfilled_qty_kg`) تمهيداً لتخصيص الحاويات.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - جدول طلبيات التصدير: [`base_prototype/pages/client-orders.html`](file:///e:/web/exporting_erp/base_prototype/pages/client-orders.html)
- **منطق الكود في البروتوتايب:**
  - مصفوفة الطلبيات الافتراضية: [`base_prototype/js/state.js` Lines 405-450](file:///e:/web/exporting_erp/base_prototype/js/state.js#L405-L450) (`DEFAULT_CLIENT_ORDERS`).
  - دالة تسجيل الطلبية: [`base_prototype/js/state.js` Lines 750-775](file:///e:/web/exporting_erp/base_prototype/js/state.js#L750-L775) (`addClientOrder()`).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 08** (العملاء واتفاقيات الأسعار).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
model ClientOrder {
  orderId          String    @id @map("order_id") // ORD-2026-001
  orderDate        DateTime  @default(now()) @map("order_date") @db.Date
  customerId       String    @map("customer_id")
  productName      String    @map("product_name")
  packagingSpec    String    @map("packaging_spec")
  orderedQtyKg     Decimal   @map("ordered_qty_kg") @db.Decimal(12, 2)
  unfulfilledQtyKg Decimal   @map("unfulfilled_qty_kg") @db.Decimal(12, 2)
  unitPriceEur     Decimal   @map("unit_price_eur") @db.Decimal(10, 3)
  fxRate           Decimal   @default(53.20) @map("fx_rate") @db.Decimal(10, 4)
  deliveryTerms    String    @default("FOB") @map("delivery_terms")
  targetShipDate   DateTime? @map("target_ship_date") @db.Date
  destinationPort  String    @map("destination_port")
  status           String    @default("جديدة")
  notes            String?
  createdById      String?   @map("created_by") @db.Uuid
  createdAt        DateTime  @default(now()) @map("created_at")

  customer         Customer     @relation(fields: [customerId], references: [id])
  createdBy        UserProfile? @relation("ClientOrderCreatedBy", fields: [createdById], references: [id])
  shipments        Shipment[]

  @@map("client_orders")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/client-orders/
│   ├── page.tsx                      # جدول طلبيات التصدير وشريط التقدم
│   └── new/page.tsx                  # نموذج تسجيل طلبية جديدة
├── components/modules/orders/
│   ├── client-order-form.tsx         # نموذج الطلبية مع جلب الاتفاقية السعرية
│   └── client-orders-table.tsx       # جدول المتابعة وشارات الإيفاء
└── lib/validations/client-order.ts   # Zod Schema للطلبية
```

### كود الـ Validation بـ Zod (`lib/validations/client-order.ts`):
```ts
import { z } from 'zod';

export const ClientOrderSchema = z.object({
  customerId: z.string().min(1, 'يجب اختيار العميل'),
  productName: z.string().min(1, 'يجب اختيار المنتج التصديري'),
  packagingSpec: z.string().min(1, 'مواصفة التعبئة مطلوبة'),
  orderedQtyKg: z.coerce.number().positive('الكمية المطلوبة يجب أن تكون أكبر من 0'),
  unitPriceEur: z.coerce.number().positive('سعر البيع باليورو مطلوب'),
  fxRate: z.coerce.number().positive('سعر الصرف مطلوب').default(53.20),
  deliveryTerms: z.string().default('FOB - ميناء الإسكندرية'),
  targetShipDate: z.string().optional(),
  destinationPort: z.string().min(1, 'ميناء الوصول مطلوب'),
  notes: z.string().optional(),
});
```

---

## 6. نطاق الـ Server Actions (`actions/client-orders.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { ClientOrderSchema } from '@/lib/validations/client-order';

export async function addClientOrder(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بتسجيل طلبيات عملاء' };
  }

  const validated = ClientOrderSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;
  const count = await prisma.clientOrder.count();
  const orderId = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

  try {
    const order = await prisma.clientOrder.create({
      data: {
        orderId,
        customerId: data.customerId,
        productName: data.productName,
        packagingSpec: data.packagingSpec,
        orderedQtyKg: data.orderedQtyKg,
        unfulfilledQtyKg: data.orderedQtyKg, // في البداية كامل الكمية متبقية
        unitPriceEur: data.unitPriceEur,
        fxRate: data.fxRate,
        deliveryTerms: data.deliveryTerms,
        targetShipDate: data.targetShipDate ? new Date(data.targetShipDate) : null,
        destinationPort: data.destinationPort,
        status: 'جديدة',
        notes: data.notes,
        createdById: user.id,
      },
      include: { customer: true },
    });

    revalidatePath('/client-orders');
    return { success: true, message: `تم تسجيل الطلبية ${order.orderId} للعميل ${order.customer.name} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 11)
1. **تسجيل الطلبيات الثلاث الأساسية:**
   - طلبية شركة سما (هولندا): `ORD-2026-001` - فراولة مجمدة IQF - كمية `10,000 كجم` - سعر `1.85 EUR` - رصيد متبقي `10,000 كجم` - حالة `جديدة`.
   - طلبية شركة النور (السعودية): `ORD-2026-002` - مانجو مكعبات - كمية `5,000 كجم` - سعر `2.10 USD` - حالة `جديدة`.
   - طلبية يوروفودز (ألمانيا): `ORD-2026-003` - بامية ممتازة - كمية `8,000 كجم` - سعر `1.95 EUR` - حالة `جديدة`.
2. **التحقق من الواجهة:**
   - فتح صفحة `/client-orders` والتأكد من إظهار شريط نسبة الإيفاء (0% للطلبيات الجديدة).
3. **اجتياز البوابة الكبرى الثانية:**
   - باجتياز هذا المايلستون، يكون **🛑 Major Checkpoint 2** قد اكتمل بنسبة 100%!

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] جدول `client_orders` يتتبع الكمية المطلوبة والمتبقية بدقة.
- [ ] نموذج تسجيل الطلبية يجلب الأسعار وموانئ الوصول آلياً من اتفاقيات العميل.
- [ ] جاهزية تامة للمرحلة الرابعة (الإنتاج والتشغيل).
