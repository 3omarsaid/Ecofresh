import { z } from 'zod';

export const EmployeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'اسم الموظف مطلوب (3 أحرف على الأقل)'),
  nationalId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().nullable().or(z.literal('')),
  position: z.string().min(2, 'المسمى الوظيفي مطلوب'),
  department: z.string().min(2, 'القسم مطلوب'),
  stationId: z.string().optional().nullable(),
  joiningDate: z.string().optional(),
  employmentType: z.string().default('دوام كامل'),
  basicSalary: z.coerce.number().min(0, 'الراتب الأساسي لا يمكن أن يكون سالباً').default(0),
  allowances: z.coerce.number().min(0, 'البدلات لا يمكن أن تكون سالبة').default(0),
  status: z.string().default('نشط'),
});

export type EmployeeInput = z.infer<typeof EmployeeSchema>;

export const EmployeeTransactionSchema = z.object({
  employeeId: z.string().min(1, 'معرف الموظف مطلوب'),
  date: z.string().optional(),
  type: z.string().min(1, 'نوع الحركة مطلوب'),
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من 0'),
  treasuryAccountId: z.string().optional().nullable(),
  refDoc: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type EmployeeTransactionInput = z.infer<typeof EmployeeTransactionSchema>;