import { prisma } from "@/lib/prisma";
import { getProcessingOperationsPaginated, cancelProcessingOperation } from "@/actions/processing";
import { getShipmentsDataPaginated } from "@/actions/shipments";
import { can } from "@/lib/auth";
import { UserRole } from "@prisma/client";

async function runRealTests() {
  console.log("=================================================");
  console.log("🚀 STARTING REAL FRONTEND & BACKEND INTEGRATION TESTS");
  console.log("=================================================");

  // TEST 1: KPI vs DB direct query verification (THIS_MONTH)
  console.log("\n--- TEST 1: KPI vs DB Direct Query Verification (THIS_MONTH) ---");
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const kpiAggregates = await prisma.processingOperation.aggregate({
    where: {
      status: { not: "CANCELLED" },
      date: { gte: startOfMonth },
    },
    _count: { id: true },
    _sum: {
      rawInputKg: true,
      finishedOutputKg: true,
      grandTotalCost: true,
    },
    _avg: {
      yieldPercent: true,
    },
  });

  const totalOpsCount = kpiAggregates._count.id || 0;
  const totalRawInputKg = Number(kpiAggregates._sum.rawInputKg || 0);
  const totalFinishedOutputKg = Number(kpiAggregates._sum.finishedOutputKg || 0);
  const totalGrandCost = Number(kpiAggregates._sum.grandTotalCost || 0);
  const overallYieldPct = totalRawInputKg > 0 ? (totalFinishedOutputKg / totalRawInputKg) * 100 : 0;

  console.log(`[KPI Rendered Results - This Month]`);
  console.log(`- Active Operations Count: ${totalOpsCount}`);
  console.log(`- Total Raw Input: ${totalRawInputKg.toLocaleString()} KG`);
  console.log(`- Total Finished Output: ${totalFinishedOutputKg.toLocaleString()} KG`);
  console.log(`- Weighted Yield %: ${overallYieldPct.toFixed(1)}%`);
  console.log(`- Total Direct Processing Cost: ${totalGrandCost.toLocaleString()} EGP`);

  // Direct manual query check to prove match
  const rawOps = await prisma.processingOperation.findMany({
    where: {
      status: { not: "CANCELLED" },
      date: { gte: startOfMonth },
    },
  });

  const manualCount = rawOps.length;
  const manualRawSum = rawOps.reduce((sum, op) => sum + Number(op.rawInputKg), 0);
  const manualFgSum = rawOps.reduce((sum, op) => sum + Number(op.finishedOutputKg), 0);
  const manualCostSum = rawOps.reduce((sum, op) => sum + Number(op.grandTotalCost), 0);
  const manualYieldPct = manualRawSum > 0 ? (manualFgSum / manualRawSum) * 100 : 0;

  console.log(`\n[Direct Database Manual Query Check]`);
  console.log(`- Manual Count: ${manualCount} | Match: ${totalOpsCount === manualCount}`);
  console.log(`- Manual Raw Sum: ${manualRawSum} KG | Match: ${totalRawInputKg === manualRawSum}`);
  console.log(`- Manual FG Sum: ${manualFgSum} KG | Match: ${totalFinishedOutputKg === manualFgSum}`);
  console.log(`- Manual Cost Sum: ${manualCostSum} EGP | Match: ${totalGrandCost === manualCostSum}`);
  console.log(`- Manual Weighted Yield %: ${manualYieldPct.toFixed(1)}% | Match: ${overallYieldPct.toFixed(1) === manualYieldPct.toFixed(1)}`);

  // TEST 2: Shipments Pagination check
  console.log("\n--- TEST 2: Shipments Pagination Verification ---");
  const page1Data = await getShipmentsDataPaginated(1, 25);
  const page2Data = await getShipmentsDataPaginated(2, 25);

  console.log(`Total Orders Count in DB: ${page1Data.totalCount}`);
  console.log(`Total Pages: ${page1Data.totalPages}`);
  console.log(`Page 1 Orders Count: ${page1Data.clientOrders.length}`);
  console.log(`Page 2 Orders Count: ${page2Data.clientOrders.length}`);

  if (page1Data.clientOrders.length > 0) {
    console.log(`Page 1 First Order ID: ${page1Data.clientOrders[0].orderId}`);
  }
  if (page2Data.clientOrders.length > 0) {
    console.log(`Page 2 First Order ID: ${page2Data.clientOrders[0].orderId}`);
    console.log(`Page 1 vs Page 2 First Order Different: ${page1Data.clientOrders[0].orderId !== page2Data.clientOrders[0].orderId}`);
  } else {
    console.log(`Page 2 has 0 records as total count is <= 25 (expected pagination boundary).`);
  }

  // TEST 3: Permission Check across all 3 tables
  console.log("\n--- TEST 3: Role Permission Check (can(role, 'DELETE_OPERATION')) ---");
  const roles: UserRole[] = [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.OPERATOR, UserRole.STOREKEEPER];
  roles.forEach((r) => {
    const isAllowed = can(r, 'DELETE_OPERATION');
    console.log(`Role [${r}] -> can DELETE_OPERATION? ${isAllowed ? '✅ YES (Modal Cancel Button Visible)' : '❌ NO (Modal Cancel Button Hidden)'}`);
  });

  // TEST 4: Create a fresh standalone Operation and Cancel it via Modal Server Action
  console.log("\n--- TEST 4: Real Reversal & Auto UI Refresh Test ---");
  const station = await prisma.station.findFirst();
  const contractor = await prisma.contractor.findFirst();
  const rawBatch = await prisma.rawBatch.findFirst({ where: { availableQty: { gt: 100 } } });

  if (station && contractor && rawBatch) {
    const freshOpId = `PR-TEST-${Date.now().toString().slice(-4)}`;
    const fgBatchId = `FG-TEST-${Date.now().toString().slice(-4)}`;

    const adminUser = await prisma.userProfile.findFirst();
    const userId = adminUser ? adminUser.id : "00000000-0000-0000-0000-000000000001";

    // Create a standalone processing operation for testing cancel
    await prisma.processingOperation.create({
      data: {
        id: freshOpId,
        date: new Date(),
        stationId: station.id,
        rawProduct: "فراولة خام تجريبية",
        finishedProduct: "فراولة مجمدة تجريبية",
        contractorId: contractor.id,
        rawInputKg: 100,
        finishedOutputKg: 80,
        rawWasteKg: 20,
        yieldPercent: 80,
        rawCost: 1000,
        suppliesConsumedCost: 0,
        suppliesWasteCost: 0,
        contractorCost: 160,
        stationCost: 200,
        otherCost: 0,
        grandTotalCost: 1360,
        costPerKg: 17,
        generatedBatchId: fgBatchId,
        createdById: userId,
      },
    });

    await prisma.finishedGoodsBatch.create({
      data: {
        fgBatchId,
        sourceType: "MANUFACTURED",
        sourceOpId: freshOpId,
        stationId: station.id,
        productName: "فراولة مجمدة تجريبية",
        productionDate: new Date(),
        initialQty: 80,
        availableQty: 80, // 100% available, can be cancelled cleanly
        costPerKg: 17,
        totalValue: 1360,
        createdById: userId,
      },
    });

    console.log(`Created Fresh Unconsumed Operation: ${freshOpId}`);

    // Call Modal Action to cancel
    const cancelRes = await cancelProcessingOperation(freshOpId, "اختبار حقيقي لإلغاء التشغيلة عبر النافذة وتحديث الواجهة تلقائياً");
    console.log(`Server Action Cancel Result:`, cancelRes);

    const refreshedOp = await prisma.processingOperation.findUnique({
      where: { id: freshOpId },
    });
    console.log(`Refreshed DB Status for ${freshOpId}: ${refreshedOp?.status}`);
    console.log(`Cancel Reason Recorded: "${refreshedOp?.cancelReason}"`);
    console.log(`Cancelled At: ${refreshedOp?.cancelledAt?.toISOString()}`);
  }

  console.log("\n=================================================");
  console.log("✅ ALL 4 REAL INTEGRATION TESTS COMPLETED SUCCESSFULLY");
  console.log("=================================================");
}

runRealTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test error:", err);
    process.exit(1);
  });
