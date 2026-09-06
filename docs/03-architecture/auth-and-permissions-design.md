# Auth & Permissions Design — Supabase Auth + RLS

## الأدوار المستخرجة من البروتوتايب

| الدور | الوصف | الصلاحيات |
|------|-------|---------|
| `admin` | مدير النظام | كل شيء |
| `supervisor` | مشرف المحطة | كل شيء إلا حذف العمليات |
| `operator` | مشغل الإنتاج | إنشاء عمليات فقط |
| `storekeeper` | أمين المخزن | إنشاء عمليات + إرسال شحنات |
| `viewer` | مراقب/مدقق | قراءة فقط |

---

## هيكل Supabase Auth

### جدول `user_profiles` (يمتد auth.users)

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'operator', 'storekeeper', 'viewer')),
  title TEXT,
  station_id TEXT REFERENCES stations(id),  -- للربط بمحطة معينة (مستقبلاً)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### الربط بالـ JWT

```sql
-- Supabase تحفظ الـ role في JWT تلقائياً عبر:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'viewer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## قراءة الـ Role في Next.js

```ts
// lib/auth.ts
import { createServerClient } from '@/lib/supabase/server';

export async function getCurrentUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { ...user, role: profile?.role, title: profile?.title };
}

export function can(role: string, action: string): boolean {
  const permissions: Record<string, string[]> = {
    admin: ['*'],
    supervisor: ['CREATE_OPERATION', 'DISPATCH_SHIPMENT', 'MANAGE_FINANCIALS'],
    operator: ['CREATE_OPERATION'],
    storekeeper: ['CREATE_OPERATION', 'DISPATCH_SHIPMENT'],
    viewer: [],
  };
  const allowed = permissions[role] || [];
  return allowed.includes('*') || allowed.includes(action);
}
```

---

## RLS Policies الأساسية

### مبدأ عام:
- **SELECT:** كل المستخدمين المسجَّلين يقرؤون (viewer-safe)
- **INSERT:** حسب الدور والعملية
- **UPDATE:** محدود — Admin + Supervisor فقط
- **DELETE:** Admin فقط

### 1. جدول `customers`

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- قراءة: كل المسجَّلين
CREATE POLICY "customers_select" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- إضافة: admin + supervisor فقط
CREATE POLICY "customers_insert" ON customers
  FOR INSERT WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'supervisor')
  );

-- تعديل: admin + supervisor
CREATE POLICY "customers_update" ON customers
  FOR UPDATE USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'supervisor')
  );

-- حذف: admin فقط
CREATE POLICY "customers_delete" ON customers
  FOR DELETE USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
```

---

### 2. جدول `processing_operations`

```sql
ALTER TABLE processing_operations ENABLE ROW LEVEL SECURITY;

-- قراءة: الكل
CREATE POLICY "operations_select" ON processing_operations
  FOR SELECT USING (auth.role() = 'authenticated');

-- إنشاء: admin, supervisor, operator, storekeeper
CREATE POLICY "operations_insert" ON processing_operations
  FOR INSERT WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'supervisor', 'operator', 'storekeeper')
  );

-- لا UPDATE على العمليات المقفلة
CREATE POLICY "operations_update" ON processing_operations
  FOR UPDATE USING (
    locked = FALSE AND
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'supervisor')
  );

-- حذف: admin فقط
CREATE POLICY "operations_delete" ON processing_operations
  FOR DELETE USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
```

---

### 3. جدول `shipments`

```sql
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipments_select" ON shipments
  FOR SELECT USING (auth.role() = 'authenticated');

-- إنشاء: admin, supervisor, storekeeper
CREATE POLICY "shipments_insert" ON shipments
  FOR INSERT WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'supervisor', 'storekeeper')
  );

-- لا update بعد الشحن
CREATE POLICY "shipments_update" ON shipments
  FOR UPDATE USING (
    status NOT IN ('تم الشحن والإبحار') AND
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'supervisor')
  );
```

---

### 4. جدول `financial_transactions`

```sql
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- قراءة: الكل
CREATE POLICY "txn_select" ON financial_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

-- إنشاء يدوي: admin + supervisor فقط
CREATE POLICY "txn_insert" ON financial_transactions
  FOR INSERT WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'supervisor')
  );

-- لا حذف ولا تعديل على القيود المالية (سجل ثابت)
-- للتصحيح: يُنشأ قيد عكسي جديد
```

---

### 5. جدول `audit_log`

```sql
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- قراءة: admin + supervisor
CREATE POLICY "audit_select" ON audit_log
  FOR SELECT USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid())
    IN ('admin', 'supervisor')
  );

-- إنشاء: SECURITY DEFINER functions فقط (لا يكتب فيه المستخدم مباشرة)
CREATE POLICY "audit_insert" ON audit_log
  FOR INSERT WITH CHECK (FALSE); -- مُغلق للمستخدمين العاديين
```

---

## Middleware للحماية في Next.js

```ts
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // مسارات تحتاج تسجيل دخول
  const protectedRoutes = ['/dashboard', '/customers', '/shipments', ...];

  if (!session && protectedRoutes.some(p => req.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}
```

---

## جدول صلاحيات Server Actions

| Server Action | الأدوار المسموح لها |
|--------------|------------------|
| `createRawBatch()` | admin, supervisor, storekeeper |
| `createProcessingOperation()` | admin, supervisor, operator, storekeeper |
| `lockOperation()` | admin, supervisor |
| `deleteOperation()` | admin فقط |
| `createShipment()` | admin, supervisor, storekeeper |
| `addFinancialTransaction()` | admin, supervisor |
| `addCustomer/Supplier()` | admin, supervisor |
| `createStockTransfer()` | admin, supervisor, storekeeper |
