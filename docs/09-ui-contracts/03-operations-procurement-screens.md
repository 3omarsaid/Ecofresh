# عقود واجهات الشراء والتوريد وطلبيات العملاء (Procurement & Orders UI Contracts)

> **الملفات المرجعية بالبروتوتايب:**
> - وارد المواد الخام: [`raw-purchases.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-purchases.html), [`raw-arrival-add.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-arrival-add.html), [`raw-purchase-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-purchase-details.html)
> - وارد المستلزمات والتغليف: [`packaging-purchases.html`](file:///e:/web/exporting_erp/base_prototype/pages/packaging-purchases.html), [`supplies-arrival-add.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplies-arrival-add.html)
> - صفقات البضاعة الجاهزة: [`finished-purchases.html`](file:///e:/web/exporting_erp/base_prototype/pages/finished-purchases.html)
> - طلبيات العملاء: [`client-orders.html`](file:///e:/web/exporting_erp/base_prototype/pages/client-orders.html)
> - منطق الدوال: [`base_prototype/js/state.js`](file:///e:/web/exporting_erp/base_prototype/js/state.js#L644-L775)
> 
> **المسارات المستهدفة في Next.js:**
> - `app/(dashboard)/raw-purchases/...`
> - `app/(dashboard)/packaging-purchases/...`
> - `app/(dashboard)/finished-purchases/...`
> - `app/(dashboard)/client-orders/...`

---

## 1. شاشة تسجيل استلام خام زراعي (Raw Material Arrival Form)

### أ. المسار في Next.js: `app/(dashboard)/raw-purchases/new/page.tsx`
**المرجع بالبروتوتايب:** [`base_prototype/pages/raw-arrival-add.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-arrival-add.html)

### ب. جدول مواصفات الحقول والتحقق التلقائي (Form Fields Contract)

| الحقل | التسمية العربية | النوع | الإلزامية | معادلة الاحتساب التلقائي / التحقق | سلوك الواجهة والتأثير |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `stationId` | محطة الاستلام * | Select | نعم | قائمة المحطات من `stations` | افتراضي: "محطة النخيل" |
| `rawProduct` | المحصول الخام * | Select | نعم | `['فراولة', 'مانجو', 'بامية']` | افتراضي: "فراولة" |
| `supplierId` | المورد الزراعي * | Select | نعم | فقط الموردون من نوع `مورد خام زراعي` | يظهر اسم المزرعة والمحافظة |
| `grossQtyKg` | الوزن القائم (كجم) * | Number | نعم | `z.number().positive("الوزن القائم أكبر من 0")` | وزن السيارة بحمولتها على الميزان |
| `tareQtyKg` | الوزن الفارغ (كجم) * | Number | نعم | `z.number().min(0)` | وزن السيارة فارغة |
| `netQtyKg` | صافي وزن الخام (كجم) | Readonly | تلقائي | **`netQty = grossQtyKg - tareQtyKg`** | محمي من التعديل اليدوي، يتحدث فوراً |
| `unitPriceEgp` | سعر شراء الكيلو (ج.م) * | Number | نعم | `z.number().positive()` | السعر المتفق عليه مع المزارع |
| `transportCost` | نولون ونقل الخام (ج.م) | Number | اختياري | `z.number().min(0).default(0)` | إذا كانت وسيلة النقل على حساب الشركة |
| `unitCost` | تكلفة الكيلو الموزونة | Readonly | تلقائي | **`unitCost = ((netQty * unitPrice) + transport) / netQty`** | يُحفظ في اللوط ليورث للإنتاج |
| `totalPayable` | إجمالي مستحق الفاتورة | Readonly | تلقائي | **`totalPayable = (netQty * unitPrice) + transport`** | قيمة القيد المالي AP |
| `brixDegree` | فحص السكر (Brix °) | Number | اختياري | نطاق `5.0 - 20.0` | مقياس جودة القبول الأولي |
| `truckPlate` | رقم لوحة السيارة | Text | نعم | كود اللوحة المصرية | للتتبع مع السائق والمورد |
| `receivedDate` | تاريخ الاستلام * | Date | نعم | تاريخ اليوم الافتراضي | تاريخ قيد اللوط والدفتر |

### ج. دورة الإرسال والـ Server Action:
- استدعاء Server Action: `addRawMaterialArrival(formData)` في `actions/raw-batches.ts`.
- رسالة النجاح (Toast): `"تم بنجاح قيد اللوط LOT-RAW-20260901-01 برصيد 5,000 كجم وإنشاء استحقاق المورد!"`.

---

## 2. شاشة وارد المستلزمات والكراتين (Packaging Purchases Form)

**المسار في Next.js:** `app/(dashboard)/packaging-purchases/new/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/supplies-arrival-add.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplies-arrival-add.html)

- **الخيارات المتاحة لاختيار المستلزم:**
  - اختيار مستلزم حالي: يقوم بجلب رصيده وسعره الحالي تلقائياً.
  - تعريف مستلزم جديد: يفتح حقول اسم المستلزم، الفئة (كرتونة، أكياس، بالتات)، السعة بالكجم.
- **الحسابات التلقائية:**
  - $\text{Total Amount (EGP)} = \text{qty} \times \text{unitPrice}$
- **الآثار الفورية في الداتا بيز:**
  - زيادة رصيد المستلزم: `supplies.stock += qty`.
  - توليد قيد مالي دائن لمورد المستلزمات في `financial_transactions`.

---

## 3. شاشة صفقات البضاعة الجاهزة (Direct Purchase Deals)

**المسار في Next.js:** `app/(dashboard)/finished-purchases/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/finished-purchases.html`](file:///e:/web/exporting_erp/base_prototype/pages/finished-purchases.html)

- **الفرق الجوهري عن شراء الخام:**
  - هذه البضاعة **لا تدخل مرحلة تدوير أو فرز**، بل تذهب مباشرة لمخزن الجاهز (`finished_goods_batches`) ببادئة `FG-DIR-`.
- **حقول النموذج:**
  - المورد (مصنع أو شركة أخرى مثل "شركة النيل للصناعات الغذائية").
  - الصنف والكمية بالكيلوجرام وعدد الكراتين ونوع التعبئة.
  - سعر شراء الكيلو + مصاريف النقل.
  - تاريخ الإنتاج وتاريخ انتهاء الصلاحية المطبوع على الكراتين.
  - رقم الفاتورة والشهادات الصحية المرفقة.
- **النتيجة المحاسبية:** باتش جاهز للشحن فوراً + قيد AP للمورد.

---

## 4. شاشة طلبيات العملاء التصديرية (Client Orders)

**المسار في Next.js:** `app/(dashboard)/client-orders/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/client-orders.html`](file:///e:/web/exporting_erp/base_prototype/pages/client-orders.html)

### أ. سير عمل تسجيل طلبية العميل:
1. يختار المستخدم اسم العميل من قائمة `customers`.
2. **الاستدعاء التلقائي (Auto-fill):**
   - يجلب النظام فوراً اتفاقيات الأسعار الخاصة بهذا العميل (`customer_agreements`).
   - يُعبئ سعر البيع بالعملة الأجنبية ومواصفة التعبئة الافتراضية.
   - يُجلب ميناء الوصول الافتراضي (مثال: "ميناء روتردام").
   - يُجلب سعر الصرف التعاقدي الافتراضي (مثال: `53.20 EGP/EUR`).
3. يقوم المستخدم بإدخال الكمية المطلوبة بالكيلوجرام (مثلاً: `10,000 كجم`).
4. يتم تعيين:
   - `orderedQtyKg = 10000`
   - `unfulfilledQtyKg = 10000` (الكمية المتبقية للتخصيص)
   - `status = "جديدة"`

### ب. جدول متابعة وتتبع حالة الطلبيات (Client Orders Table):

| رقم الطلبية | تاريخ الطلب | العميل | المنتج | الكمية المطلوبة | الكمية المشحونة | المتبقي للشحن | السعر | الحالة والـ Badge |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ORD-2026-001` | 2026-08-10 | شركة سما (هولندا) | فراولة مجمدة IQF | 10,000 كجم | 4,000 كجم | 6,000 كجم | 1.85 EUR | `مشحونة جزئياً` (bg-blue-100) |
| `ORD-2026-002` | 2026-08-12 | شركة النور (السعودية) | مانجو مكعبات | 5,000 كجم | 0 كجم | 5,000 كجم | 2.10 USD | `جديدة` (bg-emerald-100) |
| `ORD-2026-003` | 2026-08-14 | يوروفودز (ألمانيا) | بامية ممتازة | 8,000 كجم | 8,000 كجم | 0 كجم | 1.95 EUR | `مكتملة بالكامل` (bg-gray-100) |
