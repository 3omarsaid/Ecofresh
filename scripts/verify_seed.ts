import { prisma } from '../lib/prisma';

async function main() {
  console.log('=== VERIFYING SEED DATA & ROW COUNTS ===');
  const counts = {
    users: await prisma.userProfile.count(),
    stations: await prisma.station.count(),
    contractors: await prisma.contractor.count(),
    products: await prisma.product.count(),
    supplies: await prisma.supply.count(),
    suppliers: await prisma.supplier.count(),
    customers: await prisma.customer.count(),
    agreements: await prisma.customerAgreement.count(),
    rawBatches: await prisma.rawBatch.count(),
    packagingPurchases: await prisma.packagingPurchase.count(),
    directDeals: await prisma.directPurchaseDeal.count(),
    clientOrders: await prisma.clientOrder.count(),
    operations: await prisma.processingOperation.count(),
    fgBatches: await prisma.finishedGoodsBatch.count(),
    shipments: await prisma.shipment.count(),
    transfers: await prisma.stockTransfer.count(),
    transactions: await prisma.financialTransaction.count(),
    treasuries: await prisma.treasuryAccount.count(),
  };

  for (const [table, count] of Object.entries(counts)) {
    console.log(`Table ${table.padEnd(20)}: ${count} rows`);
  }

  // Relational integrity check
  console.log('\n=== RELATIONAL INTEGRITY CHECK ===');
  const rawBatchesWithoutSupplier = await prisma.rawBatch.count({ where: { supplierId: '' } });
  console.log('RawBatches missing supplierId:', rawBatchesWithoutSupplier);

  const clientOrdersWithoutCustomer = await prisma.clientOrder.count({ where: { customerId: '' } });
  console.log('ClientOrders missing customerId:', clientOrdersWithoutCustomer);

  console.log('Seed Data Verification Completed Successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
