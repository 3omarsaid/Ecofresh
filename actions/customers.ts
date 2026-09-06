"use server";

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { CustomerSchema, AgreementSchema } from '@/lib/validations/customer';

export async function createCustomer(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة عملاء' };
  }

  const rawData = Object.fromEntries(formData);
  const validated = CustomerSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const customer = await prisma.customer.create({ data: validated.data });
    revalidatePath('/customers');
    return { success: true, message: `تم تسجيل العميل ${customer.name} بنجاح` };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'كود العميل مسجل مسبقاً' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء تسجيل العميل' };
  }
}

export async function addCustomerAgreement(customerId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بإضافة اتفاقيات' };
  }

  const rawData = Object.fromEntries(formData);
  const validated = AgreementSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    await prisma.customerAgreement.create({
      data: {
        customerId,
        productId: validated.data.productId,
        targetPriceEur: validated.data.targetPriceEur,
        packagingSpec: validated.data.packagingSpec,
      },
    });
    revalidatePath(`/customers/${customerId}`);
    return { success: true, message: 'تم حفظ اتفاقية السعر بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'هذا الصنف متعاقد عليه مسبقاً لهذا العميل' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حفظ اتفاقية السعر' };
  }
}

export async function getCustomersPaginated(page: number = 1, pageSize: number = 25, search?: string) {
  try {
    const skip = (page - 1) * pageSize;
    const where: any = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { country: { contains: search, mode: 'insensitive' } },
            { destinationPort: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [customers, totalCount, totalAgreementsCount, currencyStats] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          country: true,
          destinationPort: true,
          currency: true,
          paymentTerms: true,
          creditLimit: true,
          status: true,
          _count: {
            select: { agreements: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
      prisma.customerAgreement.count(),
      prisma.customer.groupBy({
        by: ['currency'],
        _count: { _all: true },
        _sum: { creditLimit: true },
      }),
    ]);

    const eurGroup = currencyStats.find((s) => s.currency === 'EUR');
    const usdGroup = currencyStats.find((s) => s.currency === 'USD');

    const formattedCustomers = customers.map((c) => ({
      ...c,
      creditLimit: Number(c.creditLimit),
      agreements: Array(c._count.agreements).fill({}),
    }));

    return {
      customers: formattedCustomers,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      page,
      pageSize,
      stats: {
        totalCustomers: totalCount,
        eurCount: eurGroup?._count._all || 0,
        usdCount: usdGroup?._count._all || 0,
        totalCreditLimitEur: Number(eurGroup?._sum.creditLimit || 0),
        totalAgreementsCount,
      },
    };
  } catch (error) {
    console.error('Failed to fetch paginated customers:', error);
    return {
      customers: [],
      totalCount: 0,
      totalPages: 0,
      page,
      pageSize,
      stats: {
        totalCustomers: 0,
        eurCount: 0,
        usdCount: 0,
        totalCreditLimitEur: 0,
        totalAgreementsCount: 0,
      },
    };
  }
}

export async function getCustomers() {
  try {
    return await prisma.customer.findMany({
      include: {
        agreements: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return [];
  }
}

export async function getCustomerById(id: string) {
  try {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        agreements: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return null;
  }
}

export async function getProductsForSelect() {
  try {
    return await prisma.product.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error('Failed to fetch products for select:', error);
    return [];
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بتعديل بيانات العملاء' };
  }

  const rawData = Object.fromEntries(formData);
  const validated = CustomerSchema.safeParse(rawData);
  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: validated.data,
    });
    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    return { success: true, message: `تم تعديل بيانات العميل ${customer.name} بنجاح` };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء تعديل بيانات العميل' };
  }
}

export async function deleteCustomer(id: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بحذف العملاء' };
  }

  try {
    await prisma.customer.delete({
      where: { id },
    });
    revalidatePath('/customers');
    return { success: true, message: 'تم حذف العميل بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'لا يمكن حذف العميل لأنه مرتبط بطلبيات شحن أو اتفاقيات سارية' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف العميل' };
  }
}

export async function deleteAgreement(agreementId: number, customerId: string) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'MANAGE_MASTER_DATA')) {
    return { success: false, error: 'غير مصرح لك بحذف الاتفاقيات' };
  }

  try {
    await prisma.customerAgreement.delete({
      where: { id: agreementId },
    });
    revalidatePath(`/customers/${customerId}`);
    return { success: true, message: 'تم حذف الاتفاقية بنجاح' };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف الاتفاقية' };
  }
}

