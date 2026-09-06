import fs from 'fs';
import path from 'path';
import { PrismaClient, WarehouseType } from '@prisma/client';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('=== STARTING STOCK LOCATIONS MIGRATION ===');

  const stationsBefore = await prisma.station.findMany({ where: { isActive: true } });
  console.log(`Found ${stationsBefore.length} active stations.`);

  // 1. Provision 3 StockLocations per station (idempotently)
  let createdLocationsCount = 0;
  for (const station of stationsBefore) {
    const locationConfigs: Array<{ type: WarehouseType; name: string }> = [
      { type: WarehouseType.RAW, name: `${station.name} - مخزن الخامات` },
      { type: WarehouseType.FINISHED, name: `${station.name} - مخزن المنتج التام` },
      { type: WarehouseType.SUPPLIES, name: `${station.name} - مخزن المستلزمات` },
    ];

    for (const config of locationConfigs) {
      const existing = await prisma.stockLocation.findUnique({
        where: {
          stationId_type: {
            stationId: station.id,
            type: config.type,
          },
        },
      });

      if (!existing) {
        await prisma.stockLocation.create({
          data: {
            stationId: station.id,
            type: config.type,
            name: config.name,
          },
        });
        createdLocationsCount++;
      }
    }
  }
  console.log(`Provisioned ${createdLocationsCount} new StockLocation records.`);

  // 2. Migrate RawBatches -> RAW StockLocation
  const rawBatches = await prisma.rawBatch.findMany();
  let migratedRawBatches = 0;
  for (const batch of rawBatches) {
    const rawLocation = await prisma.stockLocation.findUnique({
      where: {
        stationId_type: {
          stationId: batch.stationId,
          type: WarehouseType.RAW,
        },
      },
    });

    if (rawLocation && batch.locationId !== rawLocation.id) {
      await prisma.rawBatch.update({
        where: { batchId: batch.batchId },
        data: { locationId: rawLocation.id },
      });
      migratedRawBatches++;
    }
  }
  console.log(`Migrated ${migratedRawBatches} RawBatch records to RAW locations.`);

  // 3. Migrate FinishedGoodsBatches -> FINISHED StockLocation
  const fgBatches = await prisma.finishedGoodsBatch.findMany();
  let migratedFgBatches = 0;
  for (const batch of fgBatches) {
    const fgLocation = await prisma.stockLocation.findUnique({
      where: {
        stationId_type: {
          stationId: batch.stationId,
          type: WarehouseType.FINISHED,
        },
      },
    });

    if (fgLocation && batch.locationId !== fgLocation.id) {
      await prisma.finishedGoodsBatch.update({
        where: { fgBatchId: batch.fgBatchId },
        data: { locationId: fgLocation.id },
      });
      migratedFgBatches++;
    }
  }
  console.log(`Migrated ${migratedFgBatches} FinishedGoodsBatch records to FINISHED locations.`);

  // 4. Migrate Supply stock -> Primary Station SUPPLIES Location
  const primaryStation = stationsBefore.find((s) => s.id === 'STN-01') || stationsBefore[0];
  if (!primaryStation) {
    throw new Error('No active station found to migrate supply stock into.');
  }

  const primarySuppliesLocation = await prisma.stockLocation.findUnique({
    where: {
      stationId_type: {
        stationId: primaryStation.id,
        type: WarehouseType.SUPPLIES,
      },
    },
  });

  if (!primarySuppliesLocation) {
    throw new Error('Primary supplies location not found.');
  }

  const supplies = await prisma.supply.findMany();
  let migratedSupplies = 0;
  let totalMigratedSupplyQty = 0;

  for (const sup of supplies) {
    const existingStationSupply = await prisma.stationSupply.findUnique({
      where: {
        locationId_supplyId: {
          locationId: primarySuppliesLocation.id,
          supplyId: sup.id,
        },
      },
    });

    const stockQty = Number(sup.stock);

    if (!existingStationSupply) {
      await prisma.stationSupply.create({
        data: {
          locationId: primarySuppliesLocation.id,
          supplyId: sup.id,
          stock: stockQty,
        },
      });
      migratedSupplies++;
      totalMigratedSupplyQty += stockQty;
    } else {
      totalMigratedSupplyQty += Number(existingStationSupply.stock);
    }
  }

  console.log(`Migrated ${migratedSupplies} Supply stock balances into Station '${primaryStation.name}' SUPPLIES location.`);
  console.log(`Total Migrated Supply Quantity: ${totalMigratedSupplyQty}`);

  // 5. Verification & Summary Report
  const locationsTotal = await prisma.stockLocation.count();
  const stationSuppliesTotal = await prisma.stationSupply.count();
  const rawBatchesWithoutLocation = await prisma.rawBatch.count({ where: { locationId: null } });
  const fgBatchesWithoutLocation = await prisma.finishedGoodsBatch.count({ where: { locationId: null } });

  console.log('\n=== MIGRATION VERIFICATION SUMMARY ===');
  console.log(`- Total Stations: ${stationsBefore.length}`);
  console.log(`- Total StockLocations (Expected ${stationsBefore.length * 3}): ${locationsTotal}`);
  console.log(`- Total StationSupply Records: ${stationSuppliesTotal}`);
  console.log(`- Unmigrated RawBatches: ${rawBatchesWithoutLocation}`);
  console.log(`- Unmigrated FinishedGoodsBatches: ${fgBatchesWithoutLocation}`);

  if (rawBatchesWithoutLocation > 0 || fgBatchesWithoutLocation > 0) {
    console.error('ERROR: Unmigrated batches found!');
    process.exit(1);
  }

  console.log('=== MIGRATION COMPLETED SUCCESSFULLY ===');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
