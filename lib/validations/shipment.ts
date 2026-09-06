import { z } from 'zod';

export const ShipmentSchema = z.object({
  orderId: z.string().min(1, 'يجب اختيار طلبية التصدير'),
  dispatchDate: z.string().optional(),
  containerNo: z.string().min(4, 'رقم الحاوية مطلوب'),
  sealNo: z.string().min(3, 'رقم الختم الجمركي مطلوب'),
  shippingLine: z.string().min(2, 'الخط الملاحي مطلوب'),
  bookingNo: z.string().min(3, 'رقم الحجز الملاحي مطلوب'),
  allocatedBatches: z
    .array(
      z.object({
        fgBatchId: z.string().min(1, 'معرف الباتش مطلوب'),
        qty: z.coerce.number().positive('الكمية المخصصة يجب أن تكون أكبر من 0'),
      })
    )
    .min(1, 'يجب تخصيص باتش واحد على الأقل'),
  costs: z
    .object({
      inlandTrucking: z.coerce.number().min(0).default(6500),
      oceanFreight: z.coerce.number().min(0).default(22000),
      customsClearance: z.coerce.number().min(0).default(4500),
      inspectionCertificates: z.coerce.number().min(0).default(2500),
      portTerminalCharges: z.coerce.number().min(0).default(3500),
    })
    .optional(),
  notes: z.string().optional(),
});

export type ShipmentInput = z.infer<typeof ShipmentSchema>;
export type ShipmentFormValues = z.infer<typeof ShipmentSchema>;
