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

export type TreasuryAccountInput = z.infer<typeof TreasuryAccountSchema>;
