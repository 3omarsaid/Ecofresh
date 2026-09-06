# Milestone 24: مركز التقارير الاستراتيجية (Strategic Reports Hub)

> **المرحلة 24 من 26** — ضمن المرحلة الكبرى الثامنة: التقارير الاستراتيجية ومحرك الوثائق
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 5**

---

## 1. الهدف الاستراتيجي
بناء مركز التقارير والتحليلات الاستراتيجية (Strategic Reports Hub) للربحية ومؤشرات الأداء، ويشمل: تقرير ربحية الشحنات التفصيلي، تقرير كفاءة ومقارنة أداء المحطات، بطاقة جودة الموردين، ومصفوفة أعمار ديون العملاء (AR Aging).

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - مركز التقارير الموحد: [`base_prototype/pages/reports.html`](file:///e:/web/exporting_erp/base_prototype/pages/reports.html)
  - تقرير ربحية الشحنات: [`base_prototype/pages/profitability-report.html`](file:///e:/web/exporting_erp/base_prototype/pages/profitability-report.html)
  - تقرير مراقبة المحطات: [`base_prototype/pages/station-monitoring.html`](file:///e:/web/exporting_erp/base_prototype/pages/station-monitoring.html)
  - تقارير العملاء والموردين: [`customer-report.html`](file:///e:/web/exporting_erp/base_prototype/pages/customer-report.html) و [`supplier-report.html`](file:///e:/web/exporting_erp/base_prototype/pages/supplier-report.html)

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 17** (بيانات الهالك)، **Milestone 19** (الشحنات والربحية)، و **Milestone 23** (دفتر الأستاذ).

---

## 4. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/reports/
│   ├── page.tsx                      # مركز التقارير مع كروت الوصول السريع
│   ├── profitability/page.tsx        # تقرير ربحية الشحنات ومعدلات الهوامش
│   ├── stations/page.tsx             # تقرير مقارنة كفاءة ونسب إشغال المحطات
│   ├── suppliers/page.tsx            # بطاقة أداء وجودة الموردين
│   └── aging/page.tsx                # تقرير أعمار ديون العملاء
├── components/modules/reports/
│   ├── profitability-chart.tsx       # رسم بياني للأرباح مقارنة بالتكاليف (Recharts)
│   ├── stations-benchmark-table.tsx  # جدول مقارنة نسب التصافي واستهلاك الكهرباء
│   └── aging-buckets-card.tsx        # كروت الفترات (0-30 يوم، 31-60 يوم، أكثر من 60 يوم)
└── lib/data/reports.ts               # استعلامات Prisma التحليلية
```

---

## 5. كود استعلام تقرير ربحية الشحنات بـ Prisma

```ts
// lib/data/reports.ts
import { prisma } from '@/lib/prisma';

export async function getShipmentsProfitabilityReport() {
  const shipments = await prisma.shipment.findMany({
    include: { customer: true, order: true },
    orderBy: { dispatchDate: 'desc' },
  });

  const totalRevenue = shipments.reduce((s, sh) => s + Number(sh.grossRevenueEgp), 0);
  const totalCost = shipments.reduce((s, sh) => s + Number(sh.totalShipmentCostEgp), 0);
  const totalProfit = shipments.reduce((s, sh) => s + Number(sh.netProfitEgp), 0);
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    summary: {
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin,
      shipmentsCount: shipments.length,
    },
    shipmentsList: shipments.map((sh) => ({
      shipmentId: sh.shipmentId,
      customerName: sh.customer.name,
      destinationPort: sh.destinationPort,
      containerNo: sh.containerNo,
      shippedQtyKg: Number(sh.shippedQtyKg),
      sellingPriceEur: Number(sh.sellingPriceEur),
      grossRevenueEgp: Number(sh.grossRevenueEgp),
      totalCostEgp: Number(sh.totalShipmentCostEgp),
      netProfitEgp: Number(sh.netProfitEgp),
      marginPercent: Number(sh.marginPercent),
    })),
  };
}
```

---

## 6. نقطة التفتيش والاختبار (Check Point 24)
1. **اختبار تقرير ربحية الشحنات:**
   - فتح صفحة `/reports/profitability` وتأكيد مطابقة الإيرادات والتكاليف وصافي الأرباح مع بيانات الشحنة SHP-2026-001 بنسبة 100%.
2. **اختبار مقارنة أداء المحطات:**
   - فتح `/reports/stations` والتحقق من ظهور متوسط نسبة التصافي وتكلفة الكيلو لكل محطة تجميد.
3. **فحص أعمار الديون:**
   - التأكد من إدراج مديونية شركة سما المتبقية (293,680.00 ج.م) في شريحة "0 إلى 30 يوماً".

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] التقارير الأربعة تستمد بياناتها الحقيقية من قاعدة بيانات Supabase عبر Prisma.
- [ ] الرسوم البيانية التفاعلية تعمل بسلاسة باستخدام Recharts.
- [ ] الأرقام متطابقة محاسبياً وتشغيلياً مع شاشات الإدخال.
