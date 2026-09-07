import { z } from 'zod';
import { SupplierCategory } from '@prisma/client';

export const SupplierSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional().or(z.literal('')),
  name: z.string().min(3, 'اسم المورد مطلوب'),
  type: z.nativeEnum(SupplierCategory, {
    errorMap: () => ({ message: 'فئة المورد غير صالحة' }),
  }),
  mainProduct: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.string().default('معتمد'),
});

export type SupplierFormValues = z.infer<typeof SupplierSchema>;
