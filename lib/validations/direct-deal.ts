import { z } from 'zod';
import {
  cleanPositiveNumber,
  cleanNonNegativeNumber,
  cleanOptionalNumber,
} from './common';

export const DirectDealSchema = z
  .object({
    supplierId: z.string().min(1, 'يجب اختيار المورد'),
    stationId: z.string().min(1, 'يجب اختيار المحطة المستقبلة'),
    productName: z.string().min(2, 'اسم البضاعة الجاهزة مطلوب (مثل: فراولة مجمدة 10 كجم)'),
    qtyKg: cleanPositiveNumber('الكمية (كجم) يجب أن تكون أكبر من 0'),
    purchasePricePerKg: cleanPositiveNumber('سعر شراء الكيلو يجب أن يكون أكبر من 0'),
    transportCost: cleanNonNegativeNumber('النولون لا يمكن أن يكون سالباً', 0),
    packageType: z.string().optional().nullable(),
    packageCount: z.preprocess(
      (v) => (v === '' ? null : v),
      z.coerce.number().int().min(0).optional().nullable()
    ),
    invoiceNo: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    // Derived fields (optional in input, automatically computed in output)
    totalCost: cleanOptionalNumber(),
    costPerKg: cleanOptionalNumber(),
  })
  .transform((data) => {
    const rawCost = data.qtyKg * data.purchasePricePerKg;
    const totalCost = Math.round((rawCost + (data.transportCost || 0)) * 100) / 100;
    const costPerKg = data.qtyKg > 0 ? Math.round((totalCost / data.qtyKg) * 100) / 100 : 0;

    return {
      ...data,
      totalCost: data.totalCost ?? totalCost,
      costPerKg: data.costPerKg ?? costPerKg,
    };
  });

export type DirectDealFormValues = z.infer<typeof DirectDealSchema>;
export type DirectDealInput = z.input<typeof DirectDealSchema>;
export type DirectDealOutput = z.output<typeof DirectDealSchema>;
