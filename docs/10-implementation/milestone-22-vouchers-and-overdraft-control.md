# Milestone 22: سندات القبض والصرف ومنع السحب المكشوف (Vouchers & Overdraft)

> **المرحلة 22 من 26** — ضمن المرحلة الكبرى السابعة: المحاسبة والخزينة والأستاذ العام
> **بوابة الفحص المرتبطة:** جزء رئيسي من **🛑 Major Checkpoint 4**

---

## 1. الهدف الاستراتيجي
بناء محرك سندات القبض (تحصيلات العملاء) وسندات الصرف (سداد المزارعين والمقاولين والموردين ومصروفات التشغيل)، وتحديث رصيد الحساب البنكي أو الخزينة المحددة، مع تطبيق سياسة المنع الصارم للسحب على المكشوف (Overdraft Protection) لمنع تحول رصيد البنك أو الخزينة إلى السالب.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - نافذة إضافة سند مالي: [`base_prototype/pages/financial-statements.html` Lines 750-840](file:///e:/web/exporting_erp/base_prototype/pages/financial-statements.html#L750-L840)
  - سجل السندات: [`base_prototype/pages/financial-transactions.html`](file:///e:/web/exporting_erp/base_prototype/pages/financial-transactions.html)
- **منطق الكود في البروتوتايب:**
  - دالة قيد السند المالي: [`base_prototype/js/state.js` Lines 1040-1120](file:///e:/web/exporting_erp/base_prototype/js/state.js#L1040-L1120) (`addFinancialTransaction()`).
  - **المشكلة المعالجة:** في البروتوتايب القديم كان السداد يخصم من الحساب مباشرة دون فحص (`account.balance -= amount`) حتى لو كان الرصيد صفراً.

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 21** (حسابات الخزينة والبنوك).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
model FinancialTransaction {
  txnId          String   @id @map("txn_id") // TXN-2026-001
  date           DateTime @default(now()) @db.Date
  type           String // استحقاق مبيعات تصدير (AR) / استحقاق توريد خام (AP) / سداد مورد / تحصيل عميل
  partyType      String   @map("party_type") // عميل تصدير / مورد خام / مقاول عمالة
  partyId        String   @map("party_id")
  partyName      String   @map("party_name")
  amountEgp      Decimal  @map("amount_egp") @db.Decimal(15, 2)
  amountCurrency Decimal? @map("amount_currency") @db.Decimal(15, 2)
  currency       String   @default("EGP")
  refDoc         String?  @map("ref_doc") // SHP-2026-001 / LOT-RAW-001 / PR-2026-001
  accountId      String?  @map("account_id")
  accountName    String?  @map("account_name")
  description    String
  status         String   @default("معتمد")
  createdById    String?  @map("created_by") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")

  account        TreasuryAccount? @relation(fields: [accountId], references: [id])
  createdBy      UserProfile?     @relation("TxnCreatedBy", fields: [createdById], references: [id])

  @@map("financial_transactions")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/financials/transactions/
│   ├── page.tsx                      # سجل حركات وسندات القبض والصرف
│   └── new/page.tsx                  # نموذج إصدار سند دفع أو قبض
├── components/modules/financials/
│   ├── voucher-form.tsx              # نموذج السند مع التحقق من الرصيد اللحظي
│   └── transactions-table.tsx        # جدول السندات مع الفلاتر المحاسبية
└── lib/validations/transaction.ts    # Zod Schema للسند
```

---

## 6. كود الـ Server Action بـ Prisma Transaction (`actions/financials.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { TransactionSchema } from '@/lib/validations/transaction';

export async function addFinancialTransaction(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_FINANCIALS')) {
    return { success: false, error: 'غير مصرح لك بقيد سندات مالية' };
  }

  const validated = TransactionSchema.safeParse(payload);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;
  const txnDate = data.date ? new Date(data.date) : new Date();
  const isCollection = data.type.includes('تحصيل') || data.type.includes('Inflow');

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. فحص وقفل الحساب البنكي
      const account = await tx.treasuryAccount.findUnique({
        where: { id: data.accountId },
      });

      if (!account) throw new Error(`الحساب المالي ${data.accountId} غير موجود`);

      const currentBalance = Number(account.balance);

      // 2. التحقق الصارم من الرصيد الكافي (منع السحب على المكشوف)
      if (!isCollection && currentBalance < data.amountEgp) {
        throw new Error(`رصيد الحساب ${account.name} (${currentBalance.toLocaleString()} ج.م) لا يكفي لسداد ${data.amountEgp.toLocaleString()} ج.م`);
      }

      // 3. تحديث رصيد الحساب المالي
      const newBalance = isCollection
        ? currentBalance + data.amountEgp
        : currentBalance - data.amountEgp;

      await tx.treasuryAccount.update({
        where: { id: data.accountId },
        data: {
          balance: isCollection
            ? { increment: data.amountEgp }
            : { decrement: data.amountEgp },
        },
      });

      // 4. توليد كود القيد المالي
      const txnCount = await tx.financialTransaction.count();
      const txnId = `TXN-${txnDate.getFullYear()}-${String(txnCount + 1).padStart(3, '0')}`;

      // 5. إدراج القيد في دفتر الأستاذ
      await tx.financialTransaction.create({
        data: {
          txnId,
          date: txnDate,
          type: data.type,
          partyType: data.partyType,
          partyId: data.partyId,
          partyName: data.partyName,
          amountEgp: data.amountEgp,
          amountCurrency: data.amountCurrency || null,
          currency: data.currency || 'EGP',
          refDoc: data.refDoc || 'سند مالي يدوي',
          accountId: data.accountId,
          accountName: account.name,
          description: data.description,
          status: 'مسدد',
          createdById: user.id,
        },
      });

      return { txnId, newBalance, accountName: account.name };
    });

    revalidatePath('/financials');
    revalidatePath('/financials/transactions');
    revalidatePath('/financials/treasury');

    return {
      success: true,
      data: result,
      message: `تم بنجاح قيد السند ${result.txnId} وتحديث رصيد ${result.accountName} ليصبح ${result.newBalance.toLocaleString()} ج.م`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 22)
1. **اختبار قيد تحصيل دفعة من عميل:**
   - تسجيل سند تحصيل دفعة بقيمة `100,000.00 ج.م` من شركة سما على حساب بنك QNB (رصيده 1,450,000 ج.م).
   - **النتيجة المطلوبة:** نجاح العملية، وارتفاع رصيد بنك QNB إلى $\mathbf{1,550,000.00\text{ ج.م}}$، وانخفاض مديونية العميل.
2. **اختبار الحماية ضد السحب على المكشوف (Overdraft Protection):**
   - محاولة صرف مبلغ `2,000,000.00 ج.م` من نفس الحساب.
   - **النتيجة المطلوبة:** فشل العملية وتراجع Prisma التام مع ظهور رسالة خطأ صريحة: *"رصيد الحساب بنك QNB لا يكفي لسداد المبلغ"*.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] سندات القبض والصرف تزيد وتنقص رصيد الحساب المالي بدقة ذرية.
- [ ] الحماية ضد السحب المكشوف تمنع خروج أي مليم لا يتوفر في الحساب.
- [ ] السند يربط بالطرف والوثيقة المرجعية في جدول `financial_transactions`.
