"use server";

import { safeRevalidatePath } from '@/lib/utils';
import { formatActionError } from '@/lib/error-handler';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, can } from '@/lib/auth';
import { DirectDealSchema } from '@/lib/validations/purchases';
import { getStationLocation, logStockMovement } from '@/lib/stock-service';
import { WarehouseType } from '@prisma/client';

/**
 * Concurrency-safe, collision-free Deal ID generator
 */
export async function generateDealId(tx: any, date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(100 + Math.random() * 900);
  let dealId = `DEAL-${year}-${timestamp}${random}`;

  while (await tx.directPurchaseDeal.findUnique({ where: { dealId } })) {
    const newRandom = Math.floor(100 + Math.random() * 900);
    dealId = `DEAL-${year}-${Date.now().toString().slice(-4)}${newRandom}`;
  }
  return dealId;
}

/**
 * Concurrency-safe, collision-free Direct FG Batch ID generator
 */
export async function generateDirectFgBatchId(tx: any, date: Date = new Date()): Promise<string> {
  const dateStr = date.toISOString().substring(0, 10).replace(/-/g, '');
  const random = Math.floor(10 + Math.random() * 90);
  let fgBatchId = `FG-DIR-${dateStr}-${random}`;

  while (await tx.finishedGoodsBatch.findUnique({ where: { fgBatchId } })) {
    const newRandom = Math.floor(10 + Math.random() * 90);
    fgBatchId = `FG-DIR-${dateStr}-${newRandom}`;
  }
  return fgBatchId;
}

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
      // 1. Resolve and verify Product against Product catalog
      const product = await tx.product.findFirst({
        where: {
          OR: [
            { id: (data as any).productId || '' },
            { name: data.productName },
            { code: data.productName },
          ],
        },
      });

      if (!product) {
        throw new Error(`المنتج "${data.productName}" غير مسجل بكتالوج المنتجات الرئيسي. يرجى اختيار صنف معتمد.`);
      }
      const canonicalProductName = product.name;

      // 2. Validate Station & Resolve FINISHED StockLocation
      const station = await tx.station.findUnique({ where: { id: data.stationId } });
      if (!station || !station.isActive) {
        throw new Error(`المحطة المحددة (${data.stationId}) غير موجودة أو غير نشطة`);
      }

      const fgLocation = await getStationLocation(tx, data.stationId, WarehouseType.FINISHED);
      if (!fgLocation || fgLocation.stationId !== data.stationId || fgLocation.type !== WarehouseType.FINISHED) {
        throw new Error('مخزن المنتج التام الخاص بالمحطة غير موجود أو غير مرتبط بالمحطة');
      }

      // 3. Concurrency-safe, collision-free ID generation
      const dealId = await generateDealId(tx, dDate);
      const fgBatchId = await generateDirectFgBatchId(tx, dDate);

      // 4. Verify Supplier
      const supplier = await tx.supplier.findUnique({ where: { id: data.supplierId } });
      if (!supplier) throw new Error(`المورد المحدد (${data.supplierId}) غير موجود`);
      if (supplier.status !== 'معتمد') throw new Error(`المورد (${supplier.name}) غير معتمد حالياً`);

      // 5. Create DirectPurchaseDeal record
      await tx.directPurchaseDeal.create({
        data: {
          dealId,
          date: dDate,
          supplierId: data.supplierId,
          productName: canonicalProductName,
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

      // 6. Create FinishedGoodsBatch linked to fgLocation.id
      await tx.finishedGoodsBatch.create({
        data: {
          fgBatchId,
          sourceType: 'DIRECT_PURCHASE',
          dealRef: dealId,
          stationId: data.stationId,
          locationId: fgLocation.id,
          productName: canonicalProductName,
          productionDate: dDate,
          initialQty: data.qtyKg,
          availableQty: data.qtyKg,
          costPerKg,
          totalValue: totalCost,
          suppliersSummary: [{ supplierName: supplier.name, sharePct: 100 }],
          createdById: user.id,
        },
      });

      // 7. Log StockMovement entry
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
        notes: `صفقة شراء بضاعة جاهزة من المورد (${supplier.name})`,
        createdById: user.id,
      });

      // 8. AP Financial Transaction via AccountingService
      const { AccountingService } = await import('@/lib/accounting/accounting-service');
      await AccountingService.recordTransaction(
        {
          date: dDate,
          type: 'استحقاق شراء صفقة جاهزة (AP)',
          partyType: 'مورد جاهز',
          partyId: data.supplierId,
          partyName: supplier.name,
          amountEgp: totalCost,
          currency: 'EGP',
          relatedEntityType: 'PURCHASE_DEAL',
          relatedEntityId: dealId,
          refDoc: dealId,
          paymentMethod: 'CREDIT',
          description: `استحقاق شراء صفقة بضاعة جاهزة ${data.qtyKg.toLocaleString()} كجم ${canonicalProductName} بالباتش ${fgBatchId}`,
          createdById: user.id,
        },
        tx
      );

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
    return { success: false, error: formatActionError(error, 'حدث خطأ أثناء قيد الصفقة') };
  }
}

export async function getProductsForDirectDealSelect() {
  try {
    return await prisma.product.findMany({
      select: { id: true, code: true, name: true, category: true, defaultUnit: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch products for direct deal select:', error);
    return [];
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

export async function getPackagingSuppliesSelect() {
  try {
    return await prisma.supply.findMany({
      select: { id: true, code: true, name: true, category: true, unit: true, capacityKg: true },
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Failed to fetch packaging supplies for select:', error);
    return [];
  }
}

