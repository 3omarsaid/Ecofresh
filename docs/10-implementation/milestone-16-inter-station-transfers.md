# Milestone 16: التحويلات اللوجستية بين المحطات (Inter-Station Transfers)

> **المرحلة 16 من 26** — ضمن المرحلة الكبرى الخامسة: المخازن والتتبع اللوجستي والهالك
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 3**

---

## 1. الهدف الاستراتيجي
بناء منظومة التحويلات اللوجستية لنقل رصيد الباتشات الجاهزة بين محطات التبريد المختلفة بسيارات النقل المبرد، وإصلاح الخلل البرمجي الموجود بالبروتوتايب القديم، وتسجيل أذون التحويل الرسمية (`TRF-YYYY-XXX`) ببيانات السائق ولوحة السيارة.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - نافذة التحويل بين المحطات: [`base_prototype/pages/inventory.html` Lines 850-920](file:///e:/web/exporting_erp/base_prototype/pages/inventory.html#L850-L920)
  - سجل حركات النقل: [`base_prototype/pages/stock-movements.html`](file:///e:/web/exporting_erp/base_prototype/pages/stock-movements.html)
- **منطق الكود في البروتوتايب:**
  - دالة التحويل القديمة: [`base_prototype/js/state.js` Lines 1126-1158](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1126-L1158) (`createStockTransfer()`).
  - **الخلل البرمجي المصحح:** في البروتوتايب كان يتم طرح الكمية ثم إضافتها لنفس السجل فوراً (`batch.availableQty -= qty; batch.availableQty += qty;`)؛ والحل السليم هو خصم المصدر وإنشاء رصيد جديد في المحطة المستقبلة.

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 03** (المحطات) و **Milestone 14** (باتشات الجاهز بالمخزن).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
model StockTransfer {
  transferId    String   @id @map("transfer_id") // TRF-2026-001
  date          DateTime @default(now()) @db.Date
  fromStationId String   @map("from_station_id")
  toStationId   String   @map("to_station_id")
  batchId       String   @map("batch_id")
  productName   String   @map("product_name")
  qtyKg         Decimal  @map("qty_kg") @db.Decimal(12, 2)
  truckPlate    String?  @map("truck_plate")
  driverName    String?  @map("driver_name")
  status        String   @default("تم الاستلام بنجاح")
  notes         String?
  createdById   String?  @map("created_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")

  fromStation   Station            @relation("TransfersFromStation", fields: [fromStationId], references: [id])
  toStation     Station            @relation("TransfersToStation", fields: [toStationId], references: [id])
  batch         FinishedGoodsBatch @relation(fields: [batchId], references: [fgBatchId])
  createdBy     UserProfile?       @relation("TransferCreatedBy", fields: [createdById], references: [id])

  @@map("stock_transfers")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/inventory/transfers/
│   └── page.tsx                      # سجل أذون التحويل بين المحطات
├── components/modules/inventory/
│   ├── transfer-modal.tsx            # نافذة منبثقة للتحويل السريع
│   └── transfer-log-table.tsx        # جدول أذون النقل وسائقي الشاحنات
└── lib/validations/transfer.ts       # Zod Schema للتحويل
```

### كود الـ Validation بـ Zod (`lib/validations/transfer.ts`):
```ts
import { z } from 'zod';

export const TransferSchema = z.object({
  fromStationId: z.string().min(1, 'المحطة المصدر مطلوبة'),
  toStationId: z.string().min(1, 'المحطة الوجهة مطلوبة'),
  batchId: z.string().min(1, 'يجب اختيار الباتش المراد نقله'),
  qtyKg: z.coerce.number().positive('الكمية المنقولة يجب أن تكون أكبر من 0'),
  truckPlate: z.string().min(3, 'رقم لوحة سيارة النقل مطلوب'),
  driverName: z.string().min(3, 'اسم السائق مطلوب'),
  date: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.fromStationId !== data.toStationId, {
  message: 'لا يمكن التحويل لنفس المحطة',
  path: ['toStationId'],
});
```

---

## 6. كود الـ Server Action بـ Prisma Transaction (`actions/transfers.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { TransferSchema } from '@/lib/validations/transfer';

export async function createStockTransfer(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_OPERATION')) {
    return { success: false, error: 'غير مصرح لك بعمل تحويلات بين المحطات' };
  }

  const validated = TransferSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;
  const transferDate = data.date ? new Date(data.date) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. فحص الباتش المصدر وقفل السجل
      const sourceBatch = await tx.finishedGoodsBatch.findUnique({
        where: { fgBatchId: data.batchId },
      });

      if (!sourceBatch) throw new Error('الباتش المراد نقله غير موجود');

      const available = Number(sourceBatch.availableQty);
      if (data.qtyKg > available) {
        throw new Error(`الكمية المطلوب تحويلها (${data.qtyKg} كجم) تتجاوز الرصيد المتاح (${available} كجم)`);
      }

      // 2. خصم الكمية من الباتش المصدر
      await tx.finishedGoodsBatch.update({
        where: { fgBatchId: data.batchId },
        data: { availableQty: { decrement: data.qtyKg } },
      });

      // 3. إنشاء أو زيادة الرصيد بالمحطة المستقبلة
      const targetBatchId = `${data.batchId}-T-${data.toStationId}`;
      const existingTarget = await tx.finishedGoodsBatch.findUnique({ where: { fgBatchId: targetBatchId } });

      if (existingTarget) {
        await tx.finishedGoodsBatch.update({
          where: { fgBatchId: targetBatchId },
          data: {
            availableQty: { increment: data.qtyKg },
            initialQty: { increment: data.qtyKg },
            totalValue: { increment: data.qtyKg * Number(sourceBatch.costPerKg) },
          },
        });
      } else {
        await tx.finishedGoodsBatch.create({
          data: {
            fgBatchId: targetBatchId,
            sourceType: sourceBatch.sourceType,
            sourceOpId: sourceBatch.sourceOpId,
            dealRef: sourceBatch.dealRef,
            stationId: data.toStationId,
            productName: sourceBatch.productName,
            productionDate: sourceBatch.productionDate,
            expiryDate: sourceBatch.expiryDate,
            initialQty: data.qtyKg,
            availableQty: data.qtyKg,
            costPerKg: sourceBatch.costPerKg,
            totalValue: data.qtyKg * Number(sourceBatch.costPerKg),
            rawSources: sourceBatch.rawSources as any,
            suppliersSummary: sourceBatch.suppliersSummary as any,
            createdById: user.id,
          },
        });
      }

      // 4. توليد رقم إذن النقل TRF-YYYY-XXX
      const count = await tx.stockTransfer.count();
      const transferId = `TRF-${transferDate.getFullYear()}-${String(count + 1).padStart(3, '0')}`;

      await tx.stockTransfer.create({
        data: {
          transferId,
          date: transferDate,
          fromStationId: data.fromStationId,
          toStationId: data.toStationId,
          batchId: data.batchId,
          productName: sourceBatch.productName,
          qtyKg: data.qtyKg,
          truckPlate: data.truckPlate,
          driverName: data.driverName,
          status: 'تم الاستلام بنجاح',
          notes: data.notes,
          createdById: user.id,
        },
      });

      return { transferId, remainingSource: available - data.qtyKg, targetBatchId };
    });

    revalidatePath('/inventory');
    revalidatePath('/inventory/transfers');
    return {
      success: true,
      data: result,
      message: `تم بنجاح توثيق إذن التحويل ${result.transferId} ونقل الرصيد إلى المحطة بنجاح`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 16)
1. **اختبار المعاملة الذرية للتحويل:**
   - تحويل `1,000 كجم` من باتش `FG-PR-2026-001` (الموجود بمحطة النخيل برصيد 4,800 كجم) إلى محطة السلام.
   - **التحقق المطلوب:**
     - انخفاض رصيد باتش النخيل ليصبح $\mathbf{3,800\text{ كجم}}$.
     - إنشاء باتش فرعي بالسلام برصيد $\mathbf{1,000\text{ كجم}}$ ويحمل نفس التكلفة وشجرة الموردين.
     - تسجيل إذن النقل `TRF-2026-001` في جدول `stock_transfers`.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] دالة `prisma.$transaction` تضمن سلامة رصيد المحطتين معاً.
- [ ] تصحيح الخلل البرمجي القديم بشكل قاطع.
- [ ] إذن التحويل يوضح السائق ورقم السيارة والمحطتين.
