import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string().min(2, 'معرف الصنف مطلوب (مثل PRD-05)'),
  code: z.string().min(3, 'كود الصنف التصديري مطلوب (مثل PRD-STW-IQF)'),
  name: z.string().min(3, 'اسم المنتج بالعربية مطلوب'),
  category: z.enum(['فواكه مجمدة', 'خضار مجمد']),
  defaultUnit: z.string().default('KG'),
  standardWastePct: z.coerce.number().min(0).max(100),
  standardYieldPct: z.coerce.number().min(0).max(100),
}).refine((data) => (data.standardWastePct + data.standardYieldPct) <= 100, {
  message: 'مجموع نسبة الهالك ونسبة الإنتاجية لا يمكن أن يتجاوز 100%',
  path: ['standardYieldPct'],
});

export type ProductFormValues = z.infer<typeof ProductSchema>;
