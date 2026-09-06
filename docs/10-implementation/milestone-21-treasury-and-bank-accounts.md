# Milestone 21: الخزينة والحسابات البنكية بالعملات (Treasury & Multi-Currency)

> **المرحلة 21 من 26** — ضمن المرحلة الكبرى السابعة: المحاسبة والخزينة والأستاذ العام
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 4**

---

## 1. الهدف الاستراتيجي
بناء موديول إدارة الحسابات المالية للشركة (خزائن نقدية بالمحطات وحسابات بنكية جارية بالعملة المحلية والأجنبية)، ودعم تعدد العملات (EGP و EUR و USD)، ومراقبة السيولة النقدية المتاحة لسداد المزارعين والمقاولين.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - الخزينة والحسابات البنكية: [`base_prototype/pages/treasury.html`](file:///e:/web/exporting_erp/base_prototype/pages/treasury.html)
- **منطق الكود في البروتوتايب:**
  - مصفوفة الحسابات المالية الافتراضية: [`base_prototype/js/state.js` Lines 480-515](file:///e:/web/exporting_erp/base_prototype/js/state.js#L480-L515) (`DEFAULT_TREASURY_ACCOUNTS`).
  - الحسابات الأربعة الأساسية وأرصدتها.

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 01** و **Milestone 02** (الواجهة والـ Auth).

---

## 4. نطاق قاعدة البيانات (Prisma Model Scope)

```prisma
model TreasuryAccount {
  id            String   @id // ACC-01
  name          String
  accountNumber String?  @map("account_number")
  bankName      String?  @map("bank_name")
  currency      String   @default("EGP") // EGP / EUR / USD
  balance       Decimal  @default(0.0) @db.Decimal(15, 2)
  type          String   @default("حساب بنكي جاري") // خزينة نقدية / حساب بنكي جاري
  stationId     String?  @map("station_id")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")

  transactions  FinancialTransaction[]

  @@map("treasury_accounts")
}
```

---

## 5. نطاق الواجهة والمكونات (UI Scope)

### الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/(dashboard)/financials/treasury/
│   ├── page.tsx                      # كروت الحسابات البنكية ومراقبة السيولة
│   └── new/page.tsx                  # نموذج إضافة حساب بنكي جديد
├── components/modules/financials/
│   ├── treasury-card.tsx             # كارت الحساب البنكي برصيده وعملته
│   └── treasury-form.tsx             # نموذج الإدخال مع التحقق
└── lib/validations/treasury.ts       # Zod Schema للحساب
```

### كود الـ Validation بـ Zod (`lib/validations/treasury.ts`):
```ts
import { z } from 'zod';

export const TreasuryAccountSchema = z.object({
  id: z.string().min(2, 'كود الحساب مطلوب (مثل ACC-05)'),
  name: z.string().min(3, 'اسم الحساب أو البنك مطلوب'),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  currency: z.enum(['EGP', 'EUR', 'USD']).default('EGP'),
  balance: z.coerce.number().min(0, 'الرصيد الافتتاحي لا يمكن أن يكون سالباً').default(0),
  type: z.enum(['حساب بنكي جاري', 'خزينة نقدية']).default('حساب بنكي جاري'),
  stationId: z.string().optional(),
});
```

---

## 6. نطاق الـ Server Actions (`actions/treasury.ts`)

```ts
"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { TreasuryAccountSchema } from '@/lib/validations/treasury';

export async function createTreasuryAccount(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_FINANCIALS')) {
    return { success: false, error: 'غير مصرح لك بإضافة حسابات مالية' };
  }

  const validated = TreasuryAccountSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const account = await prisma.treasuryAccount.create({
      data: validated.data,
    });
    revalidatePath('/financials/treasury');
    return { success: true, message: `تم تسجيل الحساب ${account.name} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## 7. نقطة التفتيش والاختبار (Check Point 21)
1. **تسجيل الحسابات الأربعة الأساسية:**
   - بنك QNB الجاري (`ACC-01`): عملة EGP، رصيد افتتاحي `1,450,000.00 ج.م`.
   - بنك CIB حساب العملة الأجنبية (`ACC-02`): عملة EUR، رصيد افتتاحي `85,000.00 EUR`.
   - بنك مصر الجاري (`ACC-03`): عملة EGP، رصيد افتتاحي `620,000.00 ج.م`.
   - الخزينة الرئيسية بمحطة النخيل (`ACC-04`): عملة EGP، رصيد افتتاحي `85,000.00 ج.م`.
2. **التحقق من الواجهة:**
   - فتح صفحة `/financials/treasury` والتأكد من إظهار إجمالي السيولة بالجنيه والسيولة باليورو في كرتين مستقلين.

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] جدول `treasury_accounts` يدعم الحسابات البنكية والخزائن النقدية.
- [ ] دعم حقيقي لتعدد العملات (EGP و EUR).
- [ ] جاهزية الحسابات للربط بسندات القبض والصرف في المايلستون 22.
