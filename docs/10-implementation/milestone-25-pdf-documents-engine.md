# Milestone 25: محرك توليد الفواتير والوثائق الرسمية PDF (PDF Documents Engine)

> **المرحلة 25 من 26** — ضمن المرحلة الكبرى الثامنة: التقارير الاستراتيجية ومحرك الوثائق
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 5**

---

## 1. الهدف الاستراتيجي
بناء محرك التوليد الآلي للمستندات والوثائق التصديرية الرسمية بصيغة PDF عالية الجودة باستخدام `@react-pdf/renderer` عبر Next.js Route Handlers، وتوليد:
1. **الفاتورة التجارية الدولية (Commercial Export Invoice):** باللغة الإنجليزية والعملة الأجنبية وبيانات الآيبان البنكي (SWIFT / IBAN) للتحصيل.
2. **شهادة التتبع الجمركي وسلسلة التبريد (Customs Traceability & Cold-Chain Certificate):** المعتمدة للإفراج الجمركي بموانئ الاتحاد الأوروبي والخليج.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - أزرار الطباعة في الشحنات: [`base_prototype/pages/shipment-details.html` Lines 25-45](file:///e:/web/exporting_erp/base_prototype/pages/shipment-details.html#L25-L45)
- **القصور المعالج:** في البروتوتايب كان يعتمد على `window.print()` لصفحة الويب العادية؛ والحل الهندسي هو إنشاء مستند PDF رسمي مستقل بجداول وحدود وتوقيعات معتمدة.

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 19** (بيانات الشحنة وفاتورة العميل) و **Milestone 20** (شجرة التتبع).

---

## 4. مسارات وخوادم الـ PDF (Route Handlers Architecture)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/api/export/pdf/
│   ├── invoice/[id]/route.tsx        # Route Handler: تحميل الفاتورة التجارية
│   └── certificate/[id]/route.tsx    # Route Handler: تحميل شهادة التتبع الجمركية
└── components/pdf/
    ├── commercial-invoice-doc.tsx    # قالب React-PDF للفاتورة التجارية
    └── customs-certificate-doc.tsx   # قالب React-PDF لشهادة التتبع
```

---

## 5. كود مسار توليد الفاتورة التجارية (`app/api/export/pdf/invoice/[id]/route.tsx`)

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { prisma } from '@/lib/prisma';
import { CommercialInvoiceDoc } from '@/components/pdf/commercial-invoice-doc';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentId: params.id },
    include: {
      customer: true,
      order: true,
      allocatedBatches: true,
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: 'الشحنة غير موجودة' }, { status: 404 });
  }

  // إنشاء تيار الـ PDF المباشر
  const stream = await renderToStream(
    <CommercialInvoiceDoc shipment={shipment} />
  );

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${shipment.shipmentId}.pdf"`,
    },
  });
}
```

### البنود الإلزامية في قالب الفاتورة التجارية (`commercial-invoice-doc.tsx`):
- **ترويسة المصدر (Exporter):** شركة Nilotic Frost للتجميد والتصدير الزراعي (السجل التجاري، البطاقة الضريبية).
- **بيانات المستورد (Consignee):** اسم الشركة (شركة سما - هولندا)، العنوان، ميناء الوصول (Rotterdam Port).
- **بيانات الرحلة البحرية:** رقم الحاوية (`MSKU-987654-2`)، رقم الختم (`EG-CUS-88210`)، اسم الخط الملاحي (`Maersk`)، ورقم البوليصة/الحجز.
- **جدول البضاعة:** الصنف (Frozen Strawberries IQF Grade A)، الكمية الصافية (4,000.00 KG)، سعر الوحدة (1.85 EUR/KG)، والإجمالي (7,400.00 EUR).
- **البيانات المصرفية للتحصيل:** بنك CIB مصر، كود السويفت (CIBEEGCX)، ورقم الآيبان الدولي باليورو.

---

## 6. نقطة التفتيش والاختبار (Check Point 25)
1. **اختبار تحميل الفاتورة التجارية:**
   - طلب الرابط: `http://localhost:3000/api/export/pdf/invoice/SHP-2026-001`.
   - **النتيجة المطلوبة:** تحميل ملف PDF فوراً وحجمه صالح للعرض.
2. **فحص المحتوى والبيانات المالية:**
   - فتح الملف وتأكيد ظهور القيمة $\mathbf{7,400.00\text{ EUR}}$، وميناء روتردام، وبيانات الحاوية والختم الملاحي بدقة طباعية عالية.

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] محرك React-PDF يولد مستندات صالحة للجمارك والبنوك دون أي خطأ.
- [ ] دعم التنسيق والطباعة بأبعاد A4 القياسية.
- [ ] روابط التنزيل مدمجة في صفحة تفاصيل الشحنة وفي كشف حساب العميل.
