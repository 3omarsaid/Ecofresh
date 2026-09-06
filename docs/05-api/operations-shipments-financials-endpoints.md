# API Design — المخزون والعمليات (Next.js)

> كل mutation = **Server Action**. كل استعلام = **Server Component** أو TanStack Query.

---

## مفاتيح التصميم

| القرار | السبب |
|-------|-------|
| Server Actions للـ mutations | Type-safe، لا HTTP boilerplate، تُشغَّل مباشرة من Form |
| Route Handlers للـ exports فقط | PDF generation، webhook callbacks |
| Zod validation دائماً | قبل أي database write |
| Atomic PostgreSQL functions | للعمليات التي تلمس جداول متعددة |

---

## `actions/raw-batches.ts`

### `addRawMaterialArrival(data)`

```ts
"use server";

const RawArrivalSchema = z.object({
  stationId: z.string(),
  rawProduct: z.enum(['فراولة', 'مانجو', 'بامية']),
  supplierId: z.string(),
  grossQtyKg: z.number().positive(),
  tareQtyKg: z.number().min(0).default(0),
  unitPriceEgp: z.number().positive(),
  transportCostEgp: z.number().min(0).default(0),
  receivedDate: z.string().date(),
  brixDegree: z.number().optional(),
  truckPlate: z.string().optional(),
});

export async function addRawMaterialArrival(
  _prevState: unknown,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!can(user.role, 'CREATE_OPERATION')) {
    return { success: false, error: 'UNAUTHORIZED' };
  }

  const parsed = RawArrivalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const { data } = parsed;
  const netQty = data.grossQtyKg - data.tareQtyKg;
  const totalCost = (netQty * data.unitPriceEgp) + data.transportCostEgp;
  const unitCost = totalCost / netQty;

  const supabase = createServerClient();

  // استدعاء PostgreSQL function للأتومية
  const { data: result, error } = await supabase.rpc('add_raw_material_arrival', {
    p_station_id: data.stationId,
    p_supplier_id: data.supplierId,
    p_raw_product: data.rawProduct,
    p_net_qty: netQty,
    p_unit_cost: unitCost,
    p_total_cost: totalCost,
    p_received_date: data.receivedDate,
    p_brix_degree: data.brixDegree,
    p_truck_plate: data.truckPlate,
    p_performed_by: user.id,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/raw-purchases');
  revalidatePath('/inventory/raw');
  revalidatePath('/financials');

  return {
    success: true,
    batchId: result.batch_id,
    message: `تم قيد وارد الخام باللوط ${result.batch_id} برصيد ${netQty} كجم`
  };
}
```

**الـ PostgreSQL function `add_raw_material_arrival` تفعل:**
1. `INSERT INTO raw_batches` برصيد = netQty
2. `INSERT INTO financial_transactions` (AP للمورد)
3. `INSERT INTO audit_log`
4. COMMIT

---

## `actions/processing.ts`

### `createProcessingOperation(data)`

```ts
const ProcessingSchema = z.object({
  stationId: z.string(),
  rawProduct: z.string(),
  finishedProduct: z.string(),
  contractorId: z.string(),
  rawIssues: z.array(z.object({
    batchId: z.string(),
    qtyKg: z.number().positive(),
  })).min(1),
  suppliesIssues: z.array(z.object({
    supplyId: z.string(),
    consumed: z.number().min(0),
    waste: z.number().min(0),
  })),
  finishedOutputKg: z.number().positive(),
  secondaryOutputKg: z.number().min(0).default(0),
  stationCostEgp: z.number().min(0),
  otherCostEgp: z.number().min(0).default(0),
  date: z.string().date(),
});
```

