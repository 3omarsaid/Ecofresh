# عقود واجهات البيانات الأساسية (Master Data UI Contracts)

> **الملفات المرجعية بالبروتوتايب:**
> - العملاء: [`customers.html`](file:///e:/web/exporting_erp/base_prototype/pages/customers.html), [`customer-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-details.html), [`customer-agreements.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-agreements.html)
> - الموردون: [`suppliers.html`](file:///e:/web/exporting_erp/base_prototype/pages/suppliers.html), [`supplier-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplier-details.html)
> - المنتجات: [`products.html`](file:///e:/web/exporting_erp/base_prototype/pages/products.html), [`product-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/product-details.html)
> - المستلزمات والكراتين: [`supplies.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplies.html), [`cartons.html`](file:///e:/web/exporting_erp/base_prototype/pages/cartons.html)
> - المحطات والمقاولون: [`stations.html`](file:///e:/web/exporting_erp/base_prototype/pages/stations.html), [`contractors.html`](file:///e:/web/exporting_erp/base_prototype/pages/contractors.html)
> - الموظفون: [`employees.html`](file:///e:/web/exporting_erp/base_prototype/pages/employees.html)
> 
> **المسارات المستهدفة في Next.js:**
> - `app/(dashboard)/customers/...`
> - `app/(dashboard)/suppliers/...`
> - `app/(dashboard)/products/...`
> - `app/(dashboard)/supplies/...`
> - `app/(dashboard)/stations/...`
> - `app/(dashboard)/contractors/...`
> - `app/(dashboard)/employees/...`

---

## 1. شاشات موديول العملاء (Customers UI Contract)

### أ. صفحة دليل وقائمة العملاء (`app/(dashboard)/customers/page.tsx`)
**المرجع بالبروتوتايب:** [`base_prototype/pages/customers.html`](file:///e:/web/exporting_erp/base_prototype/pages/customers.html)

- **عناصر الهيدر:**
  - العنوان: "دليل عملاء التصدير والشركاء الدوليين (International Export Customers)"
  - زر الإجراء الرئيسي: `+ إضافة عميل جديد` (يفتح Drawer أو ينقل لـ `/customers/new`).
- **حقول فلترة الجدول:**
  - بحث نصي: بالاسم، الكود، أو جهة الاتصال.
  - فلتر الدولة: هولندا، السعودية، ألمانيا، فرنسا.
  - فلتر الحالة: نشط / موقوف.
- **أعمدة جدول العملاء:**
  1. `كود العميل`: مثل `CUST-SAMA-NL` (رابط لصفحة التفاصيل).
  2. `اسم الشركة`: مثل "شركة سما للتجارة والتصدير".
  3. `الدولة وميناء الوصول`: مثل "هولندا - ميناء روتردام".
  4. `عملة التعامل`: شارة `EUR` أو `USD`.
  5. `شروط الدفع`: "30 يوم بعد بوليصة الشحن".
  6. `الرصيد المستحق (AR)`: قيمة ديناميكية من `v_customer_balances` (مثال: `193,680.00 ج.م`).
  7. `الحالة`: شارة خضراء `نشط`.
  8. `الإجراءات`: زر تعديل، زر كشف الحساب، زر اتفاقيات الأسعار.

---

### ب. نموذج إنشاء / تعديل عميل (`components/modules/customers/customer-form.tsx`)

| معرف الحقل | اسم الحقل بالواجهة | النوع بالـ Form | قيود التحقق (Zod Validation) | القيمة الافتراضية بالبروتوتايب |
| :--- | :--- | :--- | :--- | :--- |
| `name` | اسم شركة العميل * | Text Input | `z.string().min(3, "الاسم مطلوب")` | "" |
| `code` | كود العميل الفريد * | Text Input | `z.string().regex(/^CUST-[A-Z0-9-]+$/)` | يُولَّد تلقائياً مثل `CUST-004` |
| `country` | دولة العميل * | Select Box | `z.string().min(2)` | "هولندا" |
| `destination_port` | ميناء الوصول البحري * | Text Input | `z.string().min(3)` | "ميناء روتردام" |
| `currency` | عملة التعاقد المعتمدة * | Select Box | `z.enum(['EUR', 'USD', 'GBP'])` | 'EUR' |
| `payment_terms` | شروط وتسهيلات الدفع * | Select Box | `z.string()` | "30 يوم بعد بوليصة الشحن" |
| `credit_limit` | سقف الائتمان (ج.م) | Number Input | `z.number().min(0)` | 500,000.00 |
| `contact_person` | المسؤول التجاري | Text Input | `z.string().optional()` | "السيد / يوهان فان دير مير" |
| `phone` | هاتف الاتصال الدولي | Text Input | `z.string().regex(/^\+?[0-9\s-]+$/)` | "+31 20 555 1234" |
| `email` | البريد الإلكتروني الرسمي | Email Input | `z.string().email()` | "orders@sama-export.nl" |

---

### ج. صفحة تفاصيل العميل والاتفاقيات (`app/(dashboard)/customers/[id]/page.tsx`)
**المرجع بالبروتوتايب:** [`base_prototype/pages/customer-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-details.html) و [`customer-agreements.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-agreements.html)

**تتكون من 3 تبويبات (Tabs):**
1. **تبويب البيانات العامة:** تفاصيل الاتصال، العناوين، والسجل الضريبي.
2. **تبويب اتفاقيات الأسعار (Price Agreements):**
   - جدول يوضح الأصناف المتعاقد عليها:
     - المنتج: "فراولة مجمدة IQF"
     - السعر التعاقدي: `1.85 EUR/kg`
     - مواصفات التعبئة: "كرتونة 10 كجم (5 طبقات)"
   - زر `+ إضافة اتفاقية منتج جديد`.
3. **تبويب كشف الحساب والشحنات:**
   - جدول الشحنات المستلمة ورصيد الفواتير والتحصيلات المسجلة.

---

## 2. شاشات موديول الموردين (Suppliers UI Contract)

### أ. قائمة الموردين (`app/(dashboard)/suppliers/page.tsx`)
**المرجع بالبروتوتايب:** [`base_prototype/pages/suppliers.html`](file:///e:/web/exporting_erp/base_prototype/pages/suppliers.html)

- **التصنيفات بالألوان (Supplier Types):**
  1. `مورد خام زراعي`: شارة خضراء (مزارع الوادي، شركة الخير، مزارع التوفيق...).
  2. `مورد بضاعة جاهزة`: شارة زرقاء (شركة النيل للصناعات الغذائية، الأهرام للتبريد).
  3. `مورد مستلزمات`: شارة بنفسجية (الشركة المصرية لتصنيع الكرتون).
- **أعمدة الجدول:** كود المورد، الاسم، النوع، الصنف المورد، المحافظة/الموقع، الرصيد المستحق (AP)، الإجراءات.

---

## 3. شاشات المنتجات والمستلزمات (Products & Supplies UI Contract)

### أ. كتالوج المنتجات التصديرية (`app/(dashboard)/products/page.tsx`)
**المرجع بالبروتوتايب:** [`base_prototype/pages/products.html`](file:///e:/web/exporting_erp/base_prototype/pages/products.html)

- **بيانات المنتجات الأربعة المعتمدة بالنظام:**
  1. `فراولة مجمدة IQF`: كود `PRD-STW-IQF` | نسبة الهالك المعيارية `20%` | نسبة الإنتاجية `80%`.
  2. `فراولة شرائح مجمدة`: كود `PRD-STW-SLC` | نسبة الهالك `22%` | نسبة الإنتاجية `78%`.
  3. `مانجو مكعبات مجمدة`: كود `PRD-MNG-CBD` | نسبة الهالك `28%` | نسبة الإنتاجية `72%`.
  4. `بامية ممتازة مجمدة`: كود `PRD-OKR-EXT` | نسبة الهالك `15%` | نسبة الإنتاجية `85%`.

### ب. شاشة المستلزمات والكراتين (`app/(dashboard)/supplies/page.tsx`)
**المرجع بالبروتوتايب:** [`base_prototype/pages/supplies.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplies.html) و [`cartons.html`](file:///e:/web/exporting_erp/base_prototype/pages/cartons.html)

- **جدول المستلزمات:**
  - كرتونة تصدير 10 كجم (5 طبقات): رصيد `2,020 كرتونة` | سعر `18.00 ج.م`.
  - كيس بوليثيلين غذائي 10 كجم: رصيد `3,800 كيس` | سعر `3.50 ج.م`.
  - بالتات خشبية تبخير معتمد: رصيد `120 باليتة` | سعر `450.00 ج.م`.
  - شريط لاصق عريض: رصيد `85 بكرة` | سعر `25.00 ج.م`.
  - رول استرتش تغليف: رصيد `40 رول` | سعر `180.00 ج.م`.

---

## 4. شاشات المحطات والمقاولين (Stations & Contractors UI Contract)

### أ. شاشة المحطات (`app/(dashboard)/stations/page.tsx`)
**المرجع بالبروتوتايب:** [`base_prototype/pages/stations.html`](file:///e:/web/exporting_erp/base_prototype/pages/stations.html)

- **المحطات الثلاث الرئيسية:**
  1. `محطة النخيل`: محافظة البحيرة - مركز بدر | سعة التخزين 150,000 كجم | سعر الكهرباء والتبريد `2.50 ج.م/كجم` | المشرف: م. أحمد منصور.
  2. `محطة السلام`: محافظة الإسماعيلية - القنطرة | سعة التخزين 120,000 كجم | سعر الكيلو `2.30 ج.م/كجم` | المشرف: م. حسام الدين.
  3. `محطة المدينة`: المنوفية - مدينة السادات | سعة التخزين 200,000 كجم | سعر الكيلو `2.60 ج.م/كجم` | المشرف: م. ياسر الشامي.

### ب. شاشة مقاولي العمالة والتشغيل (`app/(dashboard)/contractors/page.tsx`)
**المرجع بالبروتوتايب:** [`base_prototype/pages/contractors.html`](file:///e:/web/exporting_erp/base_prototype/pages/contractors.html)

- **المقاولون الثلاثة:**
  1. `مقاول أحمد للتجهيز`: مرتبط بـ `محطة النخيل` | التعريفة `2.00 ج.م/كجم جاهز` | هاتف: `01011223344`.
  2. `مقاول شركة الصفا للخدمات`: مرتبط بـ `محطة السلام` | التعريفة `2.20 ج.م/كجم جاهز` | هاتف: `01122334455`.
  3. `مقاول النور لفرز وتجميد الخضار`: مرتبط بـ `محطة المدينة` | التعريفة `1.90 ج.م/كجم جاهز` | هاتف: `01233445566`.
