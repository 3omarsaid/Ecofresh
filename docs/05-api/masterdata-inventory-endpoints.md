# API Design — البيانات الأساسية والمخزون

---

## `actions/customers.ts`

### `createCustomer(formData)`

**الصلاحية:** admin, supervisor

**Input Schema:**
```ts
const CustomerSchema = z.object({
  code: z.string().min(3).max(20),
  name: z.string().min(3),
  country: z.string(),
  destinationPort: z.string(),
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
  paymentTerms: z.string(),
  creditLimitEgp: z.number().min(0).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});
```

**Supabase query:**
```ts
const { data, error } = await supabase
  .from('customers')
  .insert({ ...parsed.data, status: 'نشط' })
  .select()
  .single();
```

**revalidatePath:** `/customers`

---

### `createCustomerAgreement(customerId, data)`

```ts
const AgreementSchema = z.object({
  productName: z.string(),
  targetPriceEur: z.number().positive(),
  packagingSpec: z.string(),
});
```

```ts
await supabase.from('customer_agreements').insert({
  customer_id: customerId,
  ...parsed.data
});
```

---

## `actions/suppliers.ts`

### `createSupplier(formData)`

```ts
const SupplierSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  type: z.enum(['مورد خام زراعي', 'مورد بضاعة جاهزة', 'مورد مستلزمات']),
  product: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
});
```

---

## Server Components — Queries

### صفحة قائمة العملاء

```ts
// app/(dashboard)/customers/page.tsx
export default async function CustomersPage() {
  const supabase = createServerClient();

  const { data: customers } = await supabase
    .from('customers')
    .select(`
      id, code, name, country, currency, status,
      customer_agreements (count)
    `)
    .order('name');

  return <CustomersTable customers={customers} />;
}
```

---

### صفحة تفاصيل العميل (مع رصيده)

```ts
// app/(dashboard)/customers/[id]/page.tsx
export default async function CustomerDetailPage({ params }) {
  const supabase = createServerClient();

  // بيانات العميل
  const { data: customer } = await supabase
    .from('customers')
    .select('*, customer_agreements(*)')
    .eq('id', params.id)
    .single();

  // كشف الحساب
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('party_id', params.id)
    .order('date', { ascending: false });

  // الرصيد المحسوب (عبر PostgreSQL view أو function)
  const { data: balance } = await supabase
    .rpc('get_customer_balance', { p_customer_id: params.id });

  return (
    <CustomerDetail
      customer={customer}
      transactions={transactions}
      balance={balance}
    />
  );
}
```

---

## `actions/supplies.ts`

### `addSupplyStock(supplyId, data)` — إضافة رصيد لمستلزم

```ts
const SupplyStockSchema = z.object({
  qty: z.number().positive(),
  unitPrice: z.number().positive(),
  supplierId: z.string(),
  invoiceNo: z.string().optional(),
  date: z.string().date(),
});
```

```ts
// Transaction: تحديث الرصيد + قيد AP
const { error } = await supabase.rpc('add_supply_stock', {
  p_supply_id: supplyId,
  p_qty: data.qty,
  p_unit_price: data.unitPrice,
  p_supplier_id: data.supplierId,
  p_performed_by: user.id,
});
```

---

## PostgreSQL Views (للـ Aggregations)

### `v_customer_balances`

```sql
CREATE VIEW v_customer_balances AS
SELECT
  c.id,
  c.name,
  COALESCE(SUM(CASE WHEN t.direction = 'AR' THEN t.amount_egp ELSE 0 END), 0) AS total_invoiced,
  COALESCE(SUM(CASE WHEN t.direction = 'Inflow' THEN t.amount_egp ELSE 0 END), 0) AS total_collected,
  COALESCE(SUM(CASE WHEN t.direction = 'AR' THEN t.amount_egp ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN t.direction = 'Inflow' THEN t.amount_egp ELSE 0 END), 0) AS outstanding_balance
FROM customers c
LEFT JOIN financial_transactions t ON t.party_id = c.id
GROUP BY c.id, c.name;
```

### `v_inventory_summary`

```sql
CREATE VIEW v_inventory_summary AS
SELECT
  fg.station_id,
  fg.product_name,
  COUNT(*) AS batch_count,
  SUM(fg.available_qty) AS total_available_kg,
  SUM(fg.total_value) AS total_value_egp,
  AVG(fg.cost_per_kg) AS avg_cost_per_kg
FROM finished_goods_batches fg
WHERE fg.available_qty > 0
GROUP BY fg.station_id, fg.product_name;
```

---

## Realtime Subscriptions (للإشعارات)

```ts
// في Client Component — إشعار عند انخفاض المخزون
useEffect(() => {
  const channel = supabase
    .channel('inventory-alerts')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'raw_batches',
      filter: 'available_qty=lt.1000',
    }, (payload) => {
      toast.warning(`⚠️ مخزون منخفض: ${payload.new.batch_id}`);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```
