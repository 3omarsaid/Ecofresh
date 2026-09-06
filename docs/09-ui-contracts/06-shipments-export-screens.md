# عقود واجهات الشحنات والتصدير والتتبع الكامل (Shipments & Export UI Contracts)

> **الملفات المرجعية بالبروتوتايب:**
> - شاشة تنفيذ الشحنة ومعالج الخطوات الـ 3: [`base_prototype/pages/shipment-create.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipment-create.html) (852 سطراً)
> - سجل ومتابعة الشحنات: [`base_prototype/pages/shipments.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipments.html)
> - صفحة تفاصيل الشحنة وشجرة التتبع: [`base_prototype/pages/shipment-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipment-details.html)
> - منطق تنفيذ الشحنة بالكامل: [`base_prototype/js/state.js` Lines 985-1088](file:///e:/web/exporting_erp/base_prototype/js/state.js#L985-L1088)
> 
> **المسارات المستهدفة في Next.js:**
> - `app/(dashboard)/shipments/page.tsx` (Shipments Registry)
> - `app/(dashboard)/shipments/new/page.tsx` (Create Shipment 3-Step Wizard)
> - `app/(dashboard)/shipments/[id]/page.tsx` (Shipment Details & Traceability Tree)

---

## 1. معالج تنفيذ شحنة تصدير جديدة (Shipment Create 3-Step Wizard)

**المسار في Next.js:** `app/(dashboard)/shipments/new/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/shipment-create.html` Lines 50-800](file:///e:/web/exporting_erp/base_prototype/pages/shipment-create.html#L50-L800)

### أ. تدفق المعالج (Wizard Flow):
```mermaid
graph LR
    S1[الخطوة 1: اختيار طلبية العميل المعتمدة] --> S2[الخطوة 2: تخصيص اللوطات من مخزن الجاهز]
    S2 --> S3[الخطوة 3: بيانات الحاوية والتحقق المالي]
    S3 --> S4[اعتماد الشحن ➔ خصم المخزون + توليد الفاتورة]
```

---

### ب. تفصيل الخطوة 1: اختيار طلبية العميل (Step 1: Order Selection)
المصدر: [`shipment-create.html` Lines 115-280](file:///e:/web/exporting_erp/base_prototype/pages/shipment-create.html#L115-L280)

1. **حقل اختيار اسم العميل (`customerSelect`):**
   - يجلب قائمة العملاء النشطين من `customers`.
2. **حقل اختيار رقم الطلبية (`orderSelect`):**
   - يُرشح فقط الطلبيات التابعة لهذا العميل وحالتها ليست "مكتملة بالكامل" (`unfulfilledQtyKg > 0`).
3. **الحقول المجلوبة تلقائياً والمحمية من التعديل العشوائي (Badge-Derived Readonly Fields):**
   - `المنتج التصديري`: مثل "فراولة مجمدة IQF".
   - `الكمية المتبقية غير المشحونة بالطلبية`: مثل `6,000 كجم متبقية` (من إجمالي 10,000 كجم).
   - `سعر البيع المتفق عليه`: مثل `1.85 EUR/kg`.
   - `شروط التسليم`: مثل "FOB - ميناء الإسكندرية".
   - `ميناء الوصول النهائي`: مثل "ميناء روتردام - هولندا".
   - `سعر الصرف التعاقدي المعتمد`: مثل `53.20 EGP/EUR`.

---

### ج. تفصيل الخطوة 2: تخصيص الباتشات من المخزن (Step 2: Batch Allocation)
المصدر: [`shipment-create.html` Lines 310-520](file:///e:/web/exporting_erp/base_prototype/pages/shipment-create.html#L310-L520) و [`state.js` Lines 1000-1035](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1000-L1035)

- **جدول اختيار وتخصيص الباتشات الجاهزة:**
  - يعرض الباتشات المتاحة لنفس الصنف (`finishedGoodsBatches` حيث `availableQty > 0`).
  - لكل باتش: كود الباتش، تاريخ الإنتاج، المحطة، الرصيد المتاح، وتكلفة الكيلو الموزونة (`costPerKg`).
  - **عرض شجرة الموردين لكل باتش (DNA Badges):** يعرض للمستخدم مباشرة المزارع الموردة للباتش ونسبها (مثال: *"مزارع الوادي: 66.7% - شركة الخير: 33.3%"*).
  - حقل إدخال الكمية المخصصة للشحنة من هذا الباتش (`allocQty`).
  - **قواعد التحقق الصارمة (Strict Validation):**
    1. $\text{allocQty} \le \text{batch.availableQty}$ (لا يمكن تخصيص أكثر من رصيد الباتش).
    2. $\sum \text{allocQty} \le \text{order.unfulfilledQtyKg}$ (لا يمكن شحن كمية تتجاوز رصيد الطلبية).
  - احتساب تكلفة الإنتاج المباشرة للشحنة:
    $$\text{Total Production Cost} = \sum (\text{allocQty} \times \text{batch.costPerKg})$$

---

### د. تفصيل الخطوة 3: اللوجستيات والتحقق المالي والربحية (Step 3: Logistics & Financials)
المصدر: [`shipment-create.html` Lines 540-750](file:///e:/web/exporting_erp/base_prototype/pages/shipment-create.html#L540-L750) و [`state.js` Lines 1040-1065](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1040-L1065)

1. **بيانات الحاوية والشحن البحري:**
   - رقم الحاوية المبرد (`containerNo`): مثل `MSCU-987654-3`.
   - رقم الختم الجمركي المعتمد (`sealNo`): مثل `SL-EGY-44910`.
   - الخط الملاحي والناقل (`shippingLine`): مثل "MSC" أو "Maersk".
   - رقم البوليصة / الحجز (`bookingNo`): مثل `BKG-2026-9901`.
   - تاريخ التصدير والإبحار (`dispatchDate`).
2. **تكاليف الشحن واللوجستيات الإضافية (Export Overhead Costs):**
   - نولون نقل بري للميناء (`inlandTrucking`): افتراضي `6,500.00 ج.م`.
   - شحن بحري / حجز الفراغ (`oceanFreight`): افتراضي `22,000.00 ج.م`.
   - تخليص جمركي وأذون فحص (`customsClearance`): افتراضي `4,500.00 ج.م`.
   - شهادات صحية وزراعية وتبخير (`inspectionCertificates`): افتراضي `2,500.00 ج.م`.
   - رسوم شحن وتفريغ بالميناء (`portTerminalCharges`): افتراضي `3,500.00 ج.م`.
3. **صندوق المعاينة الفورية للأرباح والهامش (Live Margin Preview Card):**
   - **إجمالي الإيراد بالجنيه المصري:**
     $$\text{Gross Revenue EGP} = \text{shippedQty} \times \text{unitPriceEur} \times \text{fxRate}$$
     *مثال:* $4000 \times 1.85 \times 53.20 = \mathbf{393,680.00\text{ ج.م}}$
   - **إجمالي تكلفة الشحنة الكاملة:**
     $$\text{Total Shipment Cost} = \text{Total Production Cost} + \sum \text{Overhead Costs}$$
     *مثال:* $126,240 + 39,000 = \mathbf{165,240.00\text{ ج.م}}$
   - **صافي ربح الشحنة:**
     $$\text{Net Profit EGP} = \text{Gross Revenue} - \text{Total Cost} = \mathbf{228,440.00\text{ ج.م}}$$
   - **هامش الربح الصافي %:**
     $$\text{Margin \%} = \left(\frac{\text{Net Profit}}{\text{Gross Revenue}}\right) \times 100 = \mathbf{58.0\%}$$
4. **زر الاعتماد النهائي:**
   - نص الزر: `🚀 اعتماد استخراج الشحنة والإبحار وتوليد الفاتورة`.
   - استدعاء Server Action: `createShipment(data)` في `actions/shipments.ts`.

---

## 2. شاشة تفاصيل الشحنة والتتبع الكامل (Shipment Details & Traceability)

**المسار في Next.js:** `app/(dashboard)/shipments/[id]/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/shipment-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipment-details.html)

