# Milestone 17: مركز مراقبة وتكاليف الهالك (Waste Monitoring Hub)

> **المرحلة 17 من 26** — ضمن المرحلة الكبرى الخامسة: المخازن والتتبع اللوجستي والهالك
> **بوابة الفحص المرتبطة:** إتمام واعتماد **🛑 Major Checkpoint 3**

---

## 1. الهدف الاستراتيجي
بناء مركز مراقبة وتحليل الهالك الصناعي والزراعي (Waste Monitoring Hub)، واحتساب التكاليف المالية المباشرة للهالك بالجنيه المصري، وتوزيع ونسبة الهالك إلى المزارع الموردة (Supplier Waste Attribution) لمقارنة نسب الفقد الفعلية بالنسب المعيارية.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - مركز مراقبة الهالك: [`base_prototype/pages/waste-monitoring.html`](file:///e:/web/exporting_erp/base_prototype/pages/waste-monitoring.html) (595 سطراً)
- **منطق الحسابات بالبروتوتايب:**
  - هالك خام الفرز والتجميد: [`base_prototype/js/state.js` Line 855](file:///e:/web/exporting_erp/base_prototype/js/state.js#L855) (`rawWasteKg`).
  - هالك الكراتين ومستلزمات التعبئة: [`state.js` Line 840](file:///e:/web/exporting_erp/base_prototype/js/state.js#L840) (`suppliesWasteCost`).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 13** (عمليات التشغيل المنفذة) و **Milestone 16** (التحويلات).

---

## 4. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/inventory/waste/
│   └── page.tsx                      # مركز مراقبة وتحليل الهالك
├── components/modules/inventory/
│   ├── waste-kpi-cards.tsx           # كروت الهالك بالوزن، التكلفة، ومقارنة المعياري
│   ├── supplier-waste-table.tsx      # جدول نسب هالك المزارع والموردين
│   └── supplies-waste-card.tsx       # كارت هالك الكراتين ومواد التعبئة
└── lib/data/waste-analytics.ts       # استعلامات Prisma التجميعية
```

### مؤشرات الـ KPI في أعلى الشاشة:
1. **إجمالي هالك الخام:** بالوزن الصافي بالكيلوجرام (مثل `900 كجم`).
2. **التكلفة المالية لهالك الخام:** بالجنيه المصري ($\sum \text{rawWasteKg} \times \text{lot.unitCost}$).
3. **تكلفة هالك المستلزمات:** بالجنيه للكراتين والأكياس التالفة أثناء التعبئة.
4. **مؤشر المطابقة المعيارية:** شارة خضراء إذا كانت نسبة الهالك الفعلية $\le$ المعيارية (20% للفراولة)، وشارة حمراء إذا تجاوزت المعيار.

---

## 5. كود استعلام وتجميع بيانات الهالك بـ Prisma

```ts
// lib/data/waste-analytics.ts
import { prisma } from '@/lib/prisma';

export async function getWasteAnalytics() {
  const operations = await prisma.processingOperation.findMany({
    include: {
      rawIssues: {
        include: {
          rawBatch: {
            include: { supplier: true }
          }
        }
      },
      station: true,
    },
  });

  const totalRawWasteKg = operations.reduce((sum, o) => sum + Number(o.rawWasteKg), 0);
  const totalSuppliesWasteEgp = operations.reduce((sum, o) => sum + Number(o.suppliesWasteCost), 0);

  // حساب التكلفة المالية لهالك الخام
  let totalRawWasteEgp = 0;
  const supplierAttribution: Record<string, { name: string; rawDelivered: number; attributedWaste: number }> = {};

  for (const op of operations) {
    const opRawInput = Number(op.rawInputKg);
    const opWaste = Number(op.rawWasteKg);
    const avgCostPerKg = Number(op.rawCost) / opRawInput;
    totalRawWasteEgp += opWaste * avgCostPerKg;

    // توزيع الهالك على الموردين حسب نسبة مساهمتهم في التشغيلة
    for (const issue of op.rawIssues) {
      const supName = issue.rawBatch.supplier.name;
      const issueQty = Number(issue.qtyKg);
      const shareOfWaste = opWaste * (issueQty / opRawInput);

      if (!supplierAttribution[supName]) {
        supplierAttribution[supName] = { name: supName, rawDelivered: 0, attributedWaste: 0 };
      }
      supplierAttribution[supName].rawDelivered += issueQty;
      supplierAttribution[supName].attributedWaste += shareOfWaste;
    }
  }

  return {
    totalRawWasteKg,
    totalRawWasteEgp,
    totalSuppliesWasteEgp,
    grandTotalWasteLoss: totalRawWasteEgp + totalSuppliesWasteEgp,
    suppliersList: Object.values(supplierAttribution),
  };
}
```

---

## 6. نقطة التفتيش والاختبار (Check Point 17)
1. **فحص تطابق أرقام الهالك:**
   - فحص عملية التشغيل PR-2026-001 (خام مدخل 6,000 كجم، ناتج 4,800 كجم، ناتج ثانوي 300 كجم).
   - **النتيجة المطلوبة:** ظهور إجمالي هالك الخام $\mathbf{900\text{ كجم}}$ بنسبة $15\%$، وظهور هالك الكراتين (20 كرتونة تالفة بقيمة 360.00 ج.م).
2. **فحص توزيع الهالك على المزارع:**
   - التأكد من أن "مزارع الوادي" (ساهمت بـ 4,000 كجم من 6,000) ينسب إليها ثلثا الهالك (600 كجم)، و"شركة الخير" ينسب إليها الثلث (300 كجم).
3. **اعتماد واجتياز البوابة الكبرى الثالثة:**
   - باجتياز هذا المايلستون، يكون **🛑 Major Checkpoint 3** قد اكتمل بنجاح 100%!

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] مركز مراقبة الهالك يعرض الفاقد بالوزن والتكلفة المالية.
- [ ] توزيع الهالك على الموردين يحسب رياضياً بدقة.
- [ ] إتمام المرحلة الخامسة كاملة وجاهزية تامة لبدء موديول الشحن والتصدير.
