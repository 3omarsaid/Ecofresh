import { z } from 'zod';
import { cleanPositiveNumber } from './common';

export const StockTransferSchema = z
  .object({
    fromStationId: z.string().min(1, 'المحطة المصدر مطلوبة'),
    toStationId: z.string().min(1, 'المحطة الوجهة مطلوبة'),
    itemType: z.enum(['RAW', 'FINISHED', 'SUPPLIES']).default('FINISHED'),
    batchId: z.string().optional(),
    rawBatchId: z.string().optional(),
    fgBatchId: z.string().optional(),
    supplyId: z.string().optional(),
    qtyKg: cleanPositiveNumber('الكمية المنقولة يجب أن تكون أكبر من 0'),
    truckPlate: z.string().optional(),
    driverName: z.string().optional(),
    date: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.fromStationId !== data.toStationId, {
    message: 'لا يمكن التحويل لنفس المحطة',
    path: ['toStationId'],
  })
  .refine(
    (data) => {
      if (data.itemType === 'FINISHED') return Boolean(data.fgBatchId || data.batchId);
      if (data.itemType === 'RAW') return Boolean(data.rawBatchId || data.batchId);
      if (data.itemType === 'SUPPLIES') return Boolean(data.supplyId);
      return true;
    },
    {
      message: 'يجب تحديد اللوط أو الباتش أو المستلزم المنقول بدقة',
      path: ['itemType'],
    }
  );

export const TransferSchema = StockTransferSchema;
export type TransferFormValues = z.infer<typeof StockTransferSchema>;
export type StockTransferFormValues = z.infer<typeof StockTransferSchema>;
export type StockTransferInput = z.input<typeof StockTransferSchema>;
export type StockTransferOutput = z.output<typeof StockTransferSchema>;
