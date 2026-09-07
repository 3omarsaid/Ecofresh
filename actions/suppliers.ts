"use server";

import { unstable_cache } from 'next/cache';
import { safeRevalidatePath, safeRevalidateTag } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { SupplierSchema } from '@/lib/validations/supplier';
import { generateSupplierId } from '@/lib/id-generator';

export async function createSupplier(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة موردين' };
  }

  const rawData = Object.fromEntries(formData);
  const validated = SupplierSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const supplier = await prisma.$transaction(async (tx) => {
      const generatedId = validated.data.id || (await generateSupplierId(tx));
      const code = validated.data.code?.trim() || generatedId;

      return await tx.supplier.create({
        data: {
          ...validated.data,
          id: generatedId,
          code,
        },
      });
    });

    safeRevalidateTag('suppliers');
    safeRevalidatePath('/suppliers');
    return {
      success: true,
      message: `تم تسجيل المورد ${supplier.name} بالكود ${supplier.code} بنجاح`,
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'كود المورد مسجل مسبقاً' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حفظ بيانات المورد' };
  }
}

export const getSuppliers = unstable_cache(
  async () => {
    try {
      return await prisma.supplier.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      return [];
    }
  },
  ['master-suppliers-list'],
  { tags: ['suppliers'], revalidate: 3600 }
);

export async function getSupplierById(id: string) {
  try {
    return await prisma.supplier.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Failed to fetch supplier:', error);
    return null;
  }
}

export async function updateSupplier(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بتعديل الموردين' };
  }

  const rawData = Object.fromEntries(formData);
  const validated = SupplierSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: validated.data,
    });
    safeRevalidateTag('suppliers');
    safeRevalidatePath('/suppliers');
    return { success: true, message: `تم تعديل بيانات المورد ${supplier.name} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تعديل المورد' };
  }
}

export async function deleteSupplier(id: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بحذف الموردين' };
  }

  try {
    await prisma.supplier.delete({
      where: { id },
    });
    safeRevalidateTag('suppliers');
    safeRevalidatePath('/suppliers');
    return { success: true, message: 'تم حذف المورد بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'لا يمكن حذف المورد لأنه مرتبط بتوريدات سابقة' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف المورد' };
  }
}

