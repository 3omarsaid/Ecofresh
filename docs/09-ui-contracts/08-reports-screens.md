# عقود واجهات مركز التقارير والتحليلات (Reports & Analytics UI Contracts)

> **الملفات المرجعية بالبروتوتايب:**
> - مركز التقارير الرئيسي: [`base_prototype/pages/reports.html`](file:///e:/web/exporting_erp/base_prototype/pages/reports.html)
> - تقرير ربحية الشحنات: [`base_prototype/pages/shipment-profitability.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipment-profitability.html)
> - تقرير مراقبة المحطات: [`base_prototype/pages/station-monitoring.html`](file:///e:/web/exporting_erp/base_prototype/pages/station-monitoring.html)
> - تقرير أداء الموردين: [`base_prototype/pages/supplier-report.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplier-report.html)
> - تقرير أداء العملاء: [`base_prototype/pages/customer-report.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-report.html)
> 
> **المسارات المستهدفة في Next.js:**
> - `app/(dashboard)/reports/page.tsx` (Reports Hub)
> - `app/(dashboard)/reports/profitability/page.tsx` (Shipment Profitability)
> - `app/(dashboard)/reports/stations/page.tsx` (Station Monitoring)
> - `app/(dashboard)/reports/suppliers/page.tsx` (Supplier Scorecard)
> - `app/(dashboard)/reports/customers/page.tsx` (Customer Analytics)

---

## 1. مركز التقارير الموحد (`app/(dashboard)/reports/page.tsx`)

يعرض 4 بطاقات تنقل سريعة للتقارير الاستراتيجية مع ملخصات رقمية حية:

```
ReportsHubPage
├── ReportCard: تقرير ربحية الشحنات التصديرية (Shipment Profitability Analysis)
├── ReportCard: مراقبة وتقييم أداء المحطات (Station Monitoring & Yield)
├── ReportCard: تقييم أداء ومشتريات الموردين (Supplier Performance Scorecard)
└── ReportCard: تقرير مبيعات وتحصيلات العملاء (Customer Sales & AR Aging)
```

---

## 2. تقرير ربحية الشحنات (Shipment Profitability Analysis Contract)

**المسار في Next.js:** `app/(dashboard)/reports/profitability/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/shipment-profitability.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipment-profitability.html)

### أ. الغرض البيزنسي:
التقرير المالي الأهم للشركة لمعرفة هامش الربح الصافي المحقق لكل حاوية مصدرة بعد خصم تكلفة الإنتاج وتكاليف النولون والجمارك والموانئ.

### ب. جدول تحليل الربحية:

| العمود | الحقل البرمجي | المعادلة الحسابية | التنسيق |
| :--- | :--- | :--- | :--- |
| كود الشحنة | `shipmentId` | - | `SHP-2026-001` (رابط) |
| تاريخ الإبحار | `dispatchDate` | - | YYYY-MM-DD |
| العميل والدولة | `customerName` | - | شركة سما (هولندا) |
| الصنف والكمية | `productName`, `shippedQtyKg` | - | فراولة مجمدة IQF (4,000 كجم) |
| سعر البيع (EUR) | `sellingPriceEur` | - | `1.85 EUR/kg` |
| سعر الصرف المعتمد | `fxRate` | - | `53.20 EGP` |
| **إجمالي الإيراد (ج.م)** | `grossRevenueEgp` | $\text{shippedQty} \times \text{unitPriceEur} \times \text{fxRate}$ | `393,680.00 ج.م` |
| تكلفة الإنتاج المباشرة | `productionCost` | $\sum (\text{allocQty} \times \text{batch.costPerKg})$ | `126,240.00 ج.م` |
| مصاريف الشحن والموانئ | `shippingAndPortCost` | النقل البري + البحري + التخليص + الرسوم | `39,000.00 ج.م` |
| **إجمالي تكلفة الشحنة (COGS)** | `totalShipmentCost` | $\text{productionCost} + \text{shippingAndPortCost}$ | `165,240.00 ج.م` |
| **صافي الربح (ج.م)** | `netProfitEgp` | **$\text{grossRevenueEgp} - \text{totalShipmentCost}$** | **`228,440.00 ج.م` (خط أخضر)** |
| **هامش الربح الصافي %** | `marginPercent` | **$(\text{netProfitEgp} / \text{grossRevenueEgp}) \times 100$** | **`58.0%` (شارة خضراء)** |

---

## 3. تقرير مراقبة وتقييم أداء المحطات (Station Monitoring Contract)

**المسار في Next.js:** `app/(dashboard)/reports/stations/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/station-monitoring.html`](file:///e:/web/exporting_erp/base_prototype/pages/station-monitoring.html)

### أ. جدول مقارنة أداء المحطات (Station Benchmarking Table):

| المحطة | إجمالي الخام المستلم | إجمالي الناتج الجاهز | متوسط نسبة التصافي % | متوسط الهالك % | تكلفة الكيلو تشغيل | الرصيد المخزني الحالي |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **محطة النخيل** | 18,000 كجم | 14,400 كجم | **80.0%** | 20.0% | 2.50 ج.م | 92,000 كجم |
| **محطة السلام** | 12,000 كجم | 9,360 كجم | **78.0%** | 22.0% | 2.30 ج.م | 45,000 كجم |
| **محطة المدينة** | 25,000 كجم | 18,000 كجم | **72.0%** (مانجو) | 28.0% | 2.60 ج.م | 110,000 كجم |

---

## 4. تقرير أداء الموردين (Supplier Scorecard Contract)

**المسار في Next.js:** `app/(dashboard)/reports/suppliers/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/supplier-report.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplier-report.html)

- **المؤشرات المسجلة لكل مورد زراعي:**
  1. `إجمالي الكميات الموردة (كجم)`: وزن الخام الصافي المورد خلال الموسم.
  2. `متوسط درجة البريكس (Brix)`: متوسط جودة السكر الطبيعي في خام المورد.
  3. `نسبة التصافي الناتجة عن خامه (Yield Contribution %)`: كفاءة خامه على خطوط الإنتاج.
  4. `إجمالي المبالغ المستحقة (AP)`: إجمالي فواتير التوريد.
  5. `المسدد والمتبقي`: رصيد المورد الحالي وسرعة السداد.

---

## 5. تقرير مبيعات وتحصيلات العملاء (Customer Performance & Aging)

**المسار في Next.js:** `app/(dashboard)/reports/customers/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/customer-report.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-report.html)

- **المؤشرات المسجلة لكل عميل خارجي:**
  1. `إجمالي الحاويات والكميات المشحونة (كجم)`.
  2. `إجمالي المبيعات باليورو والجنيه المصري`.
  3. `إجمالي التحصيلات المقبوضة ونسبة السداد`.
  4. `الرصيد المتأخر (Outstanding AR)` وأعمار الديون (أقل من 30 يوم، 30-60 يوم، أكثر من 60 يوم).
  5. `صافي أرباح الشركة من هذا العميل`.
