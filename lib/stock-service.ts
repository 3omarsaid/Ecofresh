import { PrismaClient, Prisma, WarehouseType } from '@prisma/client';

export type TxClient = any;

/**
 * Ensures that a Station has all 3 StockLocation records (RAW, FINISHED, SUPPLIES).
 * Returns a map of WarehouseType to StockLocation ID.
 */
export async function ensureStationLocations(
  tx: TxClient,
  stationId: string,
  stationName: string
) {
  const types: WarehouseType[] = [WarehouseType.RAW, WarehouseType.FINISHED, WarehouseType.SUPPLIES];
  const typeNames: Record<WarehouseType, string> = {
    RAW: `${stationName} - مخزن الخامات`,
    FINISHED: `${stationName} - مخزن المنتج التام`,
    SUPPLIES: `${stationName} - مخزن المستلزمات`,
  };

  const locationsMap: Record<WarehouseType, string> = {
    RAW: '',
    FINISHED: '',
    SUPPLIES: '',
  };

  for (const type of types) {
    let loc = await tx.stockLocation.findUnique({
      where: {
        stationId_type: {
          stationId,
          type,
        },
      },
    });

    if (!loc) {
      loc = await tx.stockLocation.create({
        data: {
          stationId,
          type,
          name: typeNames[type],
        },
      });
    }

    locationsMap[type] = loc.id;
  }

  return locationsMap;
}

/**
 * Retrieves the StockLocation record for a given station & warehouse type.
 */
export async function getStationLocation(
  tx: TxClient,
  stationId: string,
  type: WarehouseType
) {
  const loc = await tx.stockLocation.findUnique({
    where: {
      stationId_type: {
        stationId,
        type,
      },
    },
  });

  if (!loc) {
    const station = await tx.station.findUnique({ where: { id: stationId } });
    if (!station) throw new Error(`المحطة ${stationId} غير موجودة`);
    const locationsMap = await ensureStationLocations(tx, stationId, station.name);
    const locId = locationsMap[type];
    const createdLoc = await tx.stockLocation.findUnique({ where: { id: locId } });
    if (!createdLoc) throw new Error(`فشل إنشاء أو استرجاع المخزن ${type} بالمحطة ${stationId}`);
    return createdLoc;
  }

  return loc;
}

/**
 * Logs an immutable StockMovement record with typed foreign keys.
 */
export async function logStockMovement(
  tx: TxClient,
  params: {
    movementType: string;
    sourceLocationId?: string | null;
    destinationLocationId?: string | null;
    itemType: WarehouseType;
    rawBatchId?: string | null;
    fgBatchId?: string | null;
    supplyId?: string | null;
    qty: number;
    unit: string;
    referenceType?: string | null;
    referenceId?: string | null;
    notes?: string | null;
    createdById?: string | null;
  }
) {
  if (params.qty <= 0) {
    throw new Error('كمية حركة المخزون يجب أن تكون أكبر من الصفر');
  }

  // Enforce itemType foreign key integrity & exactly one reference
  if (params.itemType === WarehouseType.RAW) {
    if (!params.rawBatchId) throw new Error('حركة مخزن الخامات تتطلب معرف اللوط الخام (rawBatchId)');
    if (params.fgBatchId || params.supplyId) throw new Error('حركة مخزن الخامات لا يمكن أن ترتبط بمنتج تام أو مستلزمات');
  } else if (params.itemType === WarehouseType.FINISHED) {
    if (!params.fgBatchId) throw new Error('حركة مخزن المنتج التام تتطلب معرف اللوط التام (fgBatchId)');
    if (params.rawBatchId || params.supplyId) throw new Error('حركة مخزن المنتج التام لا يمكن أن ترتبط بلوط خام أو مستلزمات');
  } else if (params.itemType === WarehouseType.SUPPLIES) {
    if (!params.supplyId) throw new Error('حركة مخزن المستلزمات تتطلب معرف المستلزم (supplyId)');
    if (params.rawBatchId || params.fgBatchId) throw new Error('حركة مخزن المستلزمات لا يمكن أن ترتبط بلوط خام أو منتج تام');
  }

  // Validate source location type if provided
  if (params.sourceLocationId) {
    const srcLoc = await tx.stockLocation.findUnique({ where: { id: params.sourceLocationId } });
    if (srcLoc && srcLoc.type !== params.itemType) {
      throw new Error(`نوع مخزن المصدر (${srcLoc.type}) لا يطابق نوع حركة المخزون (${params.itemType})`);
    }
  }

  // Validate destination location type if provided
  if (params.destinationLocationId) {
    const destLoc = await tx.stockLocation.findUnique({ where: { id: params.destinationLocationId } });
    if (destLoc && destLoc.type !== params.itemType) {
      throw new Error(`نوع مخزن الوجهة (${destLoc.type}) لا يطابق نوع حركة المخزون (${params.itemType})`);
    }
  }

  const todayStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const movementNo = `MOV-${todayStr}-${randomSuffix}`;

  return await tx.stockMovement.create({
    data: {
      movementNo,
      movementType: params.movementType,
      sourceLocationId: params.sourceLocationId || null,
      destinationLocationId: params.destinationLocationId || null,
      itemType: params.itemType,
      rawBatchId: params.itemType === WarehouseType.RAW ? params.rawBatchId : null,
      fgBatchId: params.itemType === WarehouseType.FINISHED ? params.fgBatchId : null,
      supplyId: params.itemType === WarehouseType.SUPPLIES ? params.supplyId : null,
      qty: params.qty,
      unit: params.unit,
      referenceType: params.referenceType || null,
      referenceId: params.referenceId || null,
      notes: params.notes || null,
      createdById: params.createdById || null,
    },
  });
}

/**
 * Atomic stock balance management for StationSupply.
 * Prevents negative stock.
 */
export async function updateStationSupplyStock(
  tx: TxClient,
  locationId: string,
  supplyId: string,
  deltaQty: number // positive for add, negative for deduction
) {
  // Validate that locationId is indeed a SUPPLIES location
  const location = await tx.stockLocation.findUnique({ where: { id: locationId } });
  if (!location || location.type !== WarehouseType.SUPPLIES) {
    throw new Error('الموقع المكون يجب أن يكون من نوع مخزن المستلزمات (SUPPLIES)');
  }

  if (deltaQty < 0) {
    const req = Math.abs(deltaQty);
    const updated = await tx.stationSupply.updateMany({
      where: {
        locationId,
        supplyId,
        stock: { gte: req },
      },
      data: {
        stock: { decrement: req },
      },
    });

    if (updated.count === 0) {
      const current = await tx.stationSupply.findUnique({
        where: { locationId_supplyId: { locationId, supplyId } },
      });
      const supply = await tx.supply.findUnique({ where: { id: supplyId } });
      const name = supply?.name || supplyId;
      const currentQty = current ? Number(current.stock) : 0;
      throw new Error(`رصيد المستلزم "${name}" في هذا المخزن غير كافٍ. المتاح: ${currentQty}، المطلوب: ${req}`);
    }

    return await tx.stationSupply.findUniqueOrThrow({
      where: { locationId_supplyId: { locationId, supplyId } },
    });
  } else if (deltaQty > 0) {
    return await tx.stationSupply.upsert({
      where: {
        locationId_supplyId: { locationId, supplyId },
      },
      update: {
        stock: { increment: deltaQty },
      },
      create: {
        locationId,
        supplyId,
        stock: deltaQty,
      },
    });
  } else {
    return await tx.stationSupply.findUnique({
      where: { locationId_supplyId: { locationId, supplyId } },
    });
  }
}
