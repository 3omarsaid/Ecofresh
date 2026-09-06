# Milestone 19: محرك تنفيذ الشحنة واحتساب الربحية (Shipment Engine & Profitability)

> **المرحلة 19 من 26** — ضمن المرحلة الكبرى السادسة: الشحن والتصدير والربحية
> **بوابة الفحص المرتبطة:** جزء رئيسي من **🛑 Major Checkpoint 4**

---

## 1. الهدف الاستراتيجي
بناء المعاملة الذرية الكاملة لتصدير الشحنة عبر `prisma.$transaction`: خصم رصيد الباتشات المخصصة من المخزن، تحديث الكمية المتبقية بالطلبية وحالتها التشغيلية، احتساب الإيرادات باليورو والجنيه وتكاليف الإنتاج والمصروفات اللوجستية، استخراج صافي الربح وهامش الربحية اللحظي، وتوليد فاتورة المبيعات التجارية (AR) للمستورد في دفتر الأستاذ العام تلقائياً.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - سجل الشحنات المعتمدة: [`base_prototype/pages/shipments.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipments.html)
- **منطق الكود في البروتوتايب:**
  - دالة تنفيذ الشحنة: [`base_prototype/js/state.js` Lines 925-1020](file:///e:/web/exporting_erp/base_prototype/js/state.js#L925-L1020) (`createShipment()`).
  - الشحنة النموذجية: `SHP-2026-001` لحاوية `MSKU-987654-2` المتجهة لهولندا.

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 18** (واجهة معالج الشحن والتحقق بـ Zod).

---

## 4. نطاق قاعدة البيانات (Prisma Models Scope)

```prisma
model Shipment {
  shipmentId             String   @id @map("shipment_id") // SHP-2026-001
  orderId                String   @map("order_id")
  customerId             String   @map("customer_id")
  productName            String   @map("product_name")
  dispatchDate           DateTime @default(now()) @map("dispatch_date") @db.Date
  containerNo            String   @map("container_no")
  sealNo                 String   @map("seal_no")
  shippingLine           String   @map("shipping_line")
  bookingNo              String   @map("booking_no")
  shippedQtyKg           Decimal  @map("shipped_qty_kg") @db.Decimal(12, 2)
  productionCostEgp      Decimal  @map("production_cost_egp") @db.Decimal(15, 2)
  inlandTruckingEgp      Decimal  @default(0.0) @map("inland_trucking_egp") @db.Decimal(12, 2)
  oceanFreightEgp        Decimal  @default(0.0) @map("ocean_freight_egp") @db.Decimal(12, 2)
  customsClearanceEgp    Decimal  @default(0.0) @map("customs_clearance_egp") @db.Decimal(12, 2)
  inspectionCertificatesEgp Decimal @default(0.0) @map("inspection_certificates_egp") @db.Decimal(12, 2)
  portTerminalChargesEgp Decimal  @default(0.0) @map("port_terminal_charges_egp") @db.Decimal(12, 2)
  totalShipmentCostEgp   Decimal  @map("total_shipment_cost_egp") @db.Decimal(15, 2)
  sellingPriceEur        Decimal  @map("selling_price_eur") @db.Decimal(10, 3)
  fxRate                 Decimal  @default(53.20) @map("fx_rate") @db.Decimal(10, 4)
  grossRevenueEgp        Decimal  @map("gross_revenue_egp") @db.Decimal(15, 2)
  netProfitEgp           Decimal  @map("net_profit_egp") @db.Decimal(15, 2)
  marginPercent          Decimal  @map("margin_percent") @db.Decimal(5, 2)
  status                 String   @default("تم الشحن والإبحار")
  destinationPort        String   @map("destination_port")
  createdById            String?  @map("created_by") @db.Uuid
  createdAt              DateTime @default(now()) @map("created_at")

  order                  ClientOrder              @relation(fields: [orderId], references: [orderId])
  customer               Customer                 @relation(fields: [customerId], references: [id])
  createdBy              UserProfile?             @relation("ShipmentCreatedBy", fields: [createdById], references: [id])
  allocatedBatches       ShipmentAllocatedBatch[]

  @@map("shipments")
}

model ShipmentAllocatedBatch {
  id           Int      @id @default(autoincrement())
  shipmentId   String   @map("shipment_id")
  fgBatchId    String   @map("fg_batch_id")
  qtyKg        Decimal  @map("qty_kg") @db.Decimal(12, 2)
  costPerKg    Decimal  @map("cost_per_kg") @db.Decimal(10, 2)
  totalCostEgp Decimal  @map("total_cost_egp") @db.Decimal(15, 2)

  shipment     Shipment           @relation(fields: [shipmentId], references: [shipmentId], onDelete: Cascade)
  batch        FinishedGoodsBatch @relation(fields: [fgBatchId], references: [fgBatchId])

  @@map("shipment_allocated_batches")
}
```

---

## 5. كود الـ Server Action بـ Prisma Transaction (`actions/shipments.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { ShipmentSchema } from '@/lib/validations/shipment';

export async function createShipment(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'DISPATCH_SHIPMENT')) {
    return { success: false, error: 'غير مصرح لك باعتماد شحنات تصدير' };
  }

  const validated = ShipmentSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;
  const dispatchDate = data.dispatchDate ? new Date(data.dispatchDate) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. فحص طلبية العميل
      const order = await tx.clientOrder.findUnique({
        where: { orderId: data.orderId },
        include: { customer: true },
      });

      if (!order) throw new Error(`طلبية العميل ${data.orderId} غير مسجلة`);

      // 2. التحقق من الباتشات المخصصة وخصم رصيدها
      let shippedQty = 0;
      let totalProdCost = 0;
      const allocatedBatchesData: any[] = [];

      for (const item of data.allocatedBatches) {
        const batch = await tx.finishedGoodsBatch.findUnique({ where: { fgBatchId: item.fgBatchId } });
        if (!batch) throw new Error(`الباتش ${item.fgBatchId} غير موجود بالمخزن`);

        const available = Number(batch.availableQty);
        if (item.qty > available) {
          throw new Error(`الكمية المخصصة من الباتش ${item.fgBatchId} تتجاوز الرصيد المتاح`);
        }

        // خصم رصيد الباتش
        await tx.finishedGoodsBatch.update({
          where: { fgBatchId: item.fgBatchId },
          data: { availableQty: { decrement: item.qty } },
        });

        const costPerKg = Number(batch.costPerKg);
        const itemTotalCost = item.qty * costPerKg;
        shippedQty += item.qty;
        totalProdCost += itemTotalCost;

        allocatedBatchesData.push({
          fgBatchId: item.fgBatchId,
          qtyKg: item.qty,
          costPerKg: costPerKg,
          totalCostEgp: itemTotalCost,
        });
      }

      // 3. التحقق من كمية الطلبية المتبقية
      const orderUnfulfilled = Number(order.unfulfilledQtyKg);
      if (shippedQty > orderUnfulfilled) {
        throw new Error(`إجمالي كمية الشحنة (${shippedQty} كجم) يتجاوز المتبقي بالطلبية (${orderUnfulfilled} كجم)`);
      }

      // 4. تحديث رصيد وحالة الطلبية
      const remainingUnfulfilled = orderUnfulfilled - shippedQty;
      await tx.clientOrder.update({
        where: { orderId: order.orderId },
        data: {
          unfulfilledQtyKg: remainingUnfulfilled,
          status: remainingUnfulfilled === 0 ? 'مكتملة بالكامل' : 'مشحونة جزئياً',
        },
      });

      // 5. الحسابات المالية والربحية
      const costs = data.costs || {};
      const inlandTrucking = costs.inlandTrucking ?? 6500;
      const oceanFreight = costs.oceanFreight ?? 22000;
      const customsClearance = costs.customsClearance ?? 4500;
      const inspectionCertificates = costs.inspectionCertificates ?? 2500;
      const portTerminalCharges = costs.portTerminalCharges ?? 3500;

      const totalOverhead = inlandTrucking + oceanFreight + customsClearance + inspectionCertificates + portTerminalCharges;
      const totalShipmentCost = totalProdCost + totalOverhead;

      const sellingPriceEur = Number(order.unitPriceEur);
      const fxRate = Number(order.fxRate);
      const grossRevenueEgp = shippedQty * sellingPriceEur * fxRate;
      const netProfitEgp = grossRevenueEgp - totalShipmentCost;
      const marginPercent = (netProfitEgp / grossRevenueEgp) * 100;

      // توليد كود الشحنة
      const shipmentCount = await tx.shipment.count();
      const shipmentId = `SHP-${dispatchDate.getFullYear()}-${String(shipmentCount + 1).padStart(3, '0')}`;

      // 6. إنشاء سجل الشحنة وسجلات التخصيص
      await tx.shipment.create({
        data: {
          shipmentId,
          orderId: order.orderId,
          customerId: order.customerId,
          productName: order.productName,
          dispatchDate,
          containerNo: data.containerNo,
          sealNo: data.sealNo,
          shippingLine: data.shippingLine,
          bookingNo: data.bookingNo,
          shippedQtyKg: shippedQty,
          productionCostEgp: totalProdCost,
          inlandTruckingEgp: inlandTrucking,
          oceanFreightEgp: oceanFreight,
          customsClearanceEgp: customsClearance,
          inspectionCertificatesEgp: inspectionCertificates,
          portTerminalChargesEgp: portTerminalCharges,
          totalShipmentCostEgp: totalShipmentCost,
          sellingPriceEur,
          fxRate,
          grossRevenueEgp,
          netProfitEgp,
          marginPercent,
          status: 'تم الشحن والإبحار',
          destinationPort: order.destinationPort,
          createdById: user.id,
          allocatedBatches: {
            create: allocatedBatchesData.map((b) => ({
              fgBatchId: b.fgBatchId,
              qtyKg: b.qtyKg,
              costPerKg: b.costPerKg,
              totalCostEgp: b.totalCostEgp,
            })),
          },
        },
      });

      // 7. توليد فاتورة العميل التجارية (AR) تلقائياً في دفتر الأستاذ
      const txnCount = await tx.financialTransaction.count();
      const txnId = `TXN-${dispatchDate.getFullYear()}-${String(txnCount + 1).padStart(3, '0')}`;

      await tx.financialTransaction.create({
        data: {
          txnId,
          date: dispatchDate,
          type: 'استحقاق مبيعات تصدير (AR)',
          partyType: 'عميل تصدير',
          partyId: order.customerId,
          partyName: order.customer.name,
          amountEgp: grossRevenueEgp,
          amountCurrency: shippedQty * sellingPriceEur,
          currency: 'EUR',
          refDoc: shipmentId,
          description: `فاتورة تصدير الشحنة ${shipmentId} للحاوية ${data.containerNo} للعميل ${order.customer.name}`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      return { shipmentId, netProfitEgp, marginPercent, grossRevenueEgp };
    });

    revalidatePath('/shipments');
    revalidatePath('/inventory');
    revalidatePath('/client-orders');
    revalidatePath('/financials');

    return {
      success: true,
      data: result,
      message: `تم اعتماد الشحنة ${result.shipmentId} بربح ${result.netProfitEgp.toLocaleString()} ج.م (هامش ${result.marginPercent.toFixed(1)}%) وتوليد فاتورة العميل!`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 6. نقطة التفتيش والاختبار (Check Point 19)
1. **تنفيذ الشحنة النموذجية SHP-2026-001:**
   - طلبية شركة سما `ORD-2026-001` (المتبقي بها 10,000 كجم).
   - تخصيص 4,000 كجم من الباتش `FG-PR-2026-001` (تكلفته 31.56 ج.م).
   - سعر البيع 1.85 EUR، سعر الصرف 53.20، المصاريف اللوجستية 39,000 ج.م.
2. **التحقق المحاسبي والرياضي الصارم:**
   - الإيراد الإجمالي = $4000 \times 1.85 \times 53.20 = \mathbf{393,680.00\text{ ج.م}}$.
   - تكلفة الإنتاج = $4000 \times 31.56 = \mathbf{126,240.00\text{ ج.م}}$.
   - إجمالي التكلفة = $126,240 + 39,000 = \mathbf{165,240.00\text{ ج.م}}$.
   - صافي الربح = $393,680 - 165,240 = \mathbf{228,440.00\text{ ج.م}}$.
   - هامش الربح = $(228,440 / 393,680) \times 100 = \mathbf{58.0\%}$.
   - رصيد الطلبية المتبقي يصبح $\mathbf{6,000\text{ كجم}}$ وحالتها "مشحونة جزئياً".
   - صدور قيد استحقاق العميل (AR) بقيمة 393,680.00 ج.م و 7,400.00 EUR في دفتر الأستاذ.

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] معاملة الشحن الذرية تعمل بنجاح ودون أخطاء نوعية (Zero TypeScript errors).
- [ ] تحديث رصيد المخزن المتاح والطلبية تلقائياً فور الاعتماد.
- [ ] توليد قيد الفاتورة التجارية للعميل في دفتر الأستاذ مباشرة.
