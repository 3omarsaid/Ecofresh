import { z } from 'zod';
import {
  cleanPositiveNumber,
  cleanNonNegativeNumber,
  cleanOptionalNumber,
} from './common';

export const BaseShipmentSchema = z.object({
  orderId: z.string().min(1, 'يجب اختيار طلبية التصدير'),
  dispatchDate: z.string().optional(),
  containerNo: z.string().min(4, 'رقم الحاوية مطلوب'),
  sealNo: z.string().min(3, 'رقم الختم الجمركي مطلوب'),
  shippingLine: z.string().min(2, 'الخط الملاحي مطلوب'),
  bookingNo: z.string().optional().default(''),
  allocatedBatches: z
    .array(
      z.object({
        fgBatchId: z.string().min(1, 'معرف الباتش مطلوب'),
        qty: cleanPositiveNumber('الكمية المخصصة يجب أن تكون أكبر من 0'),
      })
    )
    .min(1, 'يجب تخصيص باتش واحد على الأقل'),
  costs: z
    .object({
      inlandTrucking: cleanNonNegativeNumber('تكلفة النقل الداخلي لا يمكن أن تكون سالبة', 6500),
      oceanFreight: cleanNonNegativeNumber('تكلفة الشحن البحري لا يمكن أن تكون سالبة', 22000),
      customsClearance: cleanNonNegativeNumber('تكلفة التخليص الجمركي لا يمكن أن تكون سالبة', 4500),
      inspectionCertificates: cleanNonNegativeNumber('تكلفة شهادات الفحص لا يمكن أن تكون سالبة', 2500),
      portTerminalCharges: cleanNonNegativeNumber('رسوم الميناء لا يمكن أن تكون سالبة', 3500),
    })
    .optional()
    .default({
      inlandTrucking: 6500,
      oceanFreight: 22000,
      customsClearance: 4500,
      inspectionCertificates: 2500,
      portTerminalCharges: 3500,
    }),
  notes: z.string().optional(),
  // Optional derived fields
  shippedQtyKg: cleanOptionalNumber(),
  totalShipmentCostEgp: cleanOptionalNumber(),
});

export const ShipmentSchema = BaseShipmentSchema.transform((data) => {
  const shippedQtyKg = data.allocatedBatches.reduce((sum, item) => sum + item.qty, 0);

  return {
    ...data,
    shippedQtyKg: data.shippedQtyKg ?? shippedQtyKg,
  };
});

export type ShipmentFormValues = z.infer<typeof BaseShipmentSchema>;
export type ShipmentInput = z.input<typeof ShipmentSchema>;
export type ShipmentOutput = z.output<typeof ShipmentSchema>;