**الـ PostgreSQL function `create_processing_operation_atomic` تفعل:**
1. التحقق: `rawBatch.available_qty >= requested_qty` لكل لوط
2. `UPDATE raw_batches SET available_qty -= qty` لكل لوط
3. `UPDATE supplies SET stock -= (consumed + waste)` لكل مستلزم
4. حساب التكاليف الكاملة
5. `INSERT INTO processing_operations`
6. `INSERT INTO operation_raw_issues` (سجل سحب الخام)
7. `INSERT INTO operation_supply_issues` (سجل الاستهلاك)
8. `INSERT INTO finished_goods_batches` (الباتش الجاهز)
9. `INSERT INTO financial_transactions` (AP للمقاول)
10. `INSERT INTO audit_log`

**الـ revalidations:**
```ts
revalidatePath('/processing-operations');
revalidatePath('/inventory');
revalidatePath('/inventory/raw');
revalidatePath('/financials');
```

---

## `actions/shipments.ts`

### `createShipment(data)`

```ts
const ShipmentSchema = z.object({
  orderId: z.string(),
  dispatchDate: z.string().date(),
  containerNo: z.string(),
  sealNo: z.string(),
  shippingLine: z.string(),
  allocatedBatches: z.array(z.object({
    fgBatchId: z.string(),
    qtyKg: z.number().positive(),
  })).min(1),
  costs: z.object({
    inlandTrucking: z.number().min(0),
    oceanFreight: z.number().min(0),
    customsClearance: z.number().min(0),
    inspectionCertificates: z.number().min(0),
    portTerminalCharges: z.number().min(0),
  }),
});
```

**الـ PostgreSQL function `create_shipment_atomic` تفعل:**
1. التحقق: `order.unfulfilled_qty >= shippedQty`
2. التحقق: `fg_batch.available_qty >= allocated_qty` لكل باتش
3. `UPDATE fg_batches SET available_qty -= qty` لكل باتش
4. `UPDATE client_orders SET unfulfilled_qty -= shippedQty`, تحديث `status`
5. حساب الإيراد والتكلفة والربح
6. `INSERT INTO shipments`
7. `INSERT INTO shipment_allocated_batches`
8. `INSERT INTO financial_transactions` (AR للعميل)
9. `INSERT INTO audit_log`

---

## `actions/financials.ts`

### `addFinancialTransaction(data)`

```ts
const TransactionSchema = z.object({
  type: z.enum([
    'سند تحصيل دفعة (Inflow)',
    'سند سداد دفعة (Outflow)',
  ]),
  partyType: z.enum(['عميل تصدير', 'مورد خام', 'مقاول', 'محطة', 'مورد مستلزمات']),
  partyId: z.string(),
  amountEgp: z.number().positive(),
  accountId: z.string(),
  refDoc: z.string().optional(),
  description: z.string().optional(),
  date: z.string().date(),
  paymentMethod: z.enum(['تحويل بنكي', 'شيك', 'نقدي']),
});
```

**الـ PostgreSQL function تفعل:**
1. التحقق: `accountId` موجود
2. `INSERT INTO financial_transactions`
3. `UPDATE treasury_accounts SET balance += amount` (للتحصيل) أو `-= amount` (للسداد)
4. `INSERT INTO audit_log`

---

## Route Handlers

### `GET /api/export/pdf/shipment/[id]`

```ts
// app/api/export/pdf/shipment/[id]/route.ts
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { data: shipment } = await supabase
    .from('shipments')
    .select('*, client_orders(customers(*)), shipment_allocated_batches(*)')
    .eq('id', params.id)
    .single();

  const pdfBuffer = await generateShipmentPDF(shipment);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${params.id}.pdf"`,
    },
  });
}
```

---

## معايير التحقق (Zod Patterns)

```ts
// حقول عربية مشتركة
const EgpAmount = z.number().positive().multipleOf(0.01);
const EurAmount = z.number().positive().multipleOf(0.001);
const KgAmount = z.number().positive().multipleOf(0.001);
const DateField = z.string().date(); // YYYY-MM-DD
const IdField = z.string().min(1);
```
