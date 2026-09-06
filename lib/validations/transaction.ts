import { z } from 'zod';

export const TransactionSchema = z.object({
  date: z.string().optional(),
  type: z.string().min(1, 'نوع السند مطلوب'),
  partyType: z.string().min(1, 'نوع الجهة مطلوب'),
  partyId: z.string().min(1, 'معرف الجهة مطلوب'),
  partyName: z.string().min(1, 'اسم الجهة مطلوب'),
  amountEgp: z.coerce.number().positive('مبلغ السند يجب أن يكون أكبر من 0'),
  amountCurrency: z.coerce.number().optional().nullable(),
  currency: z.string().optional().default('EGP'),
  refDoc: z.string().optional().nullable(),
  accountId: z.string().min(1, 'يجب اختيار الحساب المالي (البنك / الخزينة)'),
  description: z.string().min(3, 'الوصف والبيان مطلوب'),
});

export type TransactionFormValues = z.infer<typeof TransactionSchema>;

export const TransferSchema = z.object({
  date: z.string().optional(),
  sourceAccountId: z.string().min(1, 'يجب تحديد الحساب المالي المصدر'),
  destinationAccountId: z.string().min(1, 'يجب تحديد الحساب المالي المستلم'),
  amountEgp: z.coerce.number().positive('مبلغ التحويل يجب أن يكون أكبر من 0'),
  notes: z.string().optional(),
}).refine(data => data.sourceAccountId !== data.destinationAccountId, {
  message: 'لا يمكن التحويل لنفس الحساب المالي',
  path: ['destinationAccountId'],
});

export type TransferFormValues = z.infer<typeof TransferSchema>;

