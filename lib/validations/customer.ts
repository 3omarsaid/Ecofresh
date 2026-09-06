import { z } from 'zod';

export const CustomerSchema = z.object({
  id: z.string().min(2, 'كود العميل مطلوب'),
  code: z.string().min(3, 'كود التعريف مطلوب'),
  name: z.string().min(3, 'اسم شركة العميل مطلوب'),
  country: z.string().min(2, 'الدولة مطلوبة'),
  destinationPort: z.string().min(3, 'ميناء الوصول مطلوب'),
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
  paymentTerms: z.string().min(3, 'شروط الدفع مطلوبة'),
  creditLimit: z.coerce.number().min(0, 'الحد الائتماني يجب ألا يكون سالباً').default(500000),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')).nullable(),
});

export const AgreementSchema = z.object({
  productId: z.string().min(1, 'يجب اختيار المنتج'),
  targetPriceEur: z.coerce.number().positive('السعر يجب أن يكون أكبر من 0'),
  packagingSpec: z.string().min(3, 'مواصفة التعبئة مطلوبة (مثل: كرتونة 10 كجم)'),
});

export type CustomerFormValues = z.infer<typeof CustomerSchema>;
export type AgreementFormValues = z.infer<typeof AgreementSchema>;
