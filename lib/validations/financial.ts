import { z } from 'zod';
import {
  cleanPositiveNumber,
  cleanNonNegativeNumber,
  cleanOptionalPositiveNumber,
} from './common';

export const TransactionSchema = z.object({
  date: z.string().optional(),
  type: z.string().min(1, 'نوع السند مطلوب'),
  partyType: z.string().min(1, 'نوع الجهة مطلوب'),
  partyId: z.string().min(1, 'معرف الجهة مطلوب'),
  partyName: z.string().min(1, 'اسم الجهة مطلوب'),
  amountEgp: cleanPositiveNumber('مبلغ السند يجب أن يكون أكبر من 0'),
  amountCurrency: cleanOptionalPositiveNumber(),
  currency: z.string().optional().default('EGP'),
  refDoc: z.string().optional().nullable(),
  accountId: z.string().min(1, 'يجب اختيار الحساب المالي (البنك / الخزينة)'),
  description: z.string().min(3, 'الوصف والبيان مطلوب'),
});

export const TreasuryTransferSchema = z
  .object({
    date: z.string().optional(),
    sourceAccountId: z.string().min(1, 'يجب تحديد الحساب المالي المصدر'),
    destinationAccountId: z.string().min(1, 'يجب تحديد الحساب المالي المستلم'),
    amountEgp: cleanPositiveNumber('مبلغ التحويل يجب أن يكون أكبر من 0'),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => data.sourceAccountId !== data.destinationAccountId, {
    message: 'لا يمكن التحويل لنفس الحساب المالي',
    path: ['destinationAccountId'],
  });

export const TreasuryAccountSchema = z.object({
  id: z.string().min(2, 'كود الحساب مطلوب (مثل ACC-05)').optional(),
  name: z.string().min(3, 'اسم الحساب أو البنك مطلوب'),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  currency: z.string().default('EGP'),
  balance: cleanNonNegativeNumber('الرصيد الافتتاحي لا يمكن أن يكون سالباً', 0),
  type: z.enum(['حساب بنكي جاري', 'خزينة نقدية']).default('حساب بنكي جاري'),
  stationId: z.string().optional(),
});

// Backward compatibility alias for actions/financials
export const TransferSchema = TreasuryTransferSchema;

export type TransactionFormValues = z.infer<typeof TransactionSchema>;
export type TreasuryTransferFormValues = z.infer<typeof TreasuryTransferSchema>;
export type TransferFormValues = TreasuryTransferFormValues;
export type TreasuryAccountInput = z.infer<typeof TreasuryAccountSchema>;
