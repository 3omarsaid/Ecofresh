# Milestone 14: مخزن المنتج التام وشجرة التتبع (Finished Goods Inventory & DNA)

> **المرحلة 14 من 26** — ضمن المرحلة الكبرى الخامسة: المخازن والتتبع اللوجستي والهالك
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 3**

---

## 1. الهدف الاستراتيجي
بناء شاشة مخزن المنتج التام الجاهز للشحن (Finished Goods Warehouse)، وعرض اللوطات الجاهزة المصنعة (`FG-PR-`) وتلك القادمة من صفقات بضاعة مباشرة (`FG-DIR-`)، مع التكلفة الموزونة للكيلو ورصيد المخزون، والتمثيل البصري لنسب مساهمة المزارع بالباتش (DNA Traceability).

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - مخزن الجاهز: [`base_prototype/pages/inventory.html` Lines 120-400](file:///e:/web/exporting_erp/base_prototype/pages/inventory.html#L120-L400)
- **منطق الكود في البروتوتايب:**
  - مصفوفة باتشات الجاهز: [`base_prototype/js/state.js` Lines 355-400](file:///e:/web/exporting_erp/base_prototype/js/state.js#L355-L400) (`finishedGoodsBatches`).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 10** (صفقات الجاهز) و **Milestone 13** (إنتاج الباتشات المصنعة).

---

## 4. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/inventory/
│   ├── page.tsx                      # شاشة مخزن الجاهز الرئيسية مع كروت الإجماليات
│   └── [batchId]/page.tsx            # تفاصيل الباتش وشجرة مصادره
├── components/modules/inventory/
│   ├── fg-batch-table.tsx            # جدول الباتشات مع الفرز والبحث الحي
│   └── batch-dna-badge.tsx           # شارة بصرية تعرض نسب مساهمة المزارع
└── lib/data/inventory.ts             # دوال جلب رصيد المخزن المتاح عبر Prisma
```

### أعمدة جدول باتشات الجاهز (`fg-batch-table.tsx`):
1. **كود الباتش:** نص عريض (رابط لصفحة التفاصيل).
2. **نوع المصدر:** شارة ملونة: `إنتاج محلي` (أخضر) أو `صفقة مباشرة` (أزرق).
3. **المحطة والموقع:** اسم المحطة الحاضنة للرصيد.
4. **الصنف التصديري:** فراولة مجمدة IQF / مانجو مكعبات.
5. **تاريخ الإنتاج والصلاحية:** YYYY-MM-DD.
6. **الرصيد المتاح (كجم):** خط عريض يمثل الكمية الصالحة للشحن الفوري.
7. **تكلفة الكيلو الموزونة:** بالجنيه المصري (مثل `31.56 ج.م/كجم`).
8. **إجمالي قيمة الباتش:** بالجنيه ($\text{availableQty} \times \text{costPerKg}$).
9. **شجرة الموردين (DNA):** شارات منسقة بنسب مئوية (مثل: *"مزارع الوادي: 66.7% - شركة الخير: 33.3%"*).

---

## 5. كود جلب البيانات عبر Prisma Server Component

```tsx
// app/(dashboard)/inventory/page.tsx
import { prisma } from '@/lib/prisma';
import { FgBatchTable } from '@/components/modules/inventory/fg-batch-table';

export default async function InventoryPage() {
  const batches = await prisma.finishedGoodsBatch.findMany({
    where: { availableQty: { gt: 0 } },
    include: { station: true },
    orderBy: { productionDate: 'desc' },
  });

  const totalQtyKg = batches.reduce((sum, b) => sum + Number(b.availableQty), 0);
  const totalValueEgp = batches.reduce((sum, b) => sum + Number(b.totalValue), 0);

  return (
    <div className="space-y-6">
      {/* كروت الملخص السريع */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">إجمالي رصيد الجاهز المتاح</span>
          <p className="text-2xl font-bold text-[#012d1d] mt-1">{totalQtyKg.toLocaleString()} كجم</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">إجمالي القيمة التكليفية للمخزون</span>
          <p className="text-2xl font-bold text-[#0054cd] mt-1">{totalValueEgp.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">عدد الباتشات الصالحة للشحن</span>
          <p className="text-2xl font-bold text-gray-800 mt-1">{batches.length} باتش</p>
        </div>
      </div>

      <FgBatchTable batches={batches} />
    </div>
  );
}
```

---

## 6. نقطة التفتيش والاختبار (Check Point 14)
1. **التحقق من قائمة الباتشات:**
   - فتح صفحة `/inventory` والتأكد من ظهور الباتش المصنع `FG-PR-2026-001` برصيد 4,800 كجم وتكلفة 31.56 ج.م.
   - التأكد من ظهور باتش الصفقة `FG-DIR-` برصيد 5,000 كجم.
2. **فحص شارات الـ DNA:**
   - التأكد من أن شارة الموردين للباتش المصنع تظهر نسبتي مساهمة المزرعتين بدقة.

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] شاشة مخزن الجاهز تعرض البيانات الحقيقية من جدول `finished_goods_batches`.
- [ ] كروت الإحصائيات تحسب إجمالي الكميات والقيمة تلقائياً عبر Prisma.
- [ ] شجرة الموردين لكل باتش تظهر بوضوح وبنسب مئوية صحيحة.
