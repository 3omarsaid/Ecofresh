# API Conventions — Next.js + Supabase

## المبادئ الأساسية

| المبدأ | التطبيق |
|-------|--------|
| **Server Actions للـ mutations** | كل write operation = Server Action |
| **Server Components للـ reads** | جلب البيانات في Server Component مباشرة |
| **Zod validation إلزامي** | كل Server Action له Schema |
| **Atomic DB functions** | عمليات multi-table = PostgreSQL function |
| **Type-safe Supabase** | استخدام auto-generated types من CLI |

---

## شكل استجابة Server Actions

```ts
// types/api.ts
export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; errors?: Record<string, string[]> };
```

---

## Error Codes (موحّدة)

```ts
export const ERROR_CODES = {
  UNAUTHORIZED: 'لا تملك صلاحية هذا الإجراء',
  INSUFFICIENT_STOCK: 'الكمية المطلوبة تتجاوز الرصيد المتاح',
  QUANTITY_EXCEEDS_ORDER: 'الكمية تتجاوز رصيد الطلبية المتبقي',
  ORDER_NOT_FOUND: 'الطلبية غير موجودة',
  BATCH_LOCKED: 'العملية مقفلة ولا تقبل التعديل',
  INVALID_QC_STATUS: 'لوط الخام غير معتمد',
  DUPLICATE_CODE: 'الكود مكرر مسبقاً',
  DB_ERROR: 'خطأ في قاعدة البيانات',
} as const;
```

---

## نمط Server Action القياسي

```ts
"use server";

export async function exampleAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  // 1. Auth check
  const user = await getCurrentUser();
  if (!user) return { success: false, error: ERROR_CODES.UNAUTHORIZED };
  if (!can(user.role, 'REQUIRED_PERMISSION')) {
    return { success: false, error: ERROR_CODES.UNAUTHORIZED };
  }

  // 2. Schema validation
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      success: false,
      error: 'بيانات غير صحيحة',
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // 3. Business logic / DB call
  const supabase = createServerClient();
  const { data, error } = await supabase.rpc('...', { ... });

  if (error) return { success: false, error: error.message };

  // 4. Revalidate affected paths
  revalidatePath('/...');

  // 5. Return success
  return { success: true, data, message: 'تم بنجاح ✅' };
}
```

---

## Supabase Query Patterns

```ts
// قراءة بسيطة
const { data } = await supabase
  .from('customers')
  .select('id, name, country')
  .eq('status', 'نشط')
  .order('name');

// قراءة مع علاقات
const { data } = await supabase
  .from('shipments')
  .select(`
    *,
    client_orders (
      order_id,
      customers (name, country)
    ),
    shipment_allocated_batches (
      qty_kg,
      finished_goods_batches (fg_batch_id, cost_per_kg)
    )
  `)
  .eq('id', shipmentId)
  .single();

// استدعاء function ذرية
const { data, error } = await supabase.rpc('create_shipment_atomic', {
  p_order_id: orderId,
  p_batches: JSON.stringify(allocatedBatches),
  p_costs: JSON.stringify(costs),
  p_performed_by: user.id,
});
```

---

## Revalidation Strategy

| الإجراء | المسارات التي تُعاد صياغتها |
|--------|--------------------------|
| إضافة خام | `/raw-purchases`, `/inventory/raw`, `/financials` |
| إنتاج جديد | `/processing-operations`, `/inventory`, `/inventory/raw`, `/financials` |
| شحنة جديدة | `/shipments`, `/inventory`, `/client-orders`, `/financials` |
| حركة مالية | `/financials`, `/financials/treasury` |
| تحويل مخزون | `/inventory`, `/warehouses` |

---

## Error Handling في الـ UI

```tsx
// استخدام useFormState مع Server Actions
const [state, formAction] = useFormState(createShipment, initialState);

return (
  <form action={formAction}>
    {/* fields */}
    {!state.success && state.error && (
      <div className="text-red-600 bg-red-50 p-3 rounded">
        {state.error}
      </div>
    )}
    <SubmitButton />
  </form>
);
```
