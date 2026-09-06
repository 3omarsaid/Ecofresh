# عقود واجهات الماليات والخزينة وكشوف الحسابات (Financials UI Contracts)

> **الملفات المرجعية بالبروتوتايب:**
> - كشف الحسابات العام: [`base_prototype/pages/financial-statements.html`](file:///e:/web/exporting_erp/base_prototype/pages/financial-statements.html) (959 سطراً)
> - إضافة حركة مالية وسند قبض/صرف: [`base_prototype/pages/add-transaction.html`](file:///e:/web/exporting_erp/base_prototype/pages/add-transaction.html) (242 سطراً)
> - كشف حساب طرف تعامل تفصيلي: [`base_prototype/pages/party-statement-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/party-statement-details.html)
> - حركة المدفوعات والتحصيلات: [`base_prototype/pages/payments-collections.html`](file:///e:/web/exporting_erp/base_prototype/pages/payments-collections.html)
> - الخزينة والبنوك: [`base_prototype/pages/treasury-banks.html`](file:///e:/web/exporting_erp/base_prototype/pages/treasury-banks.html) و [`treasury-account-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/treasury-account-details.html)
> - منطق احتساب الأرصدة: [`base_prototype/js/state.js` Lines 1090-1220](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1090-L1220)
> 
> **المسارات المستهدفة في Next.js:**
> - `app/(dashboard)/financials/page.tsx` (Statements & Ledger)
> - `app/(dashboard)/financials/transactions/new/page.tsx` (Add Voucher Form)
> - `app/(dashboard)/financials/parties/[id]/page.tsx` (Party Detailed Statement)
> - `app/(dashboard)/financials/treasury/page.tsx` (Banks & Treasury Hub)

---

## 1. شاشة كشوف الحسابات العامة (Financial Statements & Ledger)

**المسار في Next.js:** `app/(dashboard)/financials/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/financial-statements.html` Lines 50-200](file:///e:/web/exporting_erp/base_prototype/pages/financial-statements.html#L50-L200)

### أ. بطاقات المؤشرات الأربعة في أعلى الشاشة (Financial KPI Cards):
1. **مستحقات العملاء (Total Receivables - AR):**
   - المعادلة: $\sum \text{Customer Outstanding Balances}$.
   - القيمة بالبروتوتايب: `193,680.00 ج.م`.
2. **مستحقات الموردين والمقاولين (Total Payables - AP):**
   - المعادلة: $\sum \text{Supplier Balances} + \sum \text{Contractor Balances}$.
   - القيمة بالبروتوتايب: `415,100.00 ج.م`.
3. **إجمالي التحصيلات النقدية المقبوضة (Total Collections Inflow):**
   - القيمة بالبروتوتايب: `200,000.00 ج.م`.
4. **إجمالي المدفوعات المسددة (Total Payments Outflow):**
   - القيمة بالبروتوتايب: `100,000.00 ج.م`.

---

### ب. تبويبات تصفية دفتر الأستاذ (Ledger Tabs Contract):
- `كل الحركات` (All Transactions): يعرض كل القيود مرتبة تنازلياً حسب التاريخ.
- `استحقاقات العملاء (AR)`: يعرض فقط فواتير التصدير وسندات التحصيل.
- `مستحقات الموردين (AP)`: يعرض فواتير الخام والمستلزمات وسندات الصرف.
- `حسابات المقاولين`: يعرض أتعاب الفرز والتشغيل وسندات سداد المقاولين.

---

### ج. أعمدة جدول دفتر الأستاذ (Financial Ledger Table):

| العمود | الحقل البرمجي | التنسيق المرئي | المرجع بالبروتوتايب |
| :--- | :--- | :--- | :--- |
| كود الحركة | `txnId` | Monospace (`TXN-2026-001`) | [`state.js` Line 468](file:///e:/web/exporting_erp/base_prototype/js/state.js#L468) |
| التاريخ | `date` | YYYY-MM-DD | [`state.js` Line 469](file:///e:/web/exporting_erp/base_prototype/js/state.js#L469) |
| طبيعة القيد | `type` | شارة ملونة (استحقاق خام / استحقاق مبيعات / سند تحصيل) | [`state.js` Line 470](file:///e:/web/exporting_erp/base_prototype/js/state.js#L470) |
| طرف التعامل | `partyName`, `partyType` | اسم الشركة أو الشخص + نوعه (عميل / مورد / مقاول) | [`state.js` Line 471](file:///e:/web/exporting_erp/base_prototype/js/state.js#L471) |
| المبلغ بالجنيه (EGP) | `amountEgp` | رقم منسق (`148,000.00 ج.م`) | [`state.js` Line 473](file:///e:/web/exporting_erp/base_prototype/js/state.js#L473) |
| المبلغ بالعملة الأجنبية | `amountCurrency`, `currency` | يظهر فقط للمعاملات الدولية (`7,400.00 EUR`) | [`state.js` Line 474](file:///e:/web/exporting_erp/base_prototype/js/state.js#L474) |
| المستند المرجعي | `refDoc` | رابط للمستند (`LOT-RAW-001` / `SHP-2026-001`) | [`state.js` Line 477](file:///e:/web/exporting_erp/base_prototype/js/state.js#L477) |
| الحساب البنكي / الخزينة | `accountName` | بنك CIB / بنك QNB / الخزينة الرئيسية | [`state.js` Line 479](file:///e:/web/exporting_erp/base_prototype/js/state.js#L479) |
| الحالة | `status` | شارة خضراء `معتمد` أو `مسدد` | [`state.js` Line 481](file:///e:/web/exporting_erp/base_prototype/js/state.js#L481) |

---

## 2. نموذج إضافة حركة مالية وسند صرف/قبض (Add Transaction Form Contract)

**المسار في Next.js:** `app/(dashboard)/financials/transactions/new/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/add-transaction.html` Lines 50-200](file:///e:/web/exporting_erp/base_prototype/pages/add-transaction.html#L50-L200)

### مواصفات الحقول ومعادلة المعاينة اللحظية (Live Balance Preview):

| اسم الحقل | المعرف البرمجي | الخيارات / النوع | سلوك الواجهة والـ Reactive Preview |
| :--- | :--- | :--- | :--- |
| نوع العملية * | `tx-type` | `سداد (Payment) — خروج نقدية`<br/>`تحصيل (Collection) — دخول نقدية` | يغير اتجاه المعادلة ولون المعاينة |
| نوع الطرف * | `party-type` | `مورد (Supplier)` / `عميل (Customer)` / `مقاول (Contractor)` / `محطة (Station)` | يقوم بتصفية قائمة الأسماء بالحقل التالي |
| اسم الطرف * | `party-name` | اختيار من قائمة الأطراف | يجلب فوراً الرصيد الحالي لهذا الطرف |
| الرصيد المستحق الحالي | `current-balance` | Readonly Input | يُعرض بخط عريض (مثال: `300,000.00 ج.م`) |
| مبلغ السند * | `tx-amount` | Number Input | يدخل المستخدم المبلغ المراد تحصيله أو سداده |
| **صندوق المعاينة الفورية** | `live-preview` | UI Preview Card | **المعادلة الرياضية اللحظية:**<br/>- في التحصيل: $\text{New Balance} = \text{Current} - \text{Amount}$<br/>- في السداد: $\text{New Balance} = \text{Current} - \text{Amount}$ |
| الحساب المالي / البنك * | `account-id` | `بنك CIB (EUR)` / `بنك QNB (EGP)` / `الخزينة الرئيسية` | يحدد الحساب المتأثر بالزيادة أو النقصان |
| طريقة الدفع * | `payment-method` | `تحويل بنكي (Bank Transfer)` / `شيك (Cheque)` / `نقدي (Cash)` | تفاصيل الأداة المصرفية |
| التاريخ والمستند المرجعي | `date`, `refDoc` | Date & Text | رقم التحويل أو الشيك وتاريخ الاستحقاق |

---

## 3. شاشة الخزينة والبنوك (Treasury & Banking Screen)

**المسار في Next.js:** `app/(dashboard)/financials/treasury/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/treasury-banks.html`](file:///e:/web/exporting_erp/base_prototype/pages/treasury-banks.html) و [`treasury-account-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/treasury-account-details.html)

- **الحسابات الثلاثة الأساسية:**
  1. `حساب بنك CIB - حساب التصدير باليورو`:
     - الرصيد: `45,000.00 EUR`
     - الاستخدام: استلام تحصيلات عملاء التصدير الأوروبيين.
  2. `حساب بنك QNB - الحساب الجاري بالجنيه المصري`:
     - الرصيد: `1,450,000.00 ج.م`
     - الاستخدام: تحويلات سداد موردي الخام والمستلزمات والمصروفات.
  3. `خزينة المحطة المركزية (Cash Safe)`:
     - الرصيد: `125,000.00 ج.م`
     - الاستخدام: صرف النثريات اليومية وأجور العمالة المؤقتة وسائقي النقل.
- **تنبيه الرصيد السالب:**
  - في النظام الجديد: إذا كان المبلغ المطلوب سداده أكبر من رصيد الحساب المالي، يظهر تنبيه تحذيري يطلب تأكيد السحب على المكشوف أو تحويل رصيد بين الحسابات.
