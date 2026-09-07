import { z } from 'zod';
import { cleanPositiveNumber, cleanNonNegativeNumber, cleanOptionalPositiveNumber } from './common';

export const SupplySchema = z.object({
  id: z.string().optional(),
  code: z.string().optional().or(z.literal('')),
  name: z.string().min(3, 'اسم المستلزم مطلوب'),
  category: z.enum(['كرتونة', 'أكياس', 'بالتات', 'لاصق', 'تغليف']),
  capacityKg: cleanOptionalPositiveNumber(),
  unit: z.string().default('قطعة'),
  stock: cleanNonNegativeNumber('رصيد المخزون لا يمكن أن يكون سالباً', 0),
  unitPrice: cleanPositiveNumber('سعر الوحدة يجب أن يكون أكبر من 0'),
  stationId: z.string().optional(),
});

export type SupplyFormValues = z.infer<typeof SupplySchema>;
