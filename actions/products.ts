"use server";

import { unstable_cache } from 'next/cache';
import { safeRevalidatePath, safeRevalidateTag } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { ProductSchema } from '@/lib/validations/product';
import { generateProductId } from '@/lib/id-generator';

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة منتجات' };
  }

  const validated = ProductSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const generatedId = validated.data.id || (await generateProductId(tx));
      const code = validated.data.code?.trim() || generatedId;

      return await tx.product.create({
        data: {
          ...validated.data,
          id: generatedId,
          code,
        },
      });
    });

    safeRevalidateTag('products');
    safeRevalidatePath('/products');
    return { success: true, message: `تم قيد الصنف ${product.name} بالكود ${product.code} بنجاح` };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'كود المنتج مسجل مسبقاً' };
    }
    return { success: false, error: error.message };
  }
}

export const getProducts = unstable_cache(
  async () => {
    try {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return products.map((p) => ({
        ...p,
        standardWastePct: Number(p.standardWastePct),
        standardYieldPct: Number(p.standardYieldPct),
      }));
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  },
  ['master-products-list'],
  { tags: ['products'], revalidate: 3600 }
);

export async function updateProduct(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بتعديل المنتجات' };
  }

  const validated = ProductSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: validated.data,
    });
    safeRevalidatePath('/products');
    return { success: true, message: `تم تعديل الصنف ${product.name} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تعديل المنتج' };
  }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بحذف المنتجات' };
  }

  try {
    await prisma.product.delete({
      where: { id },
    });
    safeRevalidatePath('/products');
    return { success: true, message: 'تم حذف المنتج بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'لا يمكن حذف المنتج لأنه مرتبط باتفاقيات أو طلبيات قائمة' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف المنتج' };
  }
}

