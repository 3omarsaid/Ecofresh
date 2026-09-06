# Milestone 12: معالج تشغيل التدوير والفرز (Processing Wizard UI)

> **المرحلة 12 من 26** — ضمن المرحلة الكبرى الرابعة: الإنتاج والتدوير ومحرك التكاليف
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 3**

---

## 1. الهدف الاستراتيجي
بناء واجهة معالج إضافة عمليات الإنتاج والتدوير (Processing Wizard) المكون من 4 خطوات تفاعلية، مع جلب لوطات الخام المتاحة والمستلزمات الحالية، وتطبيق التحقق الفوري في الواجهة لمنع سحب كميات أكبر من الأرصدة المتاحة بالمخزن قبل إرسال الطلب للخادم.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - معالج إضافة العملية التفاعلي: [`base_prototype/pages/processing-operations.html` Lines 550-980](file:///e:/web/exporting_erp/base_prototype/pages/processing-operations.html#L550-L980)
- **منطق الكود في البروتوتايب:**
  - التبديل بين خطوات المعالج: [`base_prototype/js/interactions.js`](file:///e:/web/exporting_erp/base_prototype/js/interactions.js)
  - شروط سحب الخام والمستلزمات: [`base_prototype/js/state.js` Lines 785-845](file:///e:/web/exporting_erp/base_prototype/js/state.js#L785-L845).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 03** (المحطات)، **Milestone 04** (المقاولين)، **Milestone 06** (المستلزمات)، و **Milestone 09** (وجود لوطات خام برصيد متاح).

---

## 4. نطاق الواجهة والخطوات الأربع (UI Architecture)

### هيكل المكونات:
```
nilotic-frost-erp/
├── app/(dashboard)/processing-operations/
│   ├── page.tsx                           # جدول العمليات الرئيسي
│   └── new/page.tsx                       # شاشة المعالج الكاملة
├── components/modules/processing/
│   ├── wizard/
│   │   ├── wizard-step-indicator.tsx      # شريط مؤشر الخطوات الأربع
│   │   ├── step-1-general.tsx             # الخطوة 1: المحطة، المقاول، والأصناف
│   │   ├── step-2-raw-issues.tsx          # الخطوة 2: جدول سحب لوطات الخام
│   │   ├── step-3-supplies.tsx            # الخطوة 3: جدول سحب مواد التعبئة
│   │   └── step-4-costing-preview.tsx     # الخطوة 4: الناتج الفعلي والمعاينة والإقفال
│   └── operations-table.tsx               # جدول العمليات المعتمدة
└── lib/validations/processing.ts          # Zod Schema للعملية
```

---

## 5. تفصيل خطوات المعالج والتحقق (Wizard Steps Contract)

### الخطوة 1: البيانات العامة (General Info)
- **المحطة:** اختيار من محطات `stations`.
- **المقاول:** اختيار من `contractors`. عند اختيار المحطة، يتم تحديد المقاول الافتراضي تلقائياً.
- **الخام والناتج:** فراولة خام ➔ فراولة مجمدة IQF.
- **تاريخ التشغيل:** افتراضي تاريخ اليوم.

### الخطوة 2: سحب لوطات الخام (Raw Issues Picker)
- جدول يتيح إضافة أكثر من لوط في نفس التشغيلة:
  - قائمة اللوطات المنسدلة: تعرض فقط اللوطات التابعة لنفس المحطة ولها رصيد متاح (`availableQty > 0`).
  - بجانب كل لوط: يظهر اسم المزرعة والرصيد المتاح وتكلفة الكيلو الموزونة.
  - حقل إدخال الكمية المسحوبة: يتم فحصه لحظياً: $\text{issueQty} \le \text{lot.availableQty}$.
  - إذا تجاوز الرصيد المتاح، يُعطل زر المتابعة ويظهر تحذير أحمر.

### الخطوة 3: استهلاك المستلزمات (Supplies Consumption)
- جدول المستلزمات (كراتين 10 كجم، أكياس، استرتش):
  - حقل الكمية المستهلكة السليمة في التعبئة (`consumed`).
  - حقل هالك المستلزمات (الكراتين التالفة) (`waste`).
  - فحص الرصيد: $\text{consumed} + \text{waste} \le \text{supply.stock}$.

### الخطوة 4: الناتج الفعلي والمعاينة الحسابية اللحظية (Reactive Costing)
- حقل إدخال الناتج التام الجاهز بالكيلوجرام (`finishedOutputKg`).
- حقل الناتج الثانوي (هالك صالح للعصير) (`secondaryOutputKg`).
- **المعادلات المعروضة لحظياً على الشاشة:**
  $$\text{Raw Waste (kg)} = \text{Raw Input} - (\text{Finished Output} + \text{Secondary Output})$$
  $$\text{Yield \%} = \left(\frac{\text{Finished Output}}{\text{Raw Input}}\right) \times 100$$
  $$\text{Contractor Cost} = \text{Finished Output} \times \text{Contractor Rate}$$
  $$\text{Station Cost} = \text{Finished Output} \times \text{Station Electricity Rate}$$
  $$\text{Unit Cost (EGP/kg)} = \frac{\text{Grand Total Cost}}{\text{Finished Output}}$$
- خانة تأكيد الإقفال: `[x] اعتماد وإقفال العملية فوراً (Lock)`.

---

## 6. كود الـ Validation بـ Zod (`lib/validations/processing.ts`)

```ts
import { z } from 'zod';

export const ProcessingSchema = z.object({
  stationId: z.string().min(1, 'المحطة مطلوبة'),
  contractorId: z.string().min(1, 'المقاول مطلوب'),
  rawProduct: z.string().min(1, 'المحصول الخام مطلوب'),
  finishedProduct: z.string().min(1, 'المنتج النهائي مطلوب'),
  date: z.string().optional(),
  rawIssues: z.array(z.object({
    batchId: z.string().min(1, 'معرف اللوط مطلوب'),
    qty: z.coerce.number().positive('كمية الخام المسحوبة يجب أن تكون أكبر من 0'),
  })).min(1, 'يجب سحب لوط خام واحد على الأقل'),
  suppliesIssues: z.array(z.object({
    supplyId: z.string().min(1, 'المستلزم مطلوب'),
    consumed: z.coerce.number().min(0),
    waste: z.coerce.number().min(0).default(0),
    unitCost: z.coerce.number().min(0),
  })).min(1, 'يجب إدخال مستلزم تعبئة واحد على الأقل'),
  finishedOutputKg: z.coerce.number().positive('الناتج التام يجب أن يكون أكبر من 0'),
  secondaryOutputKg: z.coerce.number().min(0).default(0),
  otherCost: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});
```

---

## 7. نقطة التفتيش والاختبار (Check Point 12)
1. **اختبار التنقل بين الخطوات وحفظ البيانات في الـ State:**
   - ملء الخطوة 1 ثم الانتقال للخطوة 2 ثم العودة للخطوة 1 والتأكد من بقاء الاختيارات دون مسح.
2. **اختبار منع السحب الزائد في الواجهة:**
   - اختيار لوط رصيده المتاح 5,000 كجم وإدخال 6,000 كجم.
   - **النتيجة المتوقعة:** ظهور تنبيه أحمر وتعطيل زر "التالي" فوراً.
3. **اختبار الحساب اللحظي:**
   - إدخال خام مسحوب 6,000 كجم وناتج تام 4,800 كجم والتأكد من ظهور نسبة التصافي $\mathbf{80.0\%}$ باللون الأخضر تلقائياً في الخطوة 4.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] خطوات المعالج الأربع تعمل بسلاسة في شاشة منبثقة أو صفحة مستقلة.
- [ ] التحقق يمنع تجاوز الأرصدة المتاحة للوطات والمستلزمات في واجهة المستخدم.
- [ ] الحسابات الرياضية تظهر لحظياً قبل إرسال البيانات إلى الخادم.
