# Milestone 23: دفتر الأستاذ العام الموحد وكشوف الحسابات (General Ledger & Statements)

> **المرحلة 23 من 26** — ضمن المرحلة الكبرى السابعة: المحاسبة والخزينة والأستاذ العام
> **بوابة الفحص المرتبطة:** إتمام واعتماد **🛑 Major Checkpoint 4**

---

## 1. الهدف الاستراتيجي
بناء دفتر الأستاذ العام الموحد (Unified General Ledger)، وتجميع كافة القيود المالية الناتجة آلياً من دورات التوريد والتصنيع والشحن وسندات الخزينة، واستخراج كشف الحساب الجاري التراكمي لكل طرف (Running Balance) من عملاء وموردين ومقاولين بدقة محاسبية مطلقة.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - كشف الحسابات العام: [`base_prototype/pages/financial-statements.html`](file:///e:/web/exporting_erp/base_prototype/pages/financial-statements.html)
  - كشف حساب الطرف التفصيلي: [`base_prototype/pages/party-statement.html`](file:///e:/web/exporting_erp/base_prototype/pages/party-statement.html)
- **منطق الحسابات بالبروتوتايب:**
  - معادلة الرصيد التراكمي للطرف: [`base_prototype/js/state.js` Lines 1070-1120](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1070-L1120).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 09** (استحقاقات الخام)، **Milestone 13** (استحقاقات المقاولين)، **Milestone 19** (فواتير التصدير)، و **Milestone 22** (سندات الصرف والتحصيل).

---

## 4. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/financials/
│   ├── page.tsx                      # دفتر الأستاذ العام الموحد بـ 4 تبويبات
│   └── parties/[partyId]/page.tsx    # كشف حساب الطرف التراكمي (مدين، دائن، رصيد)
├── components/modules/financials/
│   ├── general-ledger-table.tsx      # جدول القيود مع فلترة التاريخ والنوع
│   ├── party-summary-cards.tsx       # كروت إجمالي المستحق، المسدد، وصافي الرصيد
│   └── running-statement-table.tsx   # جدول كشف الحساب التراكمي للطرف
└── lib/data/ledger.ts                # استعلامات Prisma التجميعية
```

### التبويبات الأربعة الرئيسية في دفتر الأستاذ:
1. **الكل (All Transactions):** عرض كافة القيود بدون استثناء.
2. **العملاء (AR):** فواتير التصدير وسندات التحصيل البنكية.
3. **موردو الخام والمستلزمات (AP):** استحقاقات التوريد وسندات السداد.
4. **مقاولو العمالة:** استحقاقات أتعاب الفرز والتشغيل وسندات الصرف.

---

## 5. كود استعلام وحساب الرصيد التراكمي للطرف بـ Prisma

```ts
// lib/data/ledger.ts
import { prisma } from '@/lib/prisma';

export async function getPartyStatement(partyId: string) {
  const transactions = await prisma.financialTransaction.findMany({
    where: { partyId },
    orderBy: { date: 'asc' },
  });

  let runningBalance = 0;
  const rows = transactions.map((txn) => {
    const amount = Number(txn.amountEgp);
    let debit = 0;
    let credit = 0;

    // العملاء: الفاتورة مدين (+) والتحصيل دائن (-)
    // الموردون: التوريد دائن (+) والسداد مدين (-)
    if (txn.partyType.includes('عميل')) {
      if (txn.type.includes('استحقاق مبيعات')) {
        debit = amount;
        runningBalance += amount;
      } else {
        credit = amount;
        runningBalance -= amount;
      }
    } else {
      if (txn.type.includes('استحقاق')) {
        credit = amount;
        runningBalance += amount;
      } else {
        debit = amount;
        runningBalance -= amount;
      }
    }

    return {
      txnId: txn.txnId,
      date: txn.date,
      type: txn.type,
      refDoc: txn.refDoc,
      description: txn.description,
      debit,
      credit,
      balance: runningBalance,
    };
  });

  return {
    rows,
    finalBalance: runningBalance,
    totalDebit: rows.reduce((s, r) => s + r.debit, 0),
    totalCredit: rows.reduce((s, r) => s + r.credit, 0),
  };
}
```

---

## 6. نقطة التفتيش والاختبار (Check Point 23)
1. **فحص كشف حساب عميل التصدير (شركة سما - هولندا):**
   - استدعاء كشف حساب شركة سما بعد تسجيل فاتورة الشحنة SHP-2026-001 وسند التحصيل:
     - إجمالي الفواتير (مدين): $\mathbf{393,680.00\text{ ج.م}}$ (و 7,400.00 EUR).
     - إجمالي التحصيلات (دائن): $\mathbf{100,000.00\text{ ج.م}}$.
     - صافي الرصيد المستحق على العميل: $\mathbf{293,680.00\text{ ج.م}}$.
2. **فحص كشف حساب المورد (مزارع الوادي):**
   - استدعاء كشف الحساب وتأكيد تطابق إجمالي استحقاقات وارد الخام مع أرقام اللوطات.
3. **اعتماد واجتياز البوابة الكبرى الرابعة:**
   - باجتياز هذا المايلستون، يكون **🛑 Major Checkpoint 4** قد اكتمل بنجاح 100%!

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] دفتر الأستاذ يعرض القيود مصنفة حسب الأطراف الأربعة.
- [ ] كشف الحساب التراكمي يحسب الرصيد التاريخي سطراً بسطر.
- [ ] الأرصدة الختامية مطابقة تماماً للمستندات التشغيلية.
