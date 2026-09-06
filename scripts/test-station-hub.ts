import { prisma } from '../lib/prisma';
import { 
  getStations, 
  getStationControlCenterData, 
  getLotTraceability, 
  createStationStockAdjustment 
} from '../actions/stations';
import { WarehouseType } from '@prisma/client';

async function runStationHubTestSuite() {
  console.log('=================================================================');
  console.log('       STATION CONTROL CENTER & TRACEABILITY HUB TEST SUITE      ');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Test getStations()
    console.log('\n--- 1. Testing getStations() Enriched Summary Metrics ---');
    const stations = await getStations();
    assert(Array.isArray(stations) && stations.length > 0, 'getStations returns non-empty array of stations');
    
    const firstStation = stations[0];
    assert(typeof (firstStation as any).rawStockKg === 'number', 'Station summary contains numeric rawStockKg');
    assert(typeof (firstStation as any).fgStockKg === 'number', 'Station summary contains numeric fgStockKg');
    assert(typeof (firstStation as any).suppliesStockQty === 'number', 'Station summary contains numeric suppliesStockQty');
    assert(typeof (firstStation as any).distinctProductsCount === 'number', 'Station summary contains distinctProductsCount');
    assert(typeof (firstStation as any).alertsCount === 'number', 'Station summary contains calculated alertsCount');
    console.log(`  Sample Station: ${firstStation.name} (${firstStation.id}) | Raw: ${(firstStation as any).rawStockKg}kg, FG: ${(firstStation as any).fgStockKg}kg, Supplies: ${(firstStation as any).suppliesStockQty}, Alerts: ${(firstStation as any).alertsCount}`);

    // 2. Test getStationControlCenterData()
    console.log('\n--- 2. Testing getStationControlCenterData(stationId) ---');
    const targetStationId = firstStation.id;
    const centerRes = await getStationControlCenterData(targetStationId);
    assert(centerRes.success === true, 'getStationControlCenterData succeeds for valid stationId');
    assert(!!centerRes.data?.station, 'Returns station entity');
    assert(!!centerRes.data?.inventory, 'Returns aggregated inventory');
    assert(Array.isArray(centerRes.data?.operations), 'Returns operations list');
    assert(Array.isArray(centerRes.data?.stockMovements), 'Returns stock movements ledger');
    assert(Array.isArray(centerRes.data?.transfers), 'Returns transfers history');
    assert(Array.isArray(centerRes.data?.adjustments), 'Returns adjustments records');
    assert(Array.isArray(centerRes.data?.auditLogs), 'Returns audit logs');
    assert(!!centerRes.data?.reconciliation, 'Returns ledger reconciliation report');
    assert(['RECONCILED', 'MISMATCH'].includes(centerRes.data?.reconciliation.status as string), 'Reconciliation status is valid');
    console.log(`  Ledger Status: ${centerRes.data?.reconciliation.status} | Checked items: ${centerRes.data?.reconciliation.items.length}, Mismatches: ${centerRes.data?.reconciliation.totalMismatchCount}`);

    // 3. Test Bidirectional Traceability
    console.log('\n--- 3. Testing Bidirectional Lot Traceability ---');
    // Find an active RawBatch to test Forward Traceability
    const sampleRaw = await prisma.rawBatch.findFirst({
      where: { stationId: targetStationId },
      include: { supplier: true },
    });

    if (sampleRaw) {
      console.log(`  Testing Forward Trace on Raw Batch: ${sampleRaw.batchId}`);
      const rawTrace = await getLotTraceability(sampleRaw.batchId);
      assert(rawTrace.success === true, 'Forward trace on raw batch succeeds');
      assert(rawTrace.lotType === 'RAW', 'Identifies lotType as RAW');
      assert(rawTrace.supplier?.name !== undefined, 'Resolves origin supplier');
      assert(Array.isArray(rawTrace.downstreamOperations), 'Resolves downstreamOperations consuming this batch');
      assert(Array.isArray(rawTrace.transfers), 'Resolves transfers for this batch');
    } else {
      console.log('  ⚠️ No raw batch at station to test; searching globally...');
      const globalRaw = await prisma.rawBatch.findFirst();
      if (globalRaw) {
        const rawTrace = await getLotTraceability(globalRaw.batchId);
        assert(rawTrace.success === true, 'Forward trace on global raw batch succeeds');
        assert(rawTrace.lotType === 'RAW', 'Identifies lotType as RAW');
      }
    }

    // Find an active FG Batch to test Backward Traceability
    const sampleFg = await prisma.finishedGoodsBatch.findFirst({
      where: { stationId: targetStationId },
    });

    if (sampleFg) {
      console.log(`  Testing Backward Trace on FG Batch: ${sampleFg.fgBatchId}`);
      const fgTrace = await getLotTraceability(sampleFg.fgBatchId);
      assert(fgTrace.success === true, 'Backward trace on FG batch succeeds');
      assert(fgTrace.lotType === 'FINISHED', 'Identifies lotType as FINISHED');
      assert(fgTrace.upstreamOperation !== undefined, 'Resolves upstreamOperation');
      assert(Array.isArray(fgTrace.shipments), 'Resolves shipments for this FG batch');
    } else {
      const globalFg = await prisma.finishedGoodsBatch.findFirst();
      if (globalFg) {
        const fgTrace = await getLotTraceability(globalFg.fgBatchId);
        assert(fgTrace.success === true, 'Backward trace on global FG batch succeeds');
        assert(fgTrace.lotType === 'FINISHED', 'Identifies lotType as FINISHED');
      }
    }

    // 4. Test Closed-Loop Stock Adjustment & Ledger Integration
    console.log('\n--- 4. Testing Closed-Loop Stock Adjustment Engine ---');
    
    // 4.1 Negative Test: Invalid reason
    const negReasonRes = await createStationStockAdjustment({
      stationId: targetStationId,
      targetType: 'RAW_LOT',
      targetId: 'NON_EXISTENT',
      actualQty: 100,
      reason: '   ', // empty reason
    });
    assert(negReasonRes.success === false, 'Rejects adjustment with empty/whitespace reason');

    // 4.2 Negative Test: Non-existent lot
    const negLotRes = await createStationStockAdjustment({
      stationId: targetStationId,
      targetType: 'RAW_LOT',
      targetId: 'DEFINITELY_DOES_NOT_EXIST_9999',
      actualQty: 100,
      reason: 'جرد روتيني سنوي',
    });
    assert(negLotRes.success === false, 'Rejects adjustment on non-existent batch/item');

    // 4.3 Negative Test: Negative actual quantity
    const negQtyRes = await createStationStockAdjustment({
      stationId: targetStationId,
      targetType: 'RAW_LOT',
      targetId: sampleRaw?.batchId || 'DUMMY',
      actualQty: -50,
      reason: 'جرد روتيني',
    });
    assert(negQtyRes.success === false, 'Rejects adjustment with negative actual quantity');

    // 4.4 Positive Test: Execute a controlled adjustment and verify atomic consistency
    // Let's create a dedicated test raw batch so we don't disrupt operational data
    let testRawLocation = await prisma.stockLocation.findFirst({
      where: { stationId: targetStationId, type: WarehouseType.RAW },
    });
    if (!testRawLocation) {
      testRawLocation = await prisma.stockLocation.create({
        data: {
          stationId: targetStationId,
          name: 'مخزن تجارب الجرد',
          type: WarehouseType.RAW,
        },
      });
    }

    const testSupplier = await prisma.supplier.findFirst();
    if (!testSupplier) {
      throw new Error('No supplier found in database for test');
    }

    const testBatchId = `LOT-TEST-ADJ-${Date.now().toString().slice(-6)}`;
    const createdBatch = await prisma.rawBatch.create({
      data: {
        batchId: testBatchId,
        stationId: targetStationId,
        locationId: testRawLocation.id,
        supplierId: testSupplier.id,
        rawProduct: 'فراولة فريش للتجربة',
        initialQty: 1000,
        availableQty: 1000,
        grossQtyKg: 1000,
        tareQtyKg: 0,
        unitPriceEgp: 25,
        transportCostEgp: 0,
        unitCost: 25,
        totalPayableEgp: 25000,
        qcStatus: 'APPROVED',
      },
    });

    console.log(`  Created test raw batch ${testBatchId} with initial 1,000 kg`);

    // Perform Adjustment: System = 1000, Actual = 950 (Difference = -50 kg shortage)
    const adjRes = await createStationStockAdjustment({
      stationId: targetStationId,
      targetType: 'RAW_LOT',
      targetId: testBatchId,
      actualQty: 950,
      reason: 'تسوية عجز جرد فعلي في ميزان البسكول',
    });

    assert(adjRes.success === true, 'Stock adjustment executes successfully');
    assert(adjRes.data?.differenceQty === -50, 'Calculates exact difference (-50 kg)');

    // Verify DB Changes:
    // 1. Batch availableQty updated to 950
    const updatedBatch = await prisma.rawBatch.findUnique({
      where: { batchId: testBatchId },
    });
    assert(Number(updatedBatch?.availableQty) === 950, 'Batch availableQty atomically updated to 950');

    // 2. StockMovement created with type ADJUSTMENT
    const movement = await prisma.stockMovement.findFirst({
      where: {
        rawBatchId: testBatchId,
        movementType: 'ADJUSTMENT',
      },
    });
    assert(!!movement, 'Creates matching StockMovement of type ADJUSTMENT');
    assert(Number(movement?.qty) === 50, 'StockMovement records difference magnitude (50 kg)');
    assert(movement?.sourceLocationId === testRawLocation.id, 'Movement source is correctly set to batch location for deficit');

    // 3. StockAdjustment record exists
    const adjRecord = await prisma.stockAdjustment.findUnique({
      where: { adjustmentId: adjRes.data?.adjustmentId },
    });
    assert(!!adjRecord, 'StockAdjustment entity stored in database');
    assert(Number(adjRecord?.systemQty) === 1000, 'Records systemQty prior to adjustment');
    assert(Number(adjRecord?.actualQty) === 950, 'Records approved actualQty');

    // 4. AuditLog created
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityType: 'station_inventory',
        entityId: testBatchId,
        action: 'ADJUSTMENT',
      },
    });
    assert(!!audit, 'AuditLog entry created recording the transaction');

    // Clean up test batch & movements
    await prisma.stockMovement.deleteMany({ where: { rawBatchId: testBatchId } });
    await prisma.stockAdjustment.deleteMany({ where: { targetId: testBatchId } });
    await prisma.auditLog.deleteMany({ where: { entityId: testBatchId } });
    await prisma.rawBatch.delete({ where: { batchId: testBatchId } });
    console.log('  Cleaned up test batch and associated test records');

    console.log('\n=================================================================');
    console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('=================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite crashed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runStationHubTestSuite();
