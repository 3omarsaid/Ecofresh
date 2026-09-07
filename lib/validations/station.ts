import { z } from 'zod';
import { cleanPositiveNumber, cleanNonNegativeNumber } from './common';

export const StationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'اسم المحطة مطلوب'),
  location: z.string().min(3, 'الموقع الجغرافي مطلوب'),
  coldStorageCapacityKg: cleanPositiveNumber('سعة التخزين يجب أن تكون أكبر من 0'),
  electricityRatePerKg: cleanNonNegativeNumber('سعر الكهرباء لا يمكن أن يكون سالباً', 2.5),
  supervisorName: z.string().optional(),
  phone: z.string().optional(),
});

export type StationFormValues = z.infer<typeof StationSchema>;
