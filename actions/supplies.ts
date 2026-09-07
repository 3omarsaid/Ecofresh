"use server";

import { safeRevalidatePath, safeRevalidateTag } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { SupplySchema } from '@/lib/validations/supply';
import { generateSupplyId } from '@/lib/id-generator';
import { getStationLocation, updateStationSupplyStock, logStockMovement } from '@/lib/stock-service';
import { WarehouseType } from '@prisma/client';

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
    const supply = await prisma.$transaction(async (tx) => {
      const generatedId = validated.data.id || (await generateSupplyId(tx));
      const code = validated.data.code?.trim() || generatedId;
      const { stationId, ...supplyData } = validated.data;

      const createdSupply = await tx.supply.create({
        data: {
          ...supplyData,
          id: generatedId,
          code,
        },
      });

      const initialStock = Number(createdSupply.stock);
      if (initialStock > 0) {
        let targetStationId = stationId;
        if (!targetStationId) {
          const firstStation = await tx.station.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          });
          if (firstStation) {
            targetStationId = firstStation.id;
          }
        }

        if (targetStationId) {
          const suppliesLocation = await getStationLocation(tx, targetStationId, WarehouseType.SUPPLIES);
          await updateStationSupplyStock(tx, suppliesLocation.id, createdSupply.id, initialStock);

          await logStockMovement(tx, {
            movementType: 'OPENING_BALANCE',
            sourceLocationId: null,
            destinationLocationId: suppliesLocation.id,
            itemType: WarehouseType.SUPPLIES,
            supplyId: createdSupply.id,
            qty: initialStock,
            unit: createdSupply.unit,
            referenceType: 'INITIAL_STOCK',
            referenceId: createdSupply.id,
            notes: `رصيد افتتاحي عند قيد المستلزم بالدليل`,
            createdById: user.id,
          });
        }
      }

      return createdSupply;
    });

    safeRevalidateTag('supplies');
    safeRevalidatePath('/supplies');
    safeRevalidatePath('/stations');
    safeRevalidatePath('/inventory');
    return {
      success: true,
      message: `تم قيد الكتالوج للمستلزم ${supply.name} بالكود ${supply.code} بنجاح`,
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
    safeRevalidatePath('/supplies');
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
    safeRevalidatePath('/supplies');
    return { success: true, message: 'تم حذف المستلزم بنجاح' };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { success: false, error: 'لا يمكن حذف المستلزم لأنه مرتبط بحركات صرف أو شراء سابقة' };
    }
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف المستلزم' };
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
    console.error('Failed to fetch stations for supplies:', error);
    return [];
  }
}

