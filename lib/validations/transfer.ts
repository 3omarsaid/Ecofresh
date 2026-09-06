import { z } from 'zod';

export const TransferSchema = z.object({
  fromStationId: z.string().min(1, 'المحطة المصدر مطلوبة'),
  toStationId: z.string().min(1, 'المحطة الوجهة مطلوبة'),
  itemType: z.enum(['RAW', 'FINISHED', 'SUPPLIES']).default('FINISHED'),
  batchId: z.string().optional().nullable(),
  rawBatchId: z.string().optional().nullable(),
  fgBatchId: z.string().optional().nullable(),
  supplyId: z.string().optional().nullable(),
  qtyKg: z.coerce.number().positive('الكمية المنقولة يجب أن تكون أكبر من 0'),
  truckPlate: z.string().min(2, 'رقم لوحة سيارة النقل مطلوب'),
  driverName: z.string().min(2, 'اسم السائق مطلوب'),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine((data) => data.fromStationId !== data.toStationId, {
  message: 'لا يمكن التحويل لنفس المحطة',
  path: ['toStationId'],
});

export type TransferFormValues = z.infer<typeof TransferSchema>;
