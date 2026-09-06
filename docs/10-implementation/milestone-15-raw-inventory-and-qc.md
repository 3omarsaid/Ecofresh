# Milestone 15: مخزن الخام وفحص الجودة (Raw Inventory & QC)

> **المرحلة 15 من 26** — ضمن المرحلة الكبرى الخامسة: المخازن والتتبع اللوجستي والهالك
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 3**

---

## 1. الهدف الاستراتيجي
بناء شاشة مخزن المواد الخام الزراعية، وتتبع الأرصدة المتبقية لكل لوط خام بعد السحب للإنتاج، ومراقبة مؤشرات الجودة ودرجات السكر (Brix °) وبوابات القبول والرفض للوطات الواردة من المزارع.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - مخزن المواد الخام: [`base_prototype/pages/raw-materials.html`](file:///e:/web/exporting_erp/base_prototype/pages/raw-materials.html)
- **منطق الكود في البروتوتايب:**
  - مصفوفة لوطات الخام: [`base_prototype/js/state.js` Lines 145-180](file:///e:/web/exporting_erp/base_prototype/js/state.js#L145-L180) (`rawBatches`).
  - تناقص الرصيد المتاح: [`state.js` Line 812](file:///e:/web/exporting_erp/base_prototype/js/state.js#L812) (`availableQty -= qty`).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 09** (استلام الخام) و **Milestone 13** (سحب الخام للإنتاج).

---

## 4. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/inventory/raw/
│   ├── page.tsx                      # جدول مخزن المواد الخام الزراعية
│   └── [batchId]/page.tsx            # بطاقة اللوط وتقرير فحص الجودة
├── components/modules/inventory/
│   ├── raw-inventory-table.tsx       # جدول اللوطات مع فلاتر المحصول والمحطة
│   └── qc-status-badge.tsx           # شارة فحص الجودة (APPROVED / REJECTED)
└── lib/data/raw-inventory.ts         # استعلامات Prisma لجلب الخام المتاح
```

### أعمدة جدول مخزن الخام:
1. **رقم اللوط:** كود اللوط (مثل `LOT-RAW-20260815-01`).
2. **المحطة الحاضنة:** اسم المحطة المخزن بها اللوط.
3. **المحصول الزراعي:** فراولة خام / مانجو خام / بامية.
4. **المورد / المزرعة:** اسم المزرعة ورقم هاتفها.
5. **الكمية المستلمة الأولية (كجم):** الوزن الصافي عند ميزان البسكول.
6. **الرصيد المتاح حالياً (كجم):** الرصيد المتبقي الصالح للسحب، يقل مع كل تشغيلة إنتاج.
7. **تكلفة الكيلو الموزونة:** بالجنيه شاملاً النولون.
8. **درجة البريكس (Brix):** مؤشر حلاوة وجودة الثمار (مثل `8.5 Brix`).
9. **حالة الجودة (QC):** شارة خضراء `APPROVED` أو حمراء `REJECTED`.
10. **رقم لوحة السيارة:** لتتبع وسيلة النقل مع السائق.

---

## 5. كود استعلام وعرض الصفحة بـ Prisma

```tsx
// app/(dashboard)/inventory/raw/page.tsx
import { prisma } from '@/lib/prisma';
import { RawInventoryTable } from '@/components/modules/inventory/raw-inventory-table';

export default async function RawInventoryPage() {
  const lots = await prisma.rawBatch.findMany({
    where: { availableQty: { gt: 0 } },
    include: { station: true, supplier: true },
    orderBy: { receivedDate: 'desc' },
  });

  const totalRawKg = lots.reduce((sum, l) => sum + Number(l.availableQty), 0);
  const totalValue = lots.reduce((sum, l) => sum + (Number(l.availableQty) * Number(l.unitCost)), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">إجمالي رصيد الخام المتاح في الثلاجات</span>
          <p className="text-2xl font-bold text-[#012d1d] mt-1">{totalRawKg.toLocaleString()} كجم</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">قيمة مخزون الخام التكليفية</span>
          <p className="text-2xl font-bold text-[#0054cd] mt-1">{totalValue.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">عدد اللوطات المفتوحة</span>
          <p className="text-2xl font-bold text-gray-800 mt-1">{lots.length} لوط</p>
        </div>
      </div>

      <RawInventoryTable lots={lots} />
    </div>
  );
}
```

---

## 6. نقطة التفتيش والاختبار (Check Point 15)
1. **التحقق من تناقص الرصيد بعد التشغيل:**
   - فحص اللوط الذي تم سحب 4,000 كجم منه في العملية PR-2026-001 (كان رصيده 8,000 كجم).
   - **النتيجة المطلوبة:** ظهور الرصيد المتاح الحالي $\mathbf{4,000\text{ كجم}}$ بدقة.
2. **التحقق من الفرز والفلاتر:**
   - تصفية الجدول لعرض "لوطات محطة النخيل فقط" وتأكيد عزل لوطات المحطات الأخرى.

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] شاشة مخزن الخام تعرض الأرصدة المتبقية بدقة تامة.
- [ ] الربط متكامل مع بيانات الموردين والمحطات المسجلة في قاعدة البيانات.
- [ ] مؤشر الجودة ودرجة السكر معروضان بوضوح.
