import { z } from 'zod';

export const ContractorSchema = z.object({
  id: z.string().min(2, 'كود المقاول مطلوب (مثل CONT-001)'),
  name: z.string().min(3, 'اسم المقاول مطلوب'),
  tariffRatePerKg: z.coerce.number().positive('تعريفة الكيلو يجب أن تكون أكبر من 0').default(2.0),
  stationId: z.string().min(1, 'يجب ربط المقاول بمحطة عمل'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
});

export type ContractorInput = z.infer<typeof ContractorSchema>;
