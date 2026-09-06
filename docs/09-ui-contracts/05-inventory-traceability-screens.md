# عقود واجهات المخزون والتتبع والهالك (Inventory & Traceability UI Contracts)

> **الملفات المرجعية بالبروتوتايب:**
> - مخزن المنتج الجاهز واللوطات: [`base_prototype/pages/inventory.html`](file:///e:/web/exporting_erp/base_prototype/pages/inventory.html) (1483 سطراً)
> - مخزن المواد الخام: [`base_prototype/pages/raw-materials.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-materials.html)
> - مراقبة الهالك والتكاليف: [`base_prototype/pages/waste-monitoring.html`](file:///e:/web/exporting_erp/base_prototype/pages/waste-monitoring.html) (595 سطراً)
> - المخازن والمحطات: [`base_prototype/pages/warehouses.html`](file:///e:/web/exporting_erp/base_prototype/pages/warehouses.html) و [`warehouse-details.html`](file:///e:/web/exporting_erp/base_prototype/pages/warehouse-details.html)
> - منطق التحويلات والرصيد: [`base_prototype/js/state.js` Lines 1126-1158](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1126-L1158)
> 
> **المسارات المستهدفة في Next.js:**
> - `app/(dashboard)/inventory/page.tsx` (Finished Goods Batches)
> - `app/(dashboard)/inventory/raw/page.tsx` (Raw Materials Inventory)
> - `app/(dashboard)/inventory/waste/page.tsx` (Waste Monitoring Hub)
> - `app/(dashboard)/inventory/transfers/page.tsx` (Inter-Station Transfers)
> - `app/(dashboard)/warehouses/...`

---

## 1. شاشة مخزن المنتج الجاهز (Finished Goods Inventory Screen)

**المسار في Next.js:** `app/(dashboard)/inventory/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/inventory.html` Lines 45-120](file:///e:/web/exporting_erp/base_prototype/pages/inventory.html#L45-L120)

### أ. أزرار شريط الإجراءات العلوي (Top Action Bar):
1. **`حجز كمية لطلبية` (Reserve Modal):** فتح نافذة حجز كمية من باتش جاهز لطلبية عميل محددة.
2. **`+ أمر تشغيل وإنتاج`:** رابط ينقل فوراً إلى `/processing-operations`.
3. **`+ وارد بضاعة جاهزة (صفقة)`:** رابط ينقل فوراً إلى `/finished-purchases`.
4. **`تحويل بين المحطات` (Transfer Modal):** فتح نافذة نقل رصيد بين محطتين.
5. **`تسوية مخزون` (Adjustment Modal):** فتح نافذة جرد وتسوية عجز/زيادة.

---

### ب. جدول باتشات المنتج الجاهز (FG Batches Table Contract):

| اسم العمود | الحقل البرمجي | النوع | الشرح والسلوك | المرجع بالبروتوتايب |
| :--- | :--- | :--- | :--- | :--- |
| كود الباتش | `fgBatchId` | String | بادئة `FG-PR-` (إنتاج) أو `FG-DIR-` (صفقة) | [`inventory.html` Line 180](file:///e:/web/exporting_erp/base_prototype/pages/inventory.html#L180) |
| المحطة والموقع | `station` | String | اسم المحطة الحالية الحاضنة للرصيد | "محطة النخيل" |
| اسم المنتج التصديري | `productName` | String | فراولة مجمدة IQF / مانجو مكعبات | [`state.js` Line 365](file:///e:/web/exporting_erp/base_prototype/js/state.js#L365) |
| تاريخ الإنتاج والصلاحية | `productionDate`, `expiryDate` | Date | تاريخ الإنتاج وتاريخ انتهاء الصلاحية | [`state.js` Line 366](file:///e:/web/exporting_erp/base_prototype/js/state.js#L366) |
| الرصيد المتاح (كجم) | `availableQty` | Number | **الكمية الصالحة للشحن الفوري** | [`state.js` Line 368](file:///e:/web/exporting_erp/base_prototype/js/state.js#L368) |
| التكلفة للكيلو (ج.م) | `costPerKg` | Number | تكلفة الكيلو الموزونة الموروثة | `31.56 ج.م/كجم` |
| إجمالي قيمة الرصيد | `totalValue` | Number | $\text{availableQty} \times \text{costPerKg}$ | `151,500.00 ج.م` |
| شجرة الموردين (DNA) | `suppliersSummary` | Array Chips | نسب مساهمة المزارع بالباتش | "مزارع الوادي: 66.7% / شركة الخير: 33.3%" |
| الإجراءات | Buttons | Actions | زر فحص التتبع، زر التخصيص لشحنة | يفتح تفاصيل شجرة التتبع |

---

### ج. نافذة التحويل بين المحطات (Inter-Station Transfer Modal Contract)
المصدر: [`inventory.html` Lines 850-920](file:///e:/web/exporting_erp/base_prototype/pages/inventory.html#L850-L920) و [`state.js` Lines 1126-1158](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1126-L1158)

- **الحقول:**
  1. `fromStation`: المحطة المصدر (يُحدد تلقائياً حسب الباتش المختار).
  2. `toStation`: المحطة الوجهة المراد نقل الرصيد إليها.
  3. `batchId`: الباتش المنقول منه.
  4. `qtyKg`: الكمية المراد نقلها.
     - *التحقق الصارم:* $\text{qtyKg} \le \text{batch.availableQty}$ وإلا يظهر خطأ: *"الكمية المطلوب تحويلها تتجاوز الرصيد المتاح!"*.
  5. `truckPlate`: رقم لوحة سيارة النقل الداخلي المبرد.
  6. `driverName`: اسم سائق المحطة.
- **التنفيذ السليم بالنظام الجديد (إصلاح الـ Bug في البروتوتايب):**
  - في البروتوتايب القديم كان هناك خلل (`batch.availableQty -= qty; batch.availableQty += qty;`).
  - في النظام الجديد: يتم خصم الكمية من الباتش بالمحطة المصدر، وإنشاء سجل باتش جديد بالمحطة الوجهة يحمل نفس التكلفة وشجرة الموردين برقم إذن `TRF-2026-XXX`.

---

## 2. شاشة مخزن المواد الخام (Raw Materials Lots Screen)

**المسار في Next.js:** `app/(dashboard)/inventory/raw/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/raw-materials.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-materials.html)

- **بيانات لوطات الخام:**
  - `رقم اللوط`: `LOT-RAW-001`.
  - `المورد الزراعي`: اسم المزرعة ورقم الهاتف والمحافظة.
  - `تاريخ الاستلام`: تاريخ وصول السيارة وميزان البسكول.
  - `الكمية الأولية والكمية المتبقية`: مثل `8,000 كجم` أولية ➔ `4,000 كجم` متبقية بعد سحبها للتشغيل.
  - `تكلفة الكيلو الموزونة`: `18.50 ج.م`.
  - `درجة البريكس`: `8.5 Brix`.
  - `حالة فحص الجودة`: شارة خضراء `APPROVED`.

---

## 3. مركز مراقبة وتحليل الهالك (Waste Monitoring Hub)

**المسار في Next.js:** `app/(dashboard)/inventory/waste/page.tsx`  
**المرجع بالبروتوتايب:** [`base_prototype/pages/waste-monitoring.html`](file:///e:/web/exporting_erp/base_prototype/pages/waste-monitoring.html) (595 سطراً)

### أ. بطاقات KPI لتحليل الهالك:
1. **إجمالي هالك الخام:** بالوزن (كجم) وبالتكلفة المالية الإجمالية بالجنيه.
2. **متوسط نسبة الهالك الفعلية مقابل المعيارية:**
   - الفراولة: فعلي $20.0\%$ مقابل معياري $20.0\%$ (مطابق).
   - المانجو: فعلي $28.0\%$ مقابل معياري $28.0\%$ (مطابق).
3. **تكلفة هالك المستلزمات (الكراتين والتغليف):** إجمالي قيمة الكراتين والأكياس التالفة أثناء الإنتاج.

### ب. جدول ربط الهالك بالموردين والمحطات (Waste Attribution Table):
- يوضح الجدول لكل عملية تشغيل:
  - رقم أمر التشغيل `PR-2026-001`.
  - المحطة المنفذة.
  - الموردون المساهمون في الخام ونسبة مساهمة كل مورد في الهالك الناتج.
  - السبب المسجل للهالك: (فرز شوائب، حبات غير مكتملة النضج، تلف ميكانيكي، فاقد تجميد).
  - التكلفة المهدرة المباشرة: $\text{Waste Cost} = \text{rawWasteKg} \times \text{lot.unitCost}$.
