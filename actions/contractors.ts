"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { ContractorSchema } from '@/lib/validations/contractor';

export async function createContractor(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة مقاولين' };
  }

  const rawData = Object.fromEntries(formData);
  const validated = ContractorSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const contractor = await prisma.contractor.create({
      data: validated.data,
      include: { station: true },
    });
    revalidatePath('/contractors');
    return {
      success: true,
      message: `تم تسجيل المقاول ${contractor.name} بتعريفة ${contractor.tariffRatePerKg} ج.م/كجم`,
    };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'محطة العمل المحددة غير موجودة' };
    }
    if (error.code === 'P2002') {
      return { success: false, error: 'كود المقاول مسجل مسبقاً' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حفظ بيانات المقاول' };
  }
}

export async function getContractors() {
  try {
    const contractors = await prisma.contractor.findMany({
      include: {
        station: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return contractors.map((c) => ({
      ...c,
      tariffRatePerKg: Number(c.tariffRatePerKg),
      station: c.station ? {
        ...c.station,
        electricityRatePerKg: Number(c.station.electricityRatePerKg),
      } : null,
    }));
  } catch (error) {
    console.error('Failed to fetch contractors:', error);
    return [];
  }
}

export async function getStationsForSelect() {
  try {
    return await prisma.station.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        location: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error('Failed to fetch stations:', error);
    return [];
  }
}

export async function updateContractor(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بتعديل المقاولين' };
  }

  const rawData = Object.fromEntries(formData);
  const validated = ContractorSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const contractor = await prisma.contractor.update({
      where: { id },
      data: validated.data,
      include: { station: true },
    });
    revalidatePath('/contractors');
    return { success: true, message: `تم تعديل بيانات المقاول ${contractor.name} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تعديل المقاول' };
  }
}

export async function deleteContractor(id: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بحذف المقاولين' };
  }

  try {
    await prisma.contractor.delete({
      where: { id },
    });
    revalidatePath('/contractors');
    return { success: true, message: 'تم حذف المقاول بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'لا يمكن حذف المقاول لأنه مرتبط بعمليات تصنيع سابقة' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف المقاول' };
  }
}

