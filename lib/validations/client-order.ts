import { z } from 'zod';

export const ClientOrderSchema = z.object({
  customerId: z.string().min(1, 'يجب اختيار العميل'),
  productName: z.string().min(1, 'يجب اختيار المنتج التصديري'),
  packagingSpec: z.string().min(1, 'مواصفة التعبئة مطلوبة'),
  orderedQtyKg: z.coerce.number().positive('الكمية المطلوبة يجب أن تكون أكبر من 0'),
  unitPriceEur: z.coerce.number().positive('سعر البيع باليورو مطلوب'),
  fxRate: z.coerce.number().positive('سعر الصرف مطلوب').default(53.20),
  deliveryTerms: z.string().default('FOB - ميناء الإسكندرية'),
  targetShipDate: z.string().optional().nullable(),
  destinationPort: z.string().min(1, 'ميناء الوصول مطلوب'),
  notes: z.string().optional().nullable(),
});

export type ClientOrderFormValues = z.infer<typeof ClientOrderSchema>;
