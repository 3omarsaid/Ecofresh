"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { ClientOrderSchema } from '@/lib/validations/client-order';

export async function addClientOrder(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بتسجيل طلبيات عملاء' };
  }

  const validated = ClientOrderSchema.safeParse(payload);
  if (!validated.success) {
    return {
      success: false,
      error: 'بيانات الطلبية غير صحيحة',
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;
  const count = await prisma.clientOrder.count();
  const orderId = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

  try {
    const order = await prisma.clientOrder.create({
      data: {
        orderId,
        customerId: data.customerId,
        productName: data.productName,
        packagingSpec: data.packagingSpec,
        orderedQtyKg: data.orderedQtyKg,
        unfulfilledQtyKg: data.orderedQtyKg,
        unitPriceEur: data.unitPriceEur,
        fxRate: data.fxRate,
        deliveryTerms: data.deliveryTerms,
        targetShipDate: data.targetShipDate ? new Date(data.targetShipDate) : null,
        destinationPort: data.destinationPort,
        status: 'جديدة',
        notes: data.notes,
        createdById: user.id,
      },
      include: { customer: true },
    });

    revalidatePath('/client-orders');
    return {
      success: true,
      message: `تم تسجيل الطلبية ${order.orderId} للعميل ${order.customer.name} بنجاح`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تسجيل الطلبية' };
  }
}

export async function getClientOrders() {
  try {
    return await prisma.clientOrder.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Failed to fetch client orders:', error);
    return [];
  }
}

export async function getCustomerAgreementsSelect(customerId: string) {
  try {
    const agreements = await prisma.customerAgreement.findMany({
      where: { customerId },
      include: {
        product: true,
        customer: true,
      },
    });
    return agreements;
  } catch (error) {
    console.error('Failed to fetch customer agreements:', error);
    return [];
  }
}

export async function getCustomersForOrderSelect() {
  try {
    return await prisma.customer.findMany({
      where: { status: 'نشط' },
      select: {
        id: true,
        code: true,
        name: true,
        country: true,
        destinationPort: true,
        currency: true,
        agreements: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch customers for select:', error);
    return [];
  }
}

export async function updateClientOrderStatus(orderId: string, status: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بتعديل حالة الطلبيات' };
  }

  try {
    const order = await prisma.clientOrder.update({
      where: { orderId },
      data: { status },
    });
    revalidatePath('/client-orders');
    return { success: true, message: `تم تحديث حالة الطلبية ${order.orderId} إلى ${status}` };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تحديث حالة الطلبية' };
  }
}

export async function deleteClientOrder(orderId: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بحذف الطلبيات' };
  }

  try {
    await prisma.clientOrder.delete({
      where: { orderId },
    });
    revalidatePath('/client-orders');
    return { success: true, message: 'تم حذف الطلبية بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'لا يمكن حذف الطلبية لكونها مرتبطة بشحنات تصدير قائمة' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف الطلبية' };
  }
}

