# Milestone 26: تصدير Excel والتسليم النهائي الشامل (Excel Export & Final Handover)

> **المرحلة 26 من 26** — ضمن المرحلة الكبرى الثامنة: التقارير الاستراتيجية ومحرك الوثائق
> **بوابة الفحص المرتبطة:** إتمام واعتماد **🛑 Major Checkpoint 5 (التسليم النهائي)**

---

## 1. الهدف الاستراتيجي
بناء محرك تصدير جداول البيانات والدفاتر المحاسبية إلى صيغة Excel (`.xlsx`) باستخدام مكتبة `xlsx` عبر Next.js Route Handlers، وإجراء اختبار التكامل الشامل من البداية إلى النهاية (End-to-End Test) لكامل الدورة التشغيلية للنظام، والتأكد من نجاح تجميع المشروع الإنتاجي (`next build`) مع تسليم المشروع كاملاً.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - أزرار تصدير Excel في جداول المخزون والماليات: [`base_prototype/pages/inventory.html`](file:///e:/web/exporting_erp/base_prototype/pages/inventory.html) و [`financial-statements.html`](file:///e:/web/exporting_erp/base_prototype/pages/financial-statements.html)

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال كافة المايلستونات من **Milestone 01** حتى **Milestone 25**.

---

## 4. مسارات تصدير جداول الـ Excel (`app/api/export/excel/`)

```tsx
// app/api/export/excel/ledger/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const transactions = await prisma.financialTransaction.findMany({
    orderBy: { date: 'desc' },
  });

  const data = transactions.map((t) => ({
    'رقم القيد': t.txnId,
    'التاريخ': t.date.toISOString().substring(0, 10),
    'نوع الحركة': t.type,
    'نوع الطرف': t.partyType,
    'اسم الطرف': t.partyName,
    'المبلغ بالجنيه': Number(t.amountEgp),
    'المبلغ بالعملة': t.amountCurrency ? Number(t.amountCurrency) : '',
    'العملة': t.currency,
    'المستند المرجعي': t.refDoc,
    'الحساب المالي': t.accountName || '',
    'البيان والشرح': t.description,
    'الحالة': t.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'دفتر الأستاذ العام');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="General-Ledger.xlsx"',
    },
  });
}
```

---

## 5. اختبار التكامل الشامل لكامل الدورة التشغيلية (E2E Integration Test)

يجب على الموديل أو مهندس الجودة تشغيل سيناريو التحقق الشامل التالي بالترتيب للتأكد من ترابط كل أجزاء النظام:

```mermaid
graph TD
    S1["1. ميزان البسكول: استلام 5,000 كجم خام من مزارع الوادي<br/>➔ توليد LOT-RAW-001 وقيد AP للمورد 98,500 ج.م"]
    S2["2. طلبيات التصدير: تسجيل طلبية 10,000 كجم فراولة لشركة سما<br/>➔ سعر 1.85 EUR وتعيين المتبقي 10,000 كجم"]
    S3["3. تدوير وتشغيل: سحب 6,000 كجم خام و 500 كرتونة<br/>➔ إنتاج 4,800 كجم تام بالباتش FG-PR-2026-001 بتكلفة 31.56 ج.م وقيد أتعاب مقاول 9,600 ج.م"]
    S4["4. نقل لوجستي: تحويل 1,000 كجم لمحطة السلام<br/>➔ إذن نقل TRF-2026-001 وتحديث رصيد المحطتين"]
    S5["5. شحن وتصدير: تخصيص 4,000 كجم لطلبية شركة سما بحاوية Maersk<br/>➔ ربح 228,440 ج.م وهامش 58% وفاتورة AR بقيمة 393,680 ج.م"]
    S6["6. حركة خزينة: تحصيل 100,000 ج.م في بنك QNB<br/>➔ زيادة رصيد البنك وانخفاض مديونية العميل لـ 293,680 ج.م"]
    S7["7. وثائق وتصدير: تنزيل فاتورة PDF الرسمية وتصدير شيت الإكسل بنجاح"]

    S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7
```

---

## 6. نقطة التفتيش والاختبار الختامية (Check Point 26)
1. **اختبار تصدير الإكسل:**
   - طلب الرابط `/api/export/excel/ledger` والتأكد من تنزيل ملف `.xlsx` سليم يحتوي على كافة القيود المالية.
2. **اختبار التجميع والإنتاج (Production Build):**
   ```bash
   npm run build
   ```
   - **النتيجة الإلزامية:** خلو كامل من أي خطأ في الـ Typescript أو الـ Linters (`0 errors` و `0 warnings`).
3. **اعتماد واجتياز البوابة الكبرى الخامسة والأخيرة:**
   - باجتياز هذا الفحص، يكون النظام الجديد المبني بـ **Next.js + Prisma + Supabase** قد اكتمل بالكامل بنسبة 100% وجاهزاً للتشغيل الفعلي في الشركة!

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] محرك تصدير Excel يعمل على جداول دفتر الأستاذ والمخزون.
- [ ] الدورة التشغيلية الكاملة (من المزرعة حتى تحصيل الفاتورة) تعمل بسلاسة متناهية وبدون أي ثغرة.
- [ ] اجتياز **🛑 Major Checkpoint 5** واعتماد المشروع النهائي.
