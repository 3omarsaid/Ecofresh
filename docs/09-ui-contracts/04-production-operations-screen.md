# عقد واجهة عمليات التدوير والإنتاج (Production & Processing UI Contract)

> **الملف المرجعي الأهم بالبروتوتايب:**
> - شاشة العمليات الكاملة: [`base_prototype/pages/processing-operations.html`](file:///e:/web/exporting_erp/base_prototype/pages/processing-operations.html) (1451 سطراً)
> - منطق احتساب التكاليف والباتشات: [`base_prototype/js/state.js` Lines 780-920](file:///e:/web/exporting_erp/base_prototype/js/state.js#L780-L920)
> - محرك التفاعلات والـ Modal: [`base_prototype/js/interactions.js`](file:///e:/web/exporting_erp/base_prototype/js/interactions.js)
> 
> **المسار المستهدف في Next.js:**
> - `app/(dashboard)/processing-operations/page.tsx`
> - `components/modules/processing/operation-wizard-dialog.tsx`
> - `components/modules/processing/operation-details-sheet.tsx`

---

## 1. الهيكل العام للصفحة (Page Anatomy)

```
ProcessingOperationsPage (Server Component)
├── Header & UserRoleBanner (عرض المستخدم الحالي ورتبته مع زر التبديل التجريبي)
├── KPICardsRow (6 بطاقات إحصائية مجمعة)
│   ├── TotalOperationsCount (إجمالي أوامر التشغيل)
│   ├── TotalRawInputKg (إجمالي الخام المسحوب بالكيلوجرام)
│   ├── TotalFinishedOutputKg (إجمالي الناتج الجاهز النهائي)
│   ├── AverageYieldPercentage (متوسط نسبة التصافي % - Yield)
│   ├── TotalRawWasteKg (إجمالي هالك الفرز والتجميد)
│   └── TotalProcessingCostEgp (إجمالي تكاليف التشغيل بالجنيه)
├── ControlsBar (فلاتر المحطة، المنتج، نطاق التاريخ + بحث + زر + أمر تشغيل جديد)
├── OperationsTable (جدول العمليات مع تفاصيل التكلفة والتصافي وحالة القفل)
└── Modals / Dialogs:
    ├── CreateOperationWizardModal (معالج إضافة عملية تشغيل بـ 4 خطوات)
    └── OperationDetailsDrawer (عرض شجرة اللوطات وتفصيل التكلفة وسجل التدقيق)
```

---

## 2. مواصفات بطاقات المؤشرات (Top KPI Cards Contract)

المصدر البرمجي بالبروتوتايب: [`processing-operations.html` Lines 110-180](file:///e:/web/exporting_erp/base_prototype/pages/processing-operations.html#L110-L180)

| معرف البطاقة | التسمية بالعربية | المعادلة الحسابية في Supabase View | التنسيق |
| :--- | :--- | :--- | :--- |
| `kpi_ops_count` | عدد العمليات المنفذة | `COUNT(id)` | رقم صحيح (`2 عملية`) |
| `kpi_raw_input` | إجمالي الخام المسحوب | `SUM(raw_input_kg)` | `6,000 كجم` |
| `kpi_finished_out` | إجمالي الناتج الجاهز | `SUM(finished_output_kg)` | `4,800 كجم` |
| `kpi_avg_yield` | متوسط نسبة التصافي | `(SUM(finished_output_kg) / SUM(raw_input_kg)) * 100` | شارة خضراء `80.0%` |
| `kpi_waste_kg` | إجمالي هالك التشغيل | `SUM(raw_waste_kg)` | شارة حمراء `900 كجم` |
| `kpi_total_cost` | إجمالي تكاليف الإنتاج | `SUM(grand_total_cost)` | خط عريض `151,500.00 ج.م` |

---

## 3. جدول العمليات الرئيسي (Operations Main Table Contract)

المصدر البرمجي: [`processing-operations.html` Lines 220-350](file:///e:/web/exporting_erp/base_prototype/pages/processing-operations.html#L220-L350)

### أعمدة الجدول وسلوكها:
1. **رقم أمر التشغيل (`id`):** مثل `PR-2026-001` (نص عريض أخضر داكن مع أيقونة قفل `lock` إذا كانت معتمدة).
2. **تاريخ العملية (`date`):** YYYY-MM-DD.
3. **المحطة والمقاول (`station`, `contractor`):** "محطة النخيل" / "مقاول أحمد للتجهيز".
4. **الخام والناتج:** "فراولة خام" ➔ "فراولة مجمدة IQF".
5. **الخام المسحوب (`raw_input_kg`):** `6,000 كجم` (مع رابط منبثق يعرض اللوطات المسحوبة).
6. **الناتج الجاهز (`finished_output_kg`):** `4,800 كجم`.
7. **نسبة التصافي (`yield_percent`):** شارة بنسبة التصافي (إذا $\ge 80\%$ أخضر، إذا $< 75\%$ أحمر).
8. **تكلفة الكيلو الموزونة (`cost_per_kg`):** `31.56 ج.م/كجم` (أهم رقم بيزنسي يحدد التكلفة للشحن).
9. **الباتش المولد (`generated_batch_id`):** `FG-PR-2026-001` (رابط ينقل فوراً لصفحة تفاصيل الباتش في المخزن).
10. **حالة الاعتماد:** شارة "معتمد ومقفل" (`locked: true`).
11. **الإجراءات:** زر استعراض التفاصيل، زر طباعة إذن الإنتاج، وزر الحذف (مفعل فقط للـ `admin` وفقط إذا كانت العملية غير مقفلة).

---

## 4. معالج إضافة عملية تشغيل جديدة (Create Operation Wizard Modal)

المصدر بالبروتوتايب: [`processing-operations.html` Lines 550-980](file:///e:/web/exporting_erp/base_prototype/pages/processing-operations.html#L550-L980)  
المعالج يعمل في نافذة منبثقة (Modal Dialog) مقسمة إلى 4 أقسام تفاعلية:

### القسم 1: البيانات العامة والمحطة (General Info)
- **المحطة المستضيفة (`station`):** قائمة منسدلة.
  - *تأثير الاختيار:* يقوم النظام تلقائياً بتحديد المقاول الافتراضي للمحطة وتعيين تعريفة الكيلو الخاصة به (`contractorTariffRatePerKg = 2.00 ج.م`).
- **المقاول المسؤول (`contractor`):** يمكن تغيير المقاول أو تعديل سعر الكيلو يدوياً للمفوضين.
- **الخام المستهدف والمنتج النهائي:** اختيار الصنفين لتحديد معادلات الهالك المعيارية.

---

### القسم 2: سحب لوطات المواد الخام (Raw Lots Issue Table)
المصدر: [`state.js` Lines 795-820](file:///e:/web/exporting_erp/base_prototype/js/state.js#L795-L820)
- يحتوي على جدول ديناميكي لإضافة سطر سحب:
  - اختيار رقم اللوط من قائمة اللوطات ذات الرصيد المتاح (`rawBatches` حيث `availableQty > 0` وبنفس المحطة).
  - يظهر فوراً للمستخدم: اسم المورد، الرصيد المتاح، وتكلفة الكيلو الموزونة للوط.
  - إدخال الكمية المسحوبة (`qty`).
  - **التحقق (Validation):** لا يمكن إدخال كمية أكبر من الرصيد المتاح في اللوط المختار.
  - زر `+ سحب من لوط آخر` لدعم عمليات الدمج بين أكثر من لوط/مورد في نفس التشغيلة.
  - **المعادلة:**
    $$\text{Total Raw Cost} = \sum (\text{lot.qty} \times \text{lot.unitCost})$$

---

### القسم 3: استهلاك المستلزمات ومواد التغليف (Supplies Issues Table)
المصدر: [`state.js` Lines 822-845](file:///e:/web/exporting_erp/base_prototype/js/state.js#L822-L845)
- إضافة مستلزمات التشغيل (كراتين 10 كجم، أكياس، استرتش):
  - حقل الكمية المستهلكة السليمة في التعبئة (`consumed`).
  - حقل هالك المستلزمات (الكراتين التالفة أثناء التعبئة) (`waste`).
  - الرصيد المسحوب الكلي: $\text{withdrawn} = \text{consumed} + \text{waste}$.
  - **التحقق:** التأكد من وجود رصيد كافٍ في `supplies.stock`.

---

### القسم 4: الناتج الفعلي واحتساب التكاليف والإقفال (Output, Costing & Lock)
المصدر: [`state.js` Lines 847-915](file:///e:/web/exporting_erp/base_prototype/js/state.js#L847-L915)

1. **المدخلات اليدوية من واقع خط الإنتاج:**
   - الناتج التام الجاهز الصالح للتصدير (`finishedOutputKg`): مثل `4,800 كجم`.
   - الناتج الثانوي (قشور/هالك صالح للبيع لمصانع العصير) (`secondaryOutputKg`): مثل `300 كجم`.
   - مصاريف أخرى إضافية (`otherCost`): مثل نقل داخلي أو وقود.
2. **الحسابات التلقائية الفورية بالواجهة (Realtime Derived Fields):**
   - **الهالك الفعلي للخام:**
     $$\text{rawWasteKg} = \text{rawInputKg} - (\text{finishedOutputKg} + \text{secondaryOutputKg})$$
   - **نسبة الإنتاجية والتصافي:**
     $$\text{yieldPercent} = \left(\frac{\text{finishedOutputKg}}{\text{rawInputKg}}\right) \times 100$$
   - **أتعاب المقاول:**
     $$\text{contractorCost} = \text{finishedOutputKg} \times \text{contractorRatePerKg}$$
   - **رسوم المحطة والتبريد:**
     $$\text{stationCost} = \text{finishedOutputKg} \times \text{stationElectricityRate}$$
   - **إجمالي تكلفة العملية الكاملة:**
     $$\text{grandTotalCost} = \text{rawCost} + \text{suppliesConsumedCost} + \text{suppliesWasteCost} + \text{contractorCost} + \text{stationCost} + \text{otherCost}$$
   - **تكلفة الكيلو الموزونة المعتمدة للباتش الجاهز:**
     $$\text{costPerKg} = \frac{\text{grandTotalCost}}{\text{finishedOutputKg}}$$
3. **خانة الاختيار (Checkbox):**
   - `[x] اعتماد وإقفال العملية فوراً (Lock & Finalize)`.
   - نص تحذيري: *"عند إقفال العملية، سيتم خصم الخام والمستلزمات نهائياً وتوليد باتش المنتج الجاهز وقيد مستحق المقاول، ولا يمكن التراجع."*

---

## 5. محددات الصلاحيات (RBAC Rules on Screen)

المصدر: [`state.js` Lines 540-575](file:///e:/web/exporting_erp/base_prototype/js/state.js#L540-L575)

| الدور (Role) | زر "+ أمر تشغيل جديد" | تعديل عملية غير مقفلة | إقفال العملية (Lock) | حذف العملية |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | متاح | متاح | متاح | متاح فقط لغير المقفلة |
| **Supervisor** | متاح | متاح | متاح | ❌ معطل ومخفي |
| **Operator** | متاح | متاح | ❌ معطل ومحمي | ❌ معطل ومخفي |
| **Storekeeper** | متاح | ❌ قراءة فقط | ❌ معطل | ❌ معطل ومخفي |
| **Viewer** | ❌ مخفي بالكامل | ❌ مخفي | ❌ مخفي | ❌ مخفي |
