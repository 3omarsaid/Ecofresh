import { z } from 'zod';

export const ProcessingSchema = z
  .object({
    stationId: z.string().min(1, 'المحطة مطلوبة'),
    contractorId: z.string().min(1, 'المقاول مطلوب'),
    rawProduct: z.string().min(1, 'المحصول الخام مطلوب'),
    finishedProduct: z.string().min(1, 'المنتج النهائي مطلوب'),
    date: z.string().optional(),
    targetRawKg: z.coerce.number().positive('الكمية المطلوبة للخام يجب أن تكون أكبر من 0'),
    rawIssues: z
      .array(
        z.object({
          batchId: z.string().min(1, 'معرف اللوط مطلوب'),
          qty: z.coerce.number().positive('كمية الخام المسحوبة يجب أن تكون أكبر من 0'),
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
          requested: z.coerce.number().positive('الكمية المطلوبة للمستلزم يجب أن تكون أكبر من 0'),
          consumed: z.coerce.number().min(0, 'المستهلك السليم لا يمكن أن يكون سالباً'),
          waste: z.coerce.number().min(0, 'الهالك لا يمكن أن يكون سالباً').default(0),
          unitCost: z.coerce.number().min(0, 'سعر الوحدة لا يمكن أن يكون سالباً'),
        })
      )
      .default([])
      .refine(
        (items) => {
          const ids = items.map((i) => i.supplyId);
          return new Set(ids).size === ids.length;
        },
        { message: 'لا يمكن تكرار نفس المستلزم أكثر من مرة في نفس العملية' }
      )
      .refine(
        (items) => {
          return items.every((i) => Math.abs((Number(i.consumed || 0) + Number(i.waste || 0)) - Number(i.requested)) < 0.001);
        },
        { message: 'إجمالي المنصرف (السليم + الهالك) يجب أن يطابق تماماً الكمية المطلوبة لكل مستلزم' }
      ),
    finishedOutputKg: z.coerce.number().min(0, 'الكمية الخارجة لا يمكن أن تكون سالبة'),
    secondaryOutputKg: z.coerce.number().min(0).default(0),
    otherCost: z.coerce.number().min(0).default(0),
    notes: z.string().optional(),
    idempotencyKey: z.string().optional(),
  })
  .refine(
    (data) => {
      const totalRawInput = data.rawIssues.reduce((sum, issue) => sum + Number(issue.qty || 0), 0);
      return Math.abs(totalRawInput - Number(data.targetRawKg)) < 0.001;
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
  );

export type ProcessingFormValues = z.infer<typeof ProcessingSchema>;
