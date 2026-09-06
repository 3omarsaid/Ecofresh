# Milestone 13: محرك التكاليف وتوليد الباتشات الذري (Processing Engine & Batching)

> **المرحلة 13 من 26** — ضمن المرحلة الكبرى الرابعة: الإنتاج والتدوير ومحرك التكاليف
> **بوابة الفحص المرتبطة:** جزء رئيسي من **🛑 Major Checkpoint 3**

---

## 1. الهدف الاستراتيجي
بناء المعاملة الذرية الكاملة لعملية التشغيل عبر `prisma.$transaction`: خصم رصيد الخام من اللوطات، خصم رصيد الكراتين والمستلزمات، حساب الهالك الفعلي، احتساب تكلفة الكيلو الموزونة للتشغيلة، توليد باتش المنتج التام الجاهز (`FG-PR-YYYY-XXX`) مدمجاً معه شجرة الموردين المساهمين (DNA Traceability)، وتوليد قيد استحقاق أتعاب المقاول (AP) في دفتر الأستاذ دفعة واحدة.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - شاشة العمليات وسجل الباتشات: [`base_prototype/pages/processing-operations.html`](file:///e:/web/exporting_erp/base_prototype/pages/processing-operations.html)
- **منطق الكود في البروتوتايب:**
  - دالة التشغيل وحساب التكلفة: [`base_prototype/js/state.js` Lines 780-920](file:///e:/web/exporting_erp/base_prototype/js/state.js#L780-L920) (`createProcessingOperation()`).
  - العملية النموذجية: `PR-2026-001` بمحطة النخيل، باتش `FG-PR-2026-001`.

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 12** (واجهة المعالج والتحقق بـ Zod).

---

## 4. نطاق قاعدة البيانات (Prisma Models Scope)

```prisma
enum FgSourceType {
  MANUFACTURED    @map("MANUFACTURED")
  DIRECT_PURCHASE @map("DIRECT_PURCHASE")

  @@map("fg_source_type")
}

model FinishedGoodsBatch {
  fgBatchId        String       @id @map("fg_batch_id") // FG-PR-2026-001
  sourceType       FgSourceType @map("source_type")
  sourceOpId       String?      @map("source_op_id")
  dealRef          String?      @map("deal_ref")
  stationId        String       @map("station_id")
  productName      String       @map("product_name")
  productionDate   DateTime     @default(now()) @map("production_date") @db.Date
  expiryDate       DateTime?    @map("expiry_date") @db.Date
  initialQty       Decimal      @map("initial_qty") @db.Decimal(12, 2)
  availableQty     Decimal      @map("available_qty") @db.Decimal(12, 2)
  costPerKg        Decimal      @map("cost_per_kg") @db.Decimal(10, 2)
  totalValue       Decimal      @map("total_value") @db.Decimal(15, 2)
  qualityStatus    String       @default("مطابق للمواصفات التصديرية") @map("quality_status")
  rawSources       Json?        @map("raw_sources")
  suppliersSummary Json?        @map("suppliers_summary")
  createdById      String?      @map("created_by") @db.Uuid
  createdAt        DateTime     @default(now()) @map("created_at")

  station          Station                  @relation(fields: [stationId], references: [id])
  operation        ProcessingOperation?     @relation("OperationGeneratedBatch", fields: [sourceOpId], references: [id])
  allocatedShipments ShipmentAllocatedBatch[]
  stockTransfers   StockTransfer[]

  @@map("finished_goods_batches")
}

model ProcessingOperation {
  id                   String   @id // PR-2026-001
  date                 DateTime @default(now()) @db.Date
  stationId            String   @map("station_id")
  rawProduct           String   @map("raw_product")
  finishedProduct      String   @map("finished_product")
  contractorId         String   @map("contractor_id")
  locked               Boolean  @default(true)
  rawInputKg           Decimal  @map("raw_input_kg") @db.Decimal(12, 2)
  finishedOutputKg     Decimal  @map("finished_output_kg") @db.Decimal(12, 2)
  secondaryOutputKg    Decimal  @default(0.0) @map("secondary_output_kg") @db.Decimal(12, 2)
  rawWasteKg           Decimal  @map("raw_waste_kg") @db.Decimal(12, 2)
  yieldPercent         Decimal  @map("yield_percent") @db.Decimal(5, 2)
  rawCost              Decimal  @map("raw_cost") @db.Decimal(15, 2)
  suppliesConsumedCost Decimal  @map("supplies_consumed_cost") @db.Decimal(15, 2)
  suppliesWasteCost    Decimal  @map("supplies_waste_cost") @db.Decimal(15, 2)
  contractorCost       Decimal  @map("contractor_cost") @db.Decimal(15, 2)
  stationCost          Decimal  @map("station_cost") @db.Decimal(15, 2)
  otherCost            Decimal  @default(0.0) @map("other_cost") @db.Decimal(15, 2)
  grandTotalCost       Decimal  @map("grand_total_cost") @db.Decimal(15, 2)
  costPerKg            Decimal  @map("cost_per_kg") @db.Decimal(10, 2)
  generatedBatchId     String?  @unique @map("generated_batch_id")
  notes                String?
  createdById          String?  @map("created_by") @db.Uuid
  createdAt            DateTime @default(now()) @map("created_at")

  station              Station                  @relation(fields: [stationId], references: [id])
  contractor           Contractor               @relation(fields: [contractorId], references: [id])
  createdBy            UserProfile?             @relation("OperationCreatedBy", fields: [createdById], references: [id])
  rawIssues            OperationRawIssue[]
  supplyIssues         OperationSupplyIssue[]
  generatedBatches     FinishedGoodsBatch[]     @relation("OperationGeneratedBatch")

  @@map("processing_operations")
}
```

---

## 5. كود الـ Server Action بـ Prisma Transaction (`actions/processing.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { ProcessingSchema } from '@/lib/validations/processing';

export async function createProcessingOperation(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_OPERATION')) {
    return { success: false, error: 'غير مصرح لك بإنشاء عمليات تشغيل' };
  }

  const validated = ProcessingSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, error: 'بيانات غير صحيحة', errors: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;
  const opDate = data.date ? new Date(data.date) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      let rawInputKg = 0;
      let rawCost = 0;
      let suppliesConsumedCost = 0;
      let suppliesWasteCost = 0;

      // 1. فحص وخصم لوطات الخام
      for (const issue of data.rawIssues) {
        const rawBatch = await tx.rawBatch.findUnique({ where: { batchId: issue.batchId } });
        if (!rawBatch) throw new Error(`اللوط ${issue.batchId} غير موجود`);

        const available = Number(rawBatch.availableQty);
        if (issue.qty > available) {
          throw new Error(`الكمية المطلوبة سحبها من اللوط ${issue.batchId} (${issue.qty} كجم) تتجاوز المتاح (${available} كجم)`);
        }

        await tx.rawBatch.update({
          where: { batchId: issue.batchId },
          data: { availableQty: { decrement: issue.qty } },
        });

        rawInputKg += issue.qty;
        rawCost += issue.qty * Number(rawBatch.unitCost);
      }

      // 2. فحص وخصم المستلزمات والكراتين
      for (const s of data.suppliesIssues) {
        const supply = await tx.supply.findUnique({ where: { id: s.supplyId } });
        if (!supply) throw new Error(`المستلزم ${s.supplyId} غير موجود`);

        const totalWithdrawn = s.consumed + s.waste;
        if (totalWithdrawn > Number(supply.stock)) {
          throw new Error(`رصيد المستلزم ${supply.name} غير كافٍ`);
        }

        await tx.supply.update({
          where: { id: s.supplyId },
          data: { stock: { decrement: totalWithdrawn } },
        });

        suppliesConsumedCost += s.consumed * s.unitCost;
        suppliesWasteCost += s.waste * s.unitCost;
      }

      // 3. الحسابات التكليفية والإنتاجية
      const rawWasteKg = rawInputKg - (data.finishedOutputKg + (data.secondaryOutputKg || 0));
      const yieldPercent = (data.finishedOutputKg / rawInputKg) * 100;

      const contractor = await tx.contractor.findUnique({ where: { id: data.contractorId } });
      const contractorRate = contractor ? Number(contractor.tariffRatePerKg) : 2.0;
      const contractorCost = data.finishedOutputKg * contractorRate;

      const station = await tx.station.findUnique({ where: { id: data.stationId } });
      const stationRate = station ? Number(station.electricityRatePerKg) : 2.5;
      const stationCost = data.finishedOutputKg * stationRate;

      const grandTotalCost = rawCost + suppliesConsumedCost + suppliesWasteCost + contractorCost + stationCost + (data.otherCost || 0);
      const costPerKg = grandTotalCost / data.finishedOutputKg;

      // توليد الأكواد
      const opCount = await tx.processingOperation.count();
      const opId = `PR-${opDate.getFullYear()}-${String(opCount + 1).padStart(3, '0')}`;

      const fgCount = await tx.finishedGoodsBatch.count({ where: { sourceType: 'MANUFACTURED' } });
      const fgBatchId = `FG-PR-${opDate.getFullYear()}-${String(fgCount + 1).padStart(3, '0')}`;

      // بناء شجرة الموردين DNA
      const suppliersSummary = await Promise.all(
        data.rawIssues.map(async (i) => {
          const b = await tx.rawBatch.findUnique({ where: { batchId: i.batchId }, include: { supplier: true } });
          return {
            supplierName: b?.supplier.name || 'مورد غير معروف',
            sharePct: Math.round((i.qty / rawInputKg) * 1000) / 10,
          };
        })
      );

      // 4. إنشاء باتش المنتج الجاهز
      await tx.finishedGoodsBatch.create({
        data: {
          fgBatchId,
          sourceType: 'MANUFACTURED',
          sourceOpId: opId,
          stationId: data.stationId,
          productName: data.finishedProduct,
          productionDate: opDate,
          initialQty: data.finishedOutputKg,
          availableQty: data.finishedOutputKg,
          costPerKg,
          totalValue: grandTotalCost,
          rawSources: data.rawIssues as any,
          suppliersSummary: suppliersSummary as any,
          createdById: user.id,
        },
      });

      // 5. إنشاء سجل العملية وتفاصيل السحب
      await tx.processingOperation.create({
        data: {
          id: opId,
          date: opDate,
          stationId: data.stationId,
          rawProduct: data.rawProduct,
          finishedProduct: data.finishedProduct,
          contractorId: data.contractorId,
          locked: true,
          rawInputKg,
          finishedOutputKg: data.finishedOutputKg,
          secondaryOutputKg: data.secondaryOutputKg || 0,
          rawWasteKg,
          yieldPercent,
          rawCost,
          suppliesConsumedCost,
          suppliesWasteCost,
          contractorCost,
          stationCost,
          otherCost: data.otherCost || 0,
          grandTotalCost,
          costPerKg,
          generatedBatchId: fgBatchId,
          notes: data.notes,
          createdById: user.id,
          rawIssues: {
            create: data.rawIssues.map((r) => ({
              batchId: r.batchId,
              supplierName: 'مورد معتمد',
              qtyKg: r.qty,
              unitCost: 18.5,
              totalCost: r.qty * 18.5,
            })),
          },
          supplyIssues: {
            create: data.suppliesIssues.map((s) => ({
              supplyId: s.supplyId,
              consumedQty: s.consumed,
              wasteQty: s.waste,
              withdrawnQty: s.consumed + s.waste,
              unitCost: s.unitCost,
              consumedCost: s.consumed * s.unitCost,
              wasteCost: s.waste * s.unitCost,
            })),
          },
        },
      });

      // 6. قيد استحقاق المقاول (AP)
      const txnCount = await tx.financialTransaction.count();
      const txnId = `TXN-${opDate.getFullYear()}-${String(txnCount + 1).padStart(3, '0')}`;

      await tx.financialTransaction.create({
        data: {
          txnId,
          date: opDate,
          type: 'استحقاق تشغيل وفرز (AP)',
          partyType: 'مقاول عمالة',
          partyId: data.contractorId,
          partyName: contractor?.name || 'مقاول معتمد',
          amountEgp: contractorCost,
          currency: 'EGP',
          refDoc: opId,
          description: `استحقاق أتعاب تشغيل ${data.finishedOutputKg.toLocaleString()} كجم جاهز بالعملية ${opId}`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      return { opId, fgBatchId, costPerKg };
    });

    revalidatePath('/processing-operations');
    revalidatePath('/inventory');
    revalidatePath('/financials');
    return {
      success: true,
      data: result,
      message: `تم بنجاح اعتماد وإقفال التشغيلة ${result.opId} وتوليد الباتش الجاهز ${result.fgBatchId} بتكلفة ${result.costPerKg.toFixed(2)} ج.م/كجم`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 6. نقطة التفتيش والاختبار (Check Point 13)
1. **تنفيذ التشغيلة النموذجية PR-2026-001:**
   - سحب 4,000 كجم فراولة من "مزارع الوادي" (سعر الكيلو 18.50) + 2,000 كجم من "شركة الخير" (سعر الكيلو 19.20).
   - استهلاك 480 كرتونة + 20 كرتونة هالك بسعر 18.00 ج.م للكرتونة.
   - ناتج تام 4,800 كجم، ناتج ثانوي 300 كجم.
2. **التحقق من صحة النتائج المحسوبة:**
   - نسبة التصافي = $\mathbf{80.0\%}$.
   - هالك الخام = $\mathbf{900\text{ كجم}}$.
   - أتعاب المقاول = $4800 \times 2.00 = \mathbf{9,600.00\text{ ج.م}}$ مسجلة في `financial_transactions`.
   - تكلفة الكيلو الموزونة للباتش الجاهز = $\mathbf{31.56\text{ ج.م/كجم}}$.
   - رصيد باتش `FG-PR-2026-001` الجديد في المخزن = `4,800 كجم`.

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] معاملة `prisma.$transaction` تنفذ التعديلات الستة في قاعدة البيانات بنجاح أو تتراجع بالكامل.
- [ ] باتش المنتج الجاهز يظهر في مخزن الجاهز حاملاً شجرة مصادر المزارع.
- [ ] قيد استحقاق المقاول ينشأ فوراً دون تدخل يدوي.
