import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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
  console.log('--- DB INSPECTION START ---');
  const stationsCount = await prisma.station.count();
  const rawBatchesCount = await prisma.rawBatch.count();
  const finishedBatchesCount = await prisma.finishedGoodsBatch.count();
  const suppliesCount = await prisma.supply.count();
  const stockTransfersCount = await prisma.stockTransfer.count();
  const packagingPurchasesCount = await prisma.packagingPurchase.count();
  const processingOperationsCount = await prisma.processingOperation.count();

  const stations = await prisma.station.findMany({ select: { id: true, name: true } });
  const supplies = await prisma.supply.findMany({ select: { id: true, code: true, name: true, stock: true } });

  const totalGlobalSupplyStock = supplies.reduce((acc, s) => acc + Number(s.stock), 0);

  console.log(JSON.stringify({
    stationsCount,
    rawBatchesCount,
    finishedBatchesCount,
    suppliesCount,
    stockTransfersCount,
    packagingPurchasesCount,
    processingOperationsCount,
    totalGlobalSupplyStock,
    stations,
    suppliesSummary: supplies.slice(0, 10),
  }, null, 2));

  console.log('--- DB INSPECTION END ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
