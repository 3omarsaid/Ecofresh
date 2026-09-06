"use server";

import { safeRevalidatePath } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { PackagingPurchaseSchema } from '@/lib/validations/purchases';
import { getStationLocation, updateStationSupplyStock, logStockMovement } from '@/lib/stock-service';
import { WarehouseType } from '@prisma/client';

export async function addPackagingPurchase(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_OPERATION')) {
    return { success: false, error: 'غير مصرح لك بتسجيل مشتريات مستلزمات' };
  }

  const validated = PackagingPurchaseSchema.safeParse(payload);
  if (!validated.success) {
    return {
      success: false,
      error: 'بيانات شراء المستلزمات غير صحيحة',
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;
  const totalCost = data.qty * data.unitPrice;
  const pDate = data.date ? new Date(data.date) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve Target Station
      let targetStationId = data.stationId;
      if (!targetStationId) {
        const firstStation = await tx.station.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
        if (!firstStation) throw new Error('لا توجد محطات مسجلة بالمشروع لقيد مشتريات المستلزمات عليها');
        targetStationId = firstStation.id;
      }

      // 2. Resolve SUPPLIES StockLocation for target station
      const suppliesLocation = await getStationLocation(tx, targetStationId, WarehouseType.SUPPLIES);

      // 3. Increment StationSupply stock
      const updatedStationSupply = await updateStationSupplyStock(
        tx,
        suppliesLocation.id,
        data.supplyId,
        data.qty
      );

      // Maintain catalog total for backward compatibility
      const supply = await tx.supply.update({
        where: { id: data.supplyId },
        data: { stock: { increment: data.qty } },
      });

      // 4. Create PackagingPurchase record
      await tx.packagingPurchase.create({
        data: {
          stationId: targetStationId,
          supplyId: data.supplyId,
          supplierId: data.supplierId,
          qty: data.qty,
          unitPrice: data.unitPrice,
          totalCost,
          invoiceNo: data.invoiceNo || null,
        },
      });

      // 5. Log StockMovement audit entry
      await logStockMovement(tx, {
        movementType: 'PURCHASE',
        sourceLocationId: null,
        destinationLocationId: suppliesLocation.id,
        itemType: WarehouseType.SUPPLIES,
        supplyId: data.supplyId,
        qty: data.qty,
        unit: supply.unit,
        referenceType: 'PACKAGING_PURCHASE',
        referenceId: data.invoiceNo || `SUP-PUR-${Date.now().toString().slice(-4)}`,
        notes: `شراء مستلزمات لمخزن المحطة`,
        createdById: user.id,
      });

      // 6. AP Financial Transaction
      const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });
      const { generateTxnId } = await import('@/actions/financials');
      const txnId = await generateTxnId(tx, pDate);

      await tx.financialTransaction.create({
        data: {
          txnId,
          date: pDate,
          type: 'استحقاق توريد مستلزمات (AP)',
          partyType: 'مورد مستلزمات',
          partyId: data.supplierId,
          partyName: supplier?.name || 'مورد مستلزمات',
          amountEgp: totalCost,
          currency: 'EGP',
          refDoc: data.invoiceNo || `SUP-PUR-${Date.now().toString().slice(-4)}`,
          description: `شراء ${data.qty} ${supply.unit} (${supply.name}) بسعر ${data.unitPrice} ج.م`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      return {
        newStationStock: updatedStationSupply.stock,
        totalCost,
        supplyName: supply.name,
        unit: supply.unit,
        supplierId: data.supplierId,
      };
    });

    const { revalidateFinancialImpact } = await import('@/actions/financials');
    await revalidateFinancialImpact('مورد مستلزمات', result.supplierId);
    safeRevalidatePath('/packaging-purchases');
    safeRevalidatePath('/supplies');

    return {
      success: true,
      message: `تم قيد شراء المستلزمات بنجاح ورصيد مخزن المحطة أصبح ${Number(result.newStationStock).toLocaleString()} ${result.unit}`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء قيد شراء المستلزمات' };
  }
}

export async function getSuppliesForPurchaseSelect() {
  try {
    return await prisma.supply.findMany({
      select: { id: true, code: true, name: true, unit: true, stock: true, unitPrice: true, category: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch supplies for purchase select:', error);
    return [];
  }
}

export async function getPackagingSuppliersSelect() {
  try {
    const packagingSuppliers = await prisma.supplier.findMany({
      where: { type: 'PACKAGING' },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    });

    if (packagingSuppliers.length > 0) return packagingSuppliers;

    return await prisma.supplier.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch suppliers for packaging:', error);
    return [];
  }
}
