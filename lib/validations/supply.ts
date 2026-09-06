import { z } from 'zod';

export const SupplySchema = z.object({
  id: z.string().min(2, 'كود المستلزم مطلوب (مثل SUP-06)'),
  code: z.string().min(3, 'كود التكويد مطلوب (مثل CTN-EXP-5K)'),
  name: z.string().min(3, 'اسم المستلزم مطلوب'),
  category: z.enum(['كرتونة', 'أكياس', 'بالتات', 'لاصق', 'تغليف']),
  capacityKg: z.coerce.number().positive('السعة يجب أن تكون أكبر من 0').optional().nullable(),
  unit: z.string().default('قطعة'),
  stock: z.coerce.number().min(0, 'رصيد المخزون لا يمكن أن يكون سالباً').default(0),
  unitPrice: z.coerce.number().positive('سعر الوحدة يجب أن يكون أكبر من 0'),
});

export type SupplyFormValues = z.infer<typeof SupplySchema>;
