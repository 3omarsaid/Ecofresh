import { z } from 'zod';

export const StationSchema = z.object({
  id: z.string().min(2, 'كود المحطة مطلوب (مثل STN-01)'),
  name: z.string().min(3, 'اسم المحطة مطلوب'),
  location: z.string().min(3, 'الموقع الجغرافي مطلوب'),
  coldStorageCapacityKg: z.coerce
    .number()
    .positive('سعة التخزين يجب أن تكون أكبر من 0'),
  electricityRatePerKg: z.coerce
    .number()
    .min(0, 'سعر الكهرباء لا يمكن أن يكون سالباً')
    .default(2.5),
  supervisorName: z.string().optional(),
  phone: z.string().optional(),
});

export type StationFormValues = z.infer<typeof StationSchema>;
