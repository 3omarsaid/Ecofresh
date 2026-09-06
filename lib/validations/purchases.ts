import { z } from 'zod';

export const PackagingPurchaseSchema = z.object({
  stationId: z.string().optional().nullable(),
  supplyId: z.string().min(1, 'يجب اختيار المستلزم'),
  supplierId: z.string().min(1, 'يجب اختيار المورد'),
  qty: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0'),
  unitPrice: z.coerce.number().positive('سعر الوحدة يجب أن يكون أكبر من 0'),
  invoiceNo: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const DirectDealSchema = z.object({
  supplierId: z.string().min(1, 'يجب اختيار المورد'),
  stationId: z.string().min(1, 'يجب اختيار المحطة المستقبلة'),
  productName: z.string().min(2, 'اسم البضاعة الجاهزة مطلوب (مثل: فراولة مجمدة 10 كجم)'),
  qtyKg: z.coerce.number().positive('الكمية (كجم) يجب أن تكون أكبر من 0'),
  purchasePricePerKg: z.coerce.number().positive('سعر شراء الكيلو يجب أن يكون أكبر من 0'),
  transportCost: z.coerce.number().min(0, 'النولون لا يمكن أن يكون سالباً').default(0),
  packageType: z.string().optional().nullable(),
  packageCount: z.coerce.number().optional().nullable(),
  invoiceNo: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type PackagingPurchaseFormValues = z.infer<typeof PackagingPurchaseSchema>;
export type DirectDealFormValues = z.infer<typeof DirectDealSchema>;
