# عقود واجهات لوحات القيادة (Dashboard UI Contracts)

> **الملفات المرجعية بالبروتوتايب:**
> - لوحة القيادة التنفيذية الرئيسية: [`base_prototype/index.html`](file:///e:/web/exporting_erp/base_prototype/index.html) و [`base_prototype/pages/dashboard-executive.html`](file:///e:/web/exporting_erp/base_prototype/pages/dashboard-executive.html)
> - لوحة قيادة المخزون والمحطات: [`base_prototype/pages/dashboard-inventory.html`](file:///e:/web/exporting_erp/base_prototype/pages/dashboard-inventory.html)
> - محرك التنقل والهيدر: [`base_prototype/js/navigation.js`](file:///e:/web/exporting_erp/base_prototype/js/navigation.js)
> - مصدر بيانات المؤشرات: [`base_prototype/js/state.js` Lines 1194-1220](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1194-L1220)
> 
> **المسارات المستهدفة في Next.js:**
> - `app/(dashboard)/dashboard/page.tsx` (Executive Dashboard)
> - `app/(dashboard)/dashboard/inventory/page.tsx` (Inventory Dashboard)

---

## 1. لوحة القيادة التنفيذية (Executive Overview Dashboard)

### أ. الهدف البيزنسي للشاشة
توفير رؤية بانورامية لحظية للمدير العام والمدير المالي لسلامة التدفقات النقدية، وتقدم شحن طلبيات التصدير، وحالة الإنتاج بالمحطات دون الحاجة للدخول في التفاصيل الدفترية.

---

### ب. هيكل المكونات والـ Layout (Component Hierarchy)

```
DashboardPage (Server Component: app/(dashboard)/dashboard/page.tsx)
├── DashboardHeader (Breadcrumb + Quick Date Range Filter + Refresh Button)
├── KPICardsGrid (4 Top Metric Cards)
│   ├── TotalRevenueCard (Gross Export Revenues EGP)
│   ├── NetProfitMarginCard (Net Profit EGP & Average Margin %)
│   ├── OutstandingReceivablesCard (Customer AR Balance)
│   └── OutstandingPayablesCard (Supplier & Contractor AP Balance)
├── MainContentSplit (Grid 12 cols: 8 cols charts/tables + 4 cols side widgets)
│   ├── LeftColumn (8 cols)
│   │   ├── ActiveShipmentsTrackingTable (الحاويات قيد الإبحار والتجهيز)
│   │   └── ProcessingYieldTrendWidget (معدلات تصافي الإنتاج للمحطات)
│   └── RightColumn (4 cols)
│       ├── QuickActionsCard (أزرار الاختصار: +شحنة، +وارد خام، +سند قبض)
│       ├── TreasuryBalancesMiniWidget (أرصدة البنوك CIB, QNB, والخزينة)
│       └── SystemRecentAuditFeed (آخر 5 حركات معتمدة بالنظام)
```

---

### ج. جدول مواصفات بطاقات المؤشرات الرئيسية (KPI Cards Contract)

| الحقل / المؤشر | التسمية بالواجهة (AR/EN) | مصدر البيانات من Supabase | المعادلة الرياضية | لون البطاقة / Badge | سلوك النقر (On Click) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `kpi_revenue` | إجمالي إيرادات التصدير<br/>Gross Export Revenue | `SUM(shipments.gross_revenue_egp)` | $\sum (\text{shippedQtyKg} \times \text{unitPriceEur} \times \text{fxRate})$ | Primary Emerald (#012d1d) | انتقال إلى `/shipments` |
| `kpi_profit` | صافي الربح ومتوسط الهامش<br/>Net Profit & Margin | `v_financial_statements_totals.gross_profit` | $\sum \text{Revenue} - \sum \text{COGS}$ | Blue Secondary (#0054cd) | انتقال إلى `/reports/profitability` |
| `kpi_receivables` | مستحقات الشركة طرف العملاء<br/>Total Receivables (AR) | `v_customer_balances.total_outstanding` | $\sum \text{Invoiced AR} - \sum \text{Collections}$ | Amber Warning (bg-amber-100) | انتقال إلى `/financials?tab=customers` |
| `kpi_payables` | مستحقات الموردين والمقاولين<br/>Total Payables (AP) | `v_supplier_balances.total_outstanding` | $\sum \text{Payables AP} - \sum \text{Payments}$ | Rose Danger (bg-rose-100) | انتقال إلى `/financials?tab=suppliers` |

---

### د. جدول الشحنات النشطة باللوحة (Active Shipments Table Contract)

| العمود | اسم الحقل البرمجي | النوع | التنسيق المرئي | المرجع بالبروتوتايب |
| :--- | :--- | :--- | :--- | :--- |
| كود الشحنة | `shipmentId` | String | Link text-primary font-bold (`SHP-2026-001`) | [`base_prototype/pages/shipments.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipments.html) |
| العميل والدولة | `customerName`, `country` | String + Flag | اسم الشركة + شارة الدولة (هولندا 🇳🇱) | [`state.js` Line 420](file:///e:/web/exporting_erp/base_prototype/js/state.js#L420) |
| الحاوية | `containerNo` | String | Monospace font (`MSCU-987654-3`) | [`state.js` Line 1044](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1044) |
| الكمية | `shippedQtyKg` | Number | `4,000 كجم` | [`state.js` Line 1048](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1048) |
| ميناء الوصول | `destinationPort` | String | `ميناء روتردام` | [`state.js` Line 1058](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1058) |
| الحالة | `status` | Enum Chip | `bg-emerald-100 text-emerald-900 border-emerald-300` | شارة خضراء: "تم الشحن والإبحار" |

---

## 2. لوحة قيادة المخزون والمحطات (Inventory Dashboard)

**المسار في Next.js:** `app/(dashboard)/dashboard/inventory/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/dashboard-inventory.html`](file:///e:/web/exporting_erp/base_prototype/pages/dashboard-inventory.html)

### مواصفات شاشات العرض والمكونات:
1. **بطاقة سعة التخزين بالمحطات (Station Cold Stores Utilization):**
   - محطة النخيل (البحيرة): السعة 150,000 كجم، المشغول 92,000 كجم (61% نسبة الإشغال).
   - محطة السلام (الإسماعيلية): السعة 120,000 كجم، المشغول 45,000 كجم (37% نسبة الإشغال).
   - محطة المدينة (السادات): السعة 200,000 كجم، المشغول 110,000 كجم (55% نسبة الإشغال).
2. **شريط حالة اللوطات وجودتها:**
   - لوطات معتمدة صالحة للتشغيل (`qcStatus: APPROVED`): لون أخضر.
   - لوطات تحت الفحص (`qcStatus: PENDING`): لون أصفر.
   - لوطات مرفوضة (`qcStatus: REJECTED`): لون أحمر مع زر فتح تقرير الرفض.
3. **مراقبة مخزون المستلزمات الحرج (Low Packaging Stock Alerts):**
   - تنبيه فوري يظهر عندما يقل رصيد أي صنف كرتون عن 500 كرتونة.
   - الزر المرافق: `+ أمر شراء مستلزمات` يوجه فوراً لـ `/packaging-purchases/new`.
