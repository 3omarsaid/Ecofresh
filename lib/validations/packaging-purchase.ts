import { z } from 'zod';
import {
  cleanPositiveNumber,
  cleanPositiveInt,
  cleanOptionalNumber,
} from './common';

export const PackagingPurchaseSchema = z
  .object({
    stationId: z.string().min(1, 'يجب اختيار المحطة المستلمة للمستلزمات'),
    supplyId: z.string().min(1, 'يجب اختيار المستلزم'),
    supplierId: z.string().min(1, 'يجب اختيار المورد'),
    qty: cleanPositiveInt('الكمية يجب أن تكون أكبر من 0'),
    unitPrice: cleanPositiveNumber('سعر الوحدة يجب أن يكون أكبر من 0'),
    invoiceNo: z.string().optional().nullable(),
    date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    // Derived fields (optional in input, automatically computed in output)
    totalCost: cleanOptionalNumber(),
  })
  .transform((data) => {
    const totalCost = Math.round(data.qty * data.unitPrice * 100) / 100;

    return {
      ...data,
      totalCost: data.totalCost ?? totalCost,
    };
  });

export type PackagingPurchaseFormValues = z.infer<typeof PackagingPurchaseSchema>;
export type PackagingPurchaseInput = z.input<typeof PackagingPurchaseSchema>;
export type PackagingPurchaseOutput = z.output<typeof PackagingPurchaseSchema>;
