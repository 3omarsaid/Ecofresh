# سياسات RLS لكل الجداول — Supabase

## الاتفاقية العامة

```
SELECT  → كل authenticated users
INSERT  → حسب الدور
UPDATE  → admin + supervisor فقط (مع قيود بيزنسية)
DELETE  → admin فقط (أو ممنوع نهائياً لجداول سجل محاسبية)
```

---

## Supabase Helper Function (مشتركة)

```sql
-- دالة مساعدة لجلب دور المستخدم الحالي
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## جدول `user_profiles`

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON user_profiles
  FOR SELECT USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

-- إنشاء يتم عبر trigger تلقائياً
CREATE POLICY "profiles_admin_all" ON user_profiles
  FOR ALL USING (get_user_role() = 'admin');
```

---

## جدول `customers`

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_all_read" ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "customers_write" ON customers FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "customers_update" ON customers FOR UPDATE
  USING (get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "customers_delete" ON customers FOR DELETE
  USING (get_user_role() = 'admin');
```

---

## جدول `customer_agreements`

```sql
ALTER TABLE customer_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agreements_read" ON customer_agreements FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "agreements_write" ON customer_agreements FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "agreements_delete" ON customer_agreements FOR DELETE
  USING (get_user_role() IN ('admin', 'supervisor'));
```

---

## جداول `suppliers`, `contractors`, `stations`, `products`, `supplies`

```sql
-- نفس نمط customers — read: all, write: admin+supervisor, delete: admin
-- (يُطبَّق على كل جدول)
```

---

## جدول `raw_batches`

```sql
ALTER TABLE raw_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "raw_batches_read" ON raw_batches FOR SELECT
  USING (auth.role() = 'authenticated');

-- إنشاء: admin, supervisor, storekeeper
CREATE POLICY "raw_batches_insert" ON raw_batches FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'supervisor', 'storekeeper'));

-- تعديل: ممنوع يدوياً — يتم عبر functions فقط
CREATE POLICY "raw_batches_update" ON raw_batches FOR UPDATE
  USING (FALSE);  -- ← SECURITY DEFINER functions تتجاوز RLS

-- حذف: admin فقط
CREATE POLICY "raw_batches_delete" ON raw_batches FOR DELETE
  USING (get_user_role() = 'admin');
```

---

## جدول `processing_operations`

```sql
ALTER TABLE processing_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_read" ON processing_operations FOR SELECT
  USING (auth.role() = 'authenticated');

-- إنشاء: admin, supervisor, operator, storekeeper
CREATE POLICY "ops_insert" ON processing_operations FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'supervisor', 'operator', 'storekeeper'));

-- تعديل: ممنوع على المقفلة
CREATE POLICY "ops_update_unlocked" ON processing_operations FOR UPDATE
  USING (locked = FALSE AND get_user_role() IN ('admin', 'supervisor'));

-- حذف: admin فقط، وفقط لغير المقفلة
CREATE POLICY "ops_delete" ON processing_operations FOR DELETE
  USING (locked = FALSE AND get_user_role() = 'admin');
```

---

## جدول `finished_goods_batches`

```sql
ALTER TABLE finished_goods_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fg_read" ON finished_goods_batches FOR SELECT
  USING (auth.role() = 'authenticated');

-- الإنشاء يتم عبر SECURITY DEFINER functions فقط
CREATE POLICY "fg_insert_fn_only" ON finished_goods_batches FOR INSERT
  WITH CHECK (FALSE);

-- تحديث الرصيد عبر functions فقط
CREATE POLICY "fg_update_fn_only" ON finished_goods_batches FOR UPDATE
  USING (FALSE);
```

---

## جدول `client_orders`

```sql
ALTER TABLE client_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_read" ON client_orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "orders_insert" ON client_orders FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'supervisor'));

-- تعديل فقط لغير المكتملة
CREATE POLICY "orders_update" ON client_orders FOR UPDATE
  USING (status != 'مكتملة بالكامل' AND get_user_role() IN ('admin', 'supervisor'));

CREATE POLICY "orders_delete" ON client_orders FOR DELETE
  USING (status = 'جديدة' AND get_user_role() = 'admin');
```

---

## جدول `shipments`

```sql
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipments_read" ON shipments FOR SELECT
  USING (auth.role() = 'authenticated');

-- إنشاء: admin, supervisor, storekeeper
CREATE POLICY "shipments_insert" ON shipments FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'supervisor', 'storekeeper'));

-- لا تعديل بعد الشحن الفعلي
CREATE POLICY "shipments_update_pending" ON shipments FOR UPDATE
  USING (
    status NOT IN ('تم الشحن والإبحار') AND
    get_user_role() IN ('admin', 'supervisor')
  );

-- لا حذف لشحنات مشحونة
CREATE POLICY "shipments_delete" ON shipments FOR DELETE
  USING (status = 'مسودة' AND get_user_role() = 'admin');
```

---

## جدول `financial_transactions` (⚠️ حساس جداً)

```sql
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- قراءة: admin + supervisor
CREATE POLICY "txn_read" ON financial_transactions FOR SELECT
  USING (get_user_role() IN ('admin', 'supervisor'));

-- إنشاء: admin + supervisor فقط (وعبر functions التلقائية)
CREATE POLICY "txn_insert" ON financial_transactions FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'supervisor'));

-- ❌ لا تعديل ولا حذف أبداً على القيود المالية
-- للتصحيح: يُنشأ قيد عكسي (reversal entry)
CREATE POLICY "txn_no_update" ON financial_transactions FOR UPDATE
  USING (FALSE);

CREATE POLICY "txn_no_delete" ON financial_transactions FOR DELETE
  USING (FALSE);
```

---

## جدول `audit_log` (⚠️ للقراءة فقط للبشر)

```sql
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- قراءة: admin + supervisor
CREATE POLICY "audit_read" ON audit_log FOR SELECT
  USING (get_user_role() IN ('admin', 'supervisor'));

-- الكتابة: SECURITY DEFINER functions فقط
CREATE POLICY "audit_insert_fn" ON audit_log FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY "audit_no_modify" ON audit_log FOR UPDATE USING (FALSE);
CREATE POLICY "audit_no_delete" ON audit_log FOR DELETE USING (FALSE);
```

---

## ملاحظة على SECURITY DEFINER Functions

الدوال التي تُنفَّذ كـ PostgreSQL functions (مثل `create_shipment_atomic`) تستخدم `SECURITY DEFINER` لتتجاوز RLS داخلياً، مما يسمح لها بتعديل جداول مثل `finished_goods_batches` التي RLS الخاصة بها تمنع التحديث المباشر.

هذا يضمن أن العمليات المعقدة تتم **أتومياً** وبشكل آمن عبر منطق محدد.
