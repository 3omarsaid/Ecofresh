# Milestone 09: ميزان البسكول ووارد المواد الخام (Weighbridge & Raw Receiving)

> **المرحلة 09 من 26** — ضمن المرحلة الكبرى الثالثة: المشتريات والتوريد والطلبيات
> **بوابة الفحص المرتبطة:** جزء رئيسي من **🛑 Major Checkpoint 2**

---

## 1. الهدف الاستراتيجي
بناء دورة استلام سيارات المحاصيل الزراعية عبر ميزان البسكول بالمحطة، واحتساب صافي الوزن آلياً (القائم - الفارغ = الصافي)، واحتساب تكلفة الكيلو الموزونة شاملاً النولون، وتوليد كود اللوط الخام (`LOT-RAW-YYYYMMDD-XX`)، وقيد استحقاق المورد المالي (AP) تلقائياً داخل معاملة ذرية `prisma.$transaction`.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - نموذج الاستلام وميزان البسكول: [`base_prototype/pages/raw-arrival-add.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-arrival-add.html)
  - سجل وارد الخام: [`base_prototype/pages/raw-purchases.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-purchases.html)
- **منطق الكود في البروتوتايب:**
  - دالة قيد الخام وتوليد القيد المالي: [`base_prototype/js/state.js` Lines 644-705](file:///e:/web/exporting_erp/base_prototype/js/state.js#L644-L705) (`addRawMaterialArrival()`).
  - اللوط النموذجي بالبروتوتايب: [`state.js` Line 150](file:///e:/web/exporting_erp/base_prototype/js/state.js#L150) (`LOT-RAW-001` بمزارع الوادي).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 03** (المحطات) و **Milestone 07** (الموردين).

---

## 4. نطاق قاعدة البيانات (Prisma Models Scope)

```prisma
enum QcStatus {
  APPROVED @map("APPROVED")
  PENDING  @map("PENDING")
  REJECTED @map("REJECTED")

  @@map("qc_status_type")
}

model RawBatch {
  batchId          String   @id @map("batch_id") // LOT-RAW-20260815-01
  stationId        String   @map("station_id")
  rawProduct       String   @map("raw_product")
  supplierId       String   @map("supplier_id")
  grossQtyKg       Decimal  @map("gross_qty_kg") @db.Decimal(12, 2)
  tareQtyKg        Decimal  @default(0.0) @map("tare_qty_kg") @db.Decimal(12, 2)
  initialQty       Decimal  @map("initial_qty") @db.Decimal(12, 2)
  availableQty     Decimal  @map("available_qty") @db.Decimal(12, 2)
  unitPriceEgp     Decimal  @map("unit_price_egp") @db.Decimal(10, 2)
  transportCostEgp Decimal  @default(0.0) @map("transport_cost_egp") @db.Decimal(12, 2)
  unitCost         Decimal  @map("unit_cost") @db.Decimal(10, 2)
  totalPayableEgp  Decimal  @map("total_payable_egp") @db.Decimal(15, 2)
  receivedDate     DateTime @default(now()) @map("received_date") @db.Date
  qcStatus         QcStatus @default(APPROVED) @map("qc_status")
  brixDegree       Decimal? @map("brix_degree") @db.Decimal(5, 2)
  truckPlate       String?  @map("truck_plate")
  driverName       String?  @map("driver_name")
  notes            String?
  createdById      String?  @map("created_by") @db.Uuid
  createdAt        DateTime @default(now()) @map("created_at")

  station          Station              @relation(fields: [stationId], references: [id])
  supplier         Supplier             @relation(fields: [supplierId], references: [id])
  createdBy        UserProfile?         @relation("RawBatchCreatedBy", fields: [createdById], references: [id])
  operationIssues  OperationRawIssue[]

  @@map("raw_batches")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/raw-purchases/
│   ├── page.tsx                      # سجل وارد الخام واللوطات المفتوحة
│   └── new/page.tsx                  # نموذج شاشة ميزان البسكول
├── components/modules/procurement/
│   ├── raw-arrival-form.tsx          # النموذج التفاعلي مع الحسابات اللحظية
│   └── raw-batches-table.tsx         # جدول اللوطات مع مؤشرات الجودة والبريكس
└── lib/validations/raw-arrival.ts    # Zod Schema لميزان البسكول
```

### الحسابات اللحظية المباشرة في النموذج (`raw-arrival-form.tsx`):
- $\text{Net Qty (kg)} = \text{Gross Qty} - \text{Tare Qty}$
- $\text{Total Payable (EGP)} = (\text{Net Qty} \times \text{Unit Price}) + \text{Transport Cost}$
- $\text{Weighted Unit Cost (EGP/kg)} = \frac{\text{Total Payable}}{\text{Net Qty}}$

---

## 6. كود الـ Server Action بـ Prisma Transaction (`actions/raw-batches.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { RawArrivalSchema } from '@/lib/validations/raw-arrival';
import type { ActionResult } from './customers';

export async function addRawMaterialArrival(
  payload: unknown
): Promise<ActionResult<{ batchId: string; netQty: number }>> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_OPERATION')) {
    return { success: false, error: 'غير مصرح لك بتسجيل وارد خام' };
  }

  const validated = RawArrivalSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, error: 'بيانات الاستلام غير صحيحة', errors: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;
  const netQty = data.grossQtyKg - data.tareQtyKg;
  if (netQty <= 0) {
    return { success: false, error: 'الوزن الصافي يجب أن يكون أكبر من الصفر' };
  }

  const totalPayable = (netQty * data.unitPriceEgp) + (data.transportCostEgp || 0);
  const unitCost = totalPayable / netQty;
  const receivedDate = data.receivedDate ? new Date(data.receivedDate) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. توليد كود اللوط
      const dateStr = receivedDate.toISOString().substring(0, 10).replace(/-/g, '');
      const count = await tx.rawBatch.count();
      const batchId = `LOT-RAW-${dateStr}-${String(count + 1).padStart(2, '0')}`;

      // 2. إنشاء سجل اللوط
      await tx.rawBatch.create({
        data: {
          batchId,
          stationId: data.stationId,
          supplierId: data.supplierId,
          rawProduct: data.rawProduct,
          grossQtyKg: data.grossQtyKg,
          tareQtyKg: data.tareQtyKg,
          initialQty: netQty,
          availableQty: netQty,
          unitPriceEgp: data.unitPriceEgp,
          transportCostEgp: data.transportCostEgp || 0,
          unitCost,
          totalPayableEgp: totalPayable,
          receivedDate,
          brixDegree: data.brixDegree || null,
          truckPlate: data.truckPlate,
          driverName: data.driverName,
          notes: data.notes,
          createdById: user.id,
        },
      });

      // 3. جلب اسم المورد وقيد استحقاقه (AP)
      const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });
      const txnCount = await tx.financialTransaction.count();
      const txnId = `TXN-${receivedDate.getFullYear()}-${String(txnCount + 1).padStart(3, '0')}`;

      await tx.financialTransaction.create({
        data: {
          txnId,
          date: receivedDate,
          type: 'استحقاق توريد خام (AP)',
          partyType: 'مورد خام',
          partyId: data.supplierId,
          partyName: supplier?.name || 'مورد زراعي',
          amountEgp: totalPayable,
          currency: 'EGP',
          refDoc: batchId,
          description: `استحقاق توريد ${netQty.toLocaleString()} كجم ${data.rawProduct} باللوط ${batchId}`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      return { batchId, netQty };
    });

    revalidatePath('/raw-purchases');
    revalidatePath('/inventory/raw');
    revalidatePath('/financials');

    return {
      success: true,
      data: result,
      message: `تم بنجاح قيد اللوط ${result.batchId} بصافي ${result.netQty.toLocaleString()} كجم وإنشاء استحقاق المورد!`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء قيد الوارد' };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 09)
1. **اختبار معادلة الوزن والتكلفة:**
   - إدخال حمولة سيارة: قائم `5,200 كجم`، فارغ `200 كجم`، سعر الشراء `19.50 ج.م`، نولون `1,000 ج.م`.
   - **التحقق المطلوب:**
     - صافي الوزن = `5,000 كجم`.
     - تكلفة الكيلو الموزونة = $\frac{(5000 \times 19.50) + 1000}{5000} = \mathbf{19.70\text{ ج.م/كجم}}$.
     - إجمالي مستحق الفاتورة = $\mathbf{98,500.00\text{ ج.م}}$.
2. **فحص القيد المحاسبي المولد:**
   - استعلام جدول `financial_transactions` وتأكيد وجود قيد استحقاق للمورد بالقيمة `98,500.00 ج.م` ويحمل رقم اللوط كـ `ref_doc`.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] دورة ميزان البسكول تعمل وتحسب الأوزان والأسعار لحظياً.
- [ ] معاملة `prisma.$transaction` تضمن حفظ اللوط وقيد المورد معاً أو إلغاء كليهما.
- [ ] اللوط يظهر فوراً في جدول وارد الخام وفي مخزن الخام برصيده المتاح.
