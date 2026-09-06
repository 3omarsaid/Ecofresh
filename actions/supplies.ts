"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { SupplySchema } from '@/lib/validations/supply';

export async function createSupply(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة مستلزمات' };
  }

  const rawData = Object.fromEntries(formData);
  if (rawData.capacityKg === "" || rawData.capacityKg === "null") {
    delete rawData.capacityKg;
  }

  const validated = SupplySchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const supply = await prisma.supply.create({
      data: validated.data,
    });
    revalidatePath('/supplies');
    return {
      success: true,
      message: `تم قيد الكتالوج للمستلزم ${supply.name} بنجاح`,
    };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'كود المستلزم مسجل مسبقاً' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حفظ المستلزم' };
  }
}

export async function getSupplies() {
  try {
    return await prisma.supply.findMany({
      include: {
        stationSupplies: {
          include: {
            location: {
              include: {
                station: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Failed to fetch supplies:', error);
    return [];
  }
}

export async function getSupplyById(id: string) {
  try {
    return await prisma.supply.findUnique({
      where: { id },
      include: {
        stationSupplies: {
          include: {
            location: {
              include: {
                station: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch supply:', error);
    return null;
  }
}

export async function updateSupply(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بتعديل المستلزمات' };
  }

  const rawData = Object.fromEntries(formData);
  if (rawData.capacityKg === "" || rawData.capacityKg === "null") {
    delete rawData.capacityKg;
  }

  const validated = SupplySchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const supply = await prisma.supply.update({
      where: { id },
      data: validated.data,
    });
    revalidatePath('/supplies');
    return { success: true, message: `تم تعديل بيانات المستلزم ${supply.name} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تعديل المستلزم' };
  }
}

export async function deleteSupply(id: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بحذف المستلزمات' };
  }

  try {
    await prisma.supply.delete({
      where: { id },
    });
    revalidatePath('/supplies');
    return { success: true, message: 'تم حذف المستلزم بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'لا يمكن حذف المستلزم لأنه مرتبط بحركات صرف أو شراء سابقة' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف المستلزم' };
  }
}
