"use server";

import { safeRevalidatePath } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { DirectDealSchema } from '@/lib/validations/purchases';
import { getStationLocation, logStockMovement } from '@/lib/stock-service';
import { WarehouseType } from '@prisma/client';

export async function addDirectPurchaseDeal(payload: unknown) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, 'CREATE_OPERATION')) {
    return { success: false, error: 'غير مصرح لك بقيد صفقات' };
  }

  const validated = DirectDealSchema.safeParse(payload);
  if (!validated.success) {
    return {
      success: false,
      error: 'بيانات الصفقة غير صحيحة',
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const data = validated.data;
  const totalCost = data.qtyKg * data.purchasePricePerKg + (data.transportCost || 0);
  const costPerKg = totalCost / data.qtyKg;
  const dDate = data.date ? new Date(data.date) : new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Resolve FINISHED StockLocation
      const fgLocation = await getStationLocation(tx, data.stationId, WarehouseType.FINISHED);
      if (!fgLocation) throw new Error('مخزن المنتج التام الخاص بالمحطة غير موجود');

      const dealCount = await tx.directPurchaseDeal.count();
      const dealId = `DEAL-${dDate.getFullYear()}-${String(dealCount + 1).padStart(3, '0')}`;

      const dateStr = dDate.toISOString().substring(0, 10).replace(/-/g, '');
      const fgBatchId = `FG-DIR-${dateStr}-${String(dealCount + 1).padStart(2, '0')}`;

      // 2. Create DirectPurchaseDeal record
      await tx.directPurchaseDeal.create({
        data: {
          dealId,
          date: dDate,
          supplierId: data.supplierId,
          productName: data.productName,
          stationId: data.stationId,
          qtyKg: data.qtyKg,
          packageType: data.packageType,
          packageCount: data.packageCount,
          purchasePricePerKg: data.purchasePricePerKg,
          transportCost: data.transportCost || 0,
          totalCost,
          costPerKg,
          generatedBatchId: fgBatchId,
          invoiceNo: data.invoiceNo,
          notes: data.notes,
        },
      });

      // 3. Create FinishedGoodsBatch linked to fgLocation.id
      const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });

      await tx.finishedGoodsBatch.create({
        data: {
          fgBatchId,
          sourceType: 'DIRECT_PURCHASE',
          dealRef: dealId,
          stationId: data.stationId,
          locationId: fgLocation.id,
          productName: data.productName,
          productionDate: dDate,
          initialQty: data.qtyKg,
          availableQty: data.qtyKg,
          costPerKg,
          totalValue: totalCost,
          suppliersSummary: [{ supplierName: supplier?.name, sharePct: 100 }],
          createdById: user.id,
        },
      });

      // 4. Log StockMovement entry
      await logStockMovement(tx, {
        movementType: 'PURCHASE',
        sourceLocationId: null,
        destinationLocationId: fgLocation.id,
        itemType: WarehouseType.FINISHED,
        fgBatchId,
        qty: data.qtyKg,
        unit: 'KG',
        referenceType: 'DIRECT_PURCHASE',
        referenceId: dealId,
        notes: `صفقة شراء بضاعة جاهزة من المورد (${supplier?.name || 'مورد بضاعة جاهزة'})`,
        createdById: user.id,
      });

      // 5. AP Financial Transaction
      const { generateTxnId } = await import('@/actions/financials');
      const txnId = await generateTxnId(tx, dDate);

      await tx.financialTransaction.create({
        data: {
          txnId,
          date: dDate,
          type: 'استحقاق شراء صفقة جاهزة (AP)',
          partyType: 'مورد جاهز',
          partyId: data.supplierId,
          partyName: supplier?.name || 'مورد بضاعة جاهزة',
          amountEgp: totalCost,
          currency: 'EGP',
          refDoc: dealId,
          description: `استحقاق شراء صفقة بضاعة جاهزة ${data.qtyKg.toLocaleString()} كجم ${data.productName} بالباتش ${fgBatchId}`,
          status: 'معتمد',
          createdById: user.id,
        },
      });

      return { dealId, fgBatchId, totalCost, supplierId: data.supplierId };
    });

    const { revalidateFinancialImpact } = await import('@/actions/financials');
    await revalidateFinancialImpact('مورد جاهز', result.supplierId);
    safeRevalidatePath('/finished-purchases');
    safeRevalidatePath('/inventory');

    return {
      success: true,
      message: `تم قيد الصفقة ${result.dealId} بنجاح وتوليد رمز الباتش الجاهز ${result.fgBatchId} بمخزن المنتج التام!`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'حدث خطأ أثناء قيد الصفقة' };
  }
}

export async function getDirectDeals() {
  try {
    return await prisma.directPurchaseDeal.findMany({
      include: {
        supplier: true,
        station: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  } catch (error) {
    console.error('Failed to fetch direct deals:', error);
    return [];
  }
}

export async function getFinishedGoodsSuppliersSelect() {
  try {
    const finishedSuppliers = await prisma.supplier.findMany({
      where: { type: 'FINISHED_GOODS' },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    });

    if (finishedSuppliers.length > 0) return finishedSuppliers;

    return await prisma.supplier.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch suppliers for finished goods:', error);
    return [];
  }
}

export async function getStationsForSelect() {
  try {
    return await prisma.station.findMany({
      where: { isActive: true },
      select: { id: true, name: true, location: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch stations for select:', error);
    return [];
  }
}
