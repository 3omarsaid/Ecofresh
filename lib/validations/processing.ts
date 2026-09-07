import { z } from 'zod';
import {
  cleanPositiveNumber,
  cleanNonNegativeNumber,
  cleanOptionalPositiveNumber,
  cleanOptionalNumber,
} from './common';

export const BaseProcessingSchema = z.object({
  stationId: z.string().min(1, 'المحطة مطلوبة'),
  contractorId: z.string().min(1, 'المقاول مطلوب'),
  rawProduct: z.string().min(1, 'المحصول الخام مطلوب'),
  finishedProduct: z.string().min(1, 'المنتج النهائي مطلوب'),
  date: z.string().optional(),
  // targetRawKg is optional; if omitted, automatically derived from rawIssues sum
  targetRawKg: cleanOptionalPositiveNumber(),
  rawIssues: z
    .array(
      z.object({
        batchId: z.string().min(1, 'معرف اللوط مطلوب'),
        qty: cleanPositiveNumber('كمية الخام المسحوبة يجب أن تكون أكبر من 0'),
      })
    )
    .min(1, 'يجب سحب لوط خام واحد على الأقل')
    .refine(
      (items) => {
        const ids = items.map((i) => i.batchId);
        return new Set(ids).size === ids.length;
      },
      { message: 'لا يمكن تكرار نفس اللوط أكثر من مرة في نفس العملية' }
    ),
  suppliesIssues: z
    .array(
      z.object({
        supplyId: z.string().min(1, 'المستلزم مطلوب'),
        // requested defaults to 0 and is auto-derived from consumed + waste if left 0
        requested: cleanNonNegativeNumber('الكمية المطلوبة للمستلزم لا يمكن أن تكون سالبة', 0),
        consumed: cleanNonNegativeNumber('المستهلك السليم لا يمكن أن يكون سالباً', 0),
        waste: cleanNonNegativeNumber('الهالك لا يمكن أن يكون سالباً', 0),
        unitCost: cleanNonNegativeNumber('سعر الوحدة لا يمكن أن يكون سالباً', 0),
      })
    )
    .default([])
    .refine(
      (items) => {
        const ids = items.map((i) => i.supplyId);
        return new Set(ids).size === ids.length;
      },
      { message: 'لا يمكن تكرار نفس المستلزم أكثر من مرة في نفس العملية' }
    ),
  finishedOutputKg: cleanNonNegativeNumber('الكمية الخارجة لا يمكن أن تكون سالبة', 0),
  secondaryOutputKg: cleanNonNegativeNumber('الكمية الثانوية لا يمكن أن تكون سالبة', 0),
  otherCost: cleanNonNegativeNumber('التكاليف الأخرى لا يمكن أن تكون سالبة', 0),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
  // Derived fields (optional in input and form state)
  rawWasteKg: cleanOptionalNumber(),
  yieldPercent: cleanOptionalNumber(),
});

export const ProcessingSchema = BaseProcessingSchema
  .refine(
    (data) => {
      const totalRawInput = data.rawIssues.reduce((sum, issue) => sum + Number(issue.qty || 0), 0);
      if (data.targetRawKg !== undefined && data.targetRawKg !== null) {
        return Math.abs(totalRawInput - Number(data.targetRawKg)) < 0.001;
      }
      return totalRawInput > 0;
    },
    {
      message: 'إجمالي الكمية المسحوبة من اللوطات يجب أن يطابق تماماً الكمية المطلوبة للخام',
      path: ['rawIssues'],
    }
  )
  .refine(
    (data) => {
      const totalRawInput = data.rawIssues.reduce((sum, issue) => sum + Number(issue.qty || 0), 0);
      return totalRawInput > 0;
    },
    {
      message: 'إجمالي الكمية الداخلة يجب أن يكون أكبر من 0',
      path: ['rawIssues'],
    }
  )
  .refine(
    (data) => {
      const totalRawInput = data.rawIssues.reduce((sum, issue) => sum + Number(issue.qty || 0), 0);
      return data.finishedOutputKg <= totalRawInput;
    },
    {
      message: 'الكمية الخارجة لا يمكن أن تكون أكبر من الكمية الداخلة',
      path: ['finishedOutputKg'],
    }
  )
  .transform((data) => {
    const totalRawInput = data.rawIssues.reduce((sum, issue) => sum + Number(issue.qty || 0), 0);
    const targetRawKg = data.targetRawKg ?? totalRawInput;

    const suppliesIssues = data.suppliesIssues.map((item) => {
      const computedTotal = Math.round((Number(item.consumed || 0) + Number(item.waste || 0)) * 100) / 100;
      return {
        ...item,
        requested: item.requested > 0 ? item.requested : computedTotal,
      };
    });

    const rawWasteKg = Math.max(0, Math.round((totalRawInput - data.finishedOutputKg - data.secondaryOutputKg) * 100) / 100);
    const yieldPercent = totalRawInput > 0 ? Math.round((data.finishedOutputKg / totalRawInput) * 10000) / 100 : 0;

    return {
      ...data,
      targetRawKg,
      suppliesIssues,
      rawWasteKg,
      yieldPercent,
    };
  });

export type ProcessingFormValues = z.infer<typeof BaseProcessingSchema>;
export type ProcessingInput = z.input<typeof ProcessingSchema>;
export type ProcessingOutput = z.output<typeof ProcessingSchema>;
