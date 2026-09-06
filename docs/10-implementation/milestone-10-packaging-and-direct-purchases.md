# Milestone 10: مشتريات المستلزمات وصفقات الجاهز (Packaging & Direct Deals)

> **المرحلة 10 من 26** — ضمن المرحلة الكبرى الثالثة: المشتريات والتوريد والطلبيات
> **بوابة الفحص المرتبطة:** جزء رئيسي من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء دورتين تكميليتين للمشتريات:
1. **شراء مواد التعبئة والكراتين:** زيادة رصيد المستلزم في المخزن (`supplies.stock`) وتوليد قيد استحقاق (AP) لمورد الكرتون.
2. **صفقات البضاعة الجاهزة المباشرة (Direct Purchases):** قيد بضاعة مجمدة مشتراة من مصانع أخرى لا تدخل خطوط فرز وتجميد، بل تذهب مباشرة لمخزن الجاهز ببادئة `FG-DIR-` مع قيد استحقاق لمورد الصفقة.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - مشتريات المستلزمات: [`base_prototype/pages/packaging-purchases.html`](file:///e:/web/exporting_erp/base_prototype/pages/packaging-purchases.html)
  - إضافة مستلزمات: [`base_prototype/pages/supplies-arrival-add.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplies-arrival-add.html)
  - صفقات البضاعة الجاهزة: [`base_prototype/pages/finished-purchases.html`](file:///e:/web/exporting_erp/base_prototype/pages/finished-purchases.html)
- **منطق الكود في البروتوتايب:**
  - [`base_prototype/js/state.js` Lines 707-748](file:///e:/web/exporting_erp/base_prototype/js/state.js#L707-L748) (`addPackagingPurchase()` و `addDirectPurchaseDeal()`).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 06** (المستلزمات) و **Milestone 07** (الموردين).

---

## 4. نطاق قاعدة البيانات (Prisma Models Scope)

```prisma
model DirectPurchaseDeal {
  dealId             String   @id @map("deal_id") // DEAL-2026-001
  date               DateTime @default(now()) @db.Date
  supplierId         String   @map("supplier_id")
  productName        String   @map("product_name")
  stationId          String   @map("station_id")
  qtyKg              Decimal  @map("qty_kg") @db.Decimal(12, 2)
  packageType        String?  @map("package_type")
  packageCount       Int?     @map("package_count")
  purchasePricePerKg Decimal  @map("purchase_price_per_kg") @db.Decimal(10, 2)
  transportCost      Decimal  @default(0.0) @map("transport_cost") @db.Decimal(12, 2)
  totalCost          Decimal  @map("total_cost") @db.Decimal(15, 2)
  costPerKg          Decimal  @map("cost_per_kg") @db.Decimal(10, 2)
  generatedBatchId   String?  @unique @map("generated_batch_id")
  invoiceNo          String?  @map("invoice_no")
  status             String   @default("تم الاستلام")
  notes              String?

  supplier           Supplier             @relation(fields: [supplierId], references: [id])
  generatedBatches   FinishedGoodsBatch[]

  @@map("direct_purchases")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/packaging-purchases/
│   ├── page.tsx                      # سجل فواتير التعبئة والتغليف
│   └── new/page.tsx                  # نموذج تسجيل شراء كراتين
├── app/(dashboard)/finished-purchases/
│   ├── page.tsx                      # سجل صفقات البضاعة الجاهزة
│   └── new/page.tsx                  # نموذج قيد صفقة بضاعة مباشرة
├── components/modules/procurement/
│   ├── packaging-purchase-form.tsx   # نموذج شراء المستلزمات
│   └── direct-deal-form.tsx          # نموذج صفقة البضاعة الجاهزة
└── lib/validations/purchases.ts      # Zod Schemas
```

---

## 6. كود الـ Server Actions بـ Prisma Transactions

### أ. شراء المستلزمات (`actions/packaging-purchases.ts`)
```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';

export async function addPackagingPurchase(data: {
  supplyId: string;
  supplierId: string;
  qty: number;
  unitPrice: number;
  invoiceNo?: string;
  date?: string;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_OPERATION')) {
    return { success: false, error: 'غير مصرح لك بتسجيل مشتريات مستلزمات' };
  }

  const totalCost = data.qty * data.unitPrice;
  const pDate = data.date ? new Date(data.date) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. زيادة رصيد المستلزم
      const supply = await tx.supply.update({
        where: { id: data.supplyId },
        data: { stock: { increment: data.qty } },
      });

      // 2. توليد قيد AP لمورد المستلزمات
      const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });
      const txnCount = await tx.financialTransaction.count();
      const txnId = `TXN-${pDate.getFullYear()}-${String(txnCount + 1).padStart(3, '0')}`;

      await tx.financialTransaction.create({
        data: {
          txnId,
          date: pDate,
          type: 'استحقاق توريد مستلزمات (AP)',
          partyType: 'مورد مستلزمات',
          partyId: data.supplierId,
          partyName: supplier?.name || 'مورد مستلزمات',
          amountEgp: totalCost,
          currency: 'EGP',
          refDoc: data.invoiceNo || `SUP-PUR-${Date.now().toString().slice(-4)}`,
          description: `شراء ${data.qty} ${supply.unit} (${supply.name}) بسعر ${data.unitPrice} ج.م`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      return { newStock: supply.stock, totalCost };
    });

    revalidatePath('/packaging-purchases');
    revalidatePath('/supplies');
    revalidatePath('/financials');
    return { success: true, message: `تم قيد الشراء بنجاح والرصيد الحالي أصبح ${result.newStock}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

### ب. قيد صفقة بضاعة جاهزة (`actions/direct-deals.ts`)
```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';

export async function addDirectPurchaseDeal(data: {
  supplierId: string;
  stationId: string;
  productName: string;
  qtyKg: number;
  purchasePricePerKg: number;
  transportCost: number;
  packageType?: string;
  packageCount?: number;
  invoiceNo?: string;
  date?: string;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_OPERATION')) {
    return { success: false, error: 'غير مصرح لك بقيد صفقات' };
  }

  const totalCost = (data.qtyKg * data.purchasePricePerKg) + (data.transportCost || 0);
  const costPerKg = totalCost / data.qtyKg;
  const dDate = data.date ? new Date(data.date) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const dealCount = await tx.directPurchaseDeal.count();
      const dealId = `DEAL-${dDate.getFullYear()}-${String(dealCount + 1).padStart(3, '0')}`;

      const dateStr = dDate.toISOString().substring(0, 10).replace(/-/g, '');
      const fgBatchId = `FG-DIR-${dateStr}-${String(dealCount + 1).padStart(2, '0')}`;

      // 1. إنشاء سجل الصفقة
      await tx.directPurchaseDeal.create({
        data: {
          dealId,
          date: dDate,
          supplierId: data.supplierId,
          productName: data.productName,
          stationId: data.stationId,
          qtyKg: data.qtyKg,
          packageType: data.packageType,
          packageCount: data.packageCount,
          purchasePricePerKg: data.purchasePricePerKg,
          transportCost: data.transportCost || 0,
          totalCost,
          costPerKg,
          generatedBatchId: fgBatchId,
          invoiceNo: data.invoiceNo,
        },
      });

      // 2. إنشاء باتش المنتج الجاهز فوراً بالمخزن
      const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });
      await tx.finishedGoodsBatch.create({
        data: {
          fgBatchId,
          sourceType: 'DIRECT_PURCHASE',
          dealRef: dealId,
          stationId: data.stationId,
          productName: data.productName,
          productionDate: dDate,
          initialQty: data.qtyKg,
          availableQty: data.qtyKg,
          costPerKg,
          totalValue: totalCost,
          suppliersSummary: [{ supplierName: supplier?.name, sharePct: 100 }],
          createdById: user.id,
        },
      });

      // 3. قيد استحقاق المورد (AP)
      const txnCount = await tx.financialTransaction.count();
      const txnId = `TXN-${dDate.getFullYear()}-${String(txnCount + 1).padStart(3, '0')}`;

      await tx.financialTransaction.create({
        data: {
          txnId,
          date: dDate,
          type: 'استحقاق شراء صفقة جاهزة (AP)',
          partyType: 'مورد جاهز',
          partyId: data.supplierId,
          partyName: supplier?.name || 'مورد بضاعة جاهزة',
          amountEgp: totalCost,
          currency: 'EGP',
          refDoc: dealId,
          description: `استحقاق شراء صفقة بضاعة جاهزة ${data.qtyKg.toLocaleString()} كجم ${data.productName} بالباتش ${fgBatchId}`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      return { dealId, fgBatchId };
    });

    revalidatePath('/finished-purchases');
    revalidatePath('/inventory');
    revalidatePath('/financials');
    return { success: true, message: `تم قيد الصفقة وتوليد الباتش الجاهز ${result.fgBatchId}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 10)
1. **اختبار شراء الكراتين:**
   - شراء 1,000 كرتونة تصدير 10 كجم بسعر 18.00 ج.م من "الشركة المصرية للكرتون".
   - **التحقق المطلوب:** رصيد الكراتين في جدول `supplies` يزداد بـ 1,000 كرتونة، وظهور قيد AP بقيمة 18,000.00 ج.م.
2. **اختبار صفقة بضاعة جاهزة:**
   - تسجيل صفقة 5,000 كجم فراولة مجمدة جاهزة من "شركة النيل للصناعات الغذائية" بسعر 35.00 ج.م للكيلو في محطة السادات.
   - **التحقق المطلوب:** توليد باتش في مخزن الجاهز بكود `FG-DIR-` برصيد 5,000 كجم وقيمة 175,000.00 ج.م وقيد استحقاق للمورد.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] عمليات شراء الكراتين تزيد رصيد المخزن الفعلي وتولد قيد AP.
- [ ] صفقات البضاعة الجاهزة تولد باتشات جاهزة للشحن الفوري دون الحاجة لخط تصنيع.
- [ ] الحركات المالية مسجلة في دفتر الأستاذ بدقة متناهية.