### تحتوي الصفحة على 4 أقسام رئيسية:
1. **بطاقة ملخص الشحنة (Summary Card):** كود الشحنة، الحاوية، العميل، ميناء الوصول، وتاريخ الخروج.
2. **جدول تفصيل بنود التكاليف والربحية:** جدول يقارن بين الإيراد المحقق وكل بند من بنود التكلفة مع هامش الربح الصافي.
3. **شجرة التتبع الكاملة من المزرعة للحاوية (Traceability Tree - DNA Flow):**
   - تعرض الشجرة بتنسيق مرئي تسلسلي:
     $$\text{المزارع الموردة (مزارع الوادي 66.7\% - شركة الخير 33.3\%)} \longrightarrow \text{لوطات الخام (LOT-RAW-001 \& 002)}$$
     $$\longrightarrow \text{أمر التشغيل (PR-2026-001 بمحطة النخيل)} \longrightarrow \text{باتش الجاهز (FG-PR-2026-001)}$$
     $$\longrightarrow \text{الشحنة (SHP-2026-001 في الحاوية MSCU-987654-3)} \longrightarrow \text{العميل (شركة سما - هولندا)}$$
4. **سجل التدقيق الزمني (Audit Timeline):**
   - من أنشأ الشحنة، متى اعتمدت، وتاريخ صدور القيد المالي.
