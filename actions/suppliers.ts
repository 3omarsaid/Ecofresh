"use server";

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { SupplierSchema } from '@/lib/validations/supplier';

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
    const supplier = await prisma.supplier.create({
      data: validated.data,
    });
    revalidateTag('suppliers');
    revalidatePath('/suppliers');
    return {
      success: true,
      message: `تم تسجيل المورد ${supplier.name} بنجاح`,
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
    revalidateTag('suppliers');
    revalidatePath('/suppliers');
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
    revalidateTag('suppliers');
    revalidatePath('/suppliers');
    return { success: true, message: 'تم حذف المورد بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'لا يمكن حذف المورد لأنه مرتبط بتوريدات سابقة' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف المورد' };
  }
}

