import { z } from 'zod';

export const RawArrivalSchema = z.object({
  stationId: z.string().min(1, 'يجب اختيار المحطة المستلمة'),
  supplierId: z.string().min(1, 'يجب اختيار المورد أو المزرعة'),
  rawProduct: z.string().min(2, 'اسم الخام الزراعي مطلوب (مثل: فراولة خام)'),
  grossQtyKg: z.coerce.number().positive('الوزن القائم يجب أن يكون أكبر من 0'),
  tareQtyKg: z.coerce.number().min(0, 'وزن السيارات الفارغة لا يمكن أن يكون سالباً').default(0),
  unitPriceEgp: z.coerce.number().positive('سعر شراء الكيلو يجب أن يكون أكبر من 0'),
  transportCostEgp: z.coerce.number().min(0).default(0),
  receivedDate: z.string().optional().nullable(),
  brixDegree: z.coerce.number().min(0).max(100).optional().nullable(),
  truckPlate: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => data.grossQtyKg > data.tareQtyKg, {
  message: 'الوزن القائم يجب أن يكون أكبر من وزن السيارات الفارغة (الفارغ)',
  path: ['grossQtyKg'],
});

export type RawArrivalFormValues = z.infer<typeof RawArrivalSchema>;
