import { prisma } from '@/lib/prisma';

export async function getWasteAnalytics() {
  try {
    const operations = await prisma.processingOperation.findMany({
      include: {
        station: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const totalRawWasteKg = operations.reduce((sum, o) => sum + Number(o.rawWasteKg), 0);
    const totalSuppliesWasteEgp = operations.reduce((sum, o) => sum + Number(o.suppliesWasteCost), 0);
    const totalRawInputKg = operations.reduce((sum, o) => sum + Number(o.rawInputKg), 0);

    let totalRawWasteEgp = 0;

    // Batch fetch finished goods batches for all operations at once
    const opIds = operations.map((op) => op.id);
    const fgBatches = await prisma.finishedGoodsBatch.findMany({
      where: { sourceOpId: { in: opIds } },
      select: { sourceOpId: true, rawSources: true },
    });

    const fgBatchMap = new Map(fgBatches.map((fg) => [fg.sourceOpId, fg.rawSources]));

    // Extract all rawBatchIds referenced across rawSources
    const allRawBatchIds = new Set<string>();
    operations.forEach((op) => {
      const rawSources = (fgBatchMap.get(op.id) as Array<{ batchId: string; qty: number }> | null) || [];
      rawSources.forEach((r) => allRawBatchIds.add(r.batchId));
    });

    // Single query for all raw batches with suppliers
    const rawBatches = await prisma.rawBatch.findMany({
      where: { batchId: { in: Array.from(allRawBatchIds) } },
      include: { supplier: true },
    });
    const rawBatchMap = new Map(rawBatches.map((rb) => [rb.batchId, rb]));

    const supplierAttribution: Record<string, { name: string; rawDelivered: number; attributedWaste: number }> = {};

    for (const op of operations) {
      const opRawInput = Number(op.rawInputKg);
      const opWaste = Number(op.rawWasteKg);
      const opRawCost = Number(op.rawCost);
      const avgCostPerKg = opRawInput > 0 ? opRawCost / opRawInput : 0;
      totalRawWasteEgp += opWaste * avgCostPerKg;

      const rawSources = (fgBatchMap.get(op.id) as Array<{ batchId: string; qty: number }> | null) || [];

      if (rawSources.length > 0 && opRawInput > 0) {
        for (const issue of rawSources) {
          const rawBatch = rawBatchMap.get(issue.batchId);

          if (rawBatch && rawBatch.supplier) {
            const supName = rawBatch.supplier.name;
            const issueQty = Number(issue.qty);
            const shareOfWaste = opWaste * (issueQty / opRawInput);

            if (!supplierAttribution[supName]) {
              supplierAttribution[supName] = { name: supName, rawDelivered: 0, attributedWaste: 0 };
            }
            supplierAttribution[supName].rawDelivered += issueQty;
            supplierAttribution[supName].attributedWaste += shareOfWaste;
          }
        }
      }
    }

    const overallWastePct = totalRawInputKg > 0 ? (totalRawWasteKg / totalRawInputKg) * 100 : 0;
    const standardWastePct = 20.0;

    return {
      totalRawInputKg,
      totalRawWasteKg,
      overallWastePct,
      standardWastePct,
      totalRawWasteEgp,
      totalSuppliesWasteEgp,
      grandTotalWasteLoss: totalRawWasteEgp + totalSuppliesWasteEgp,
      suppliersList: Object.values(supplierAttribution),
      operationsCount: operations.length,
    };
  } catch (error) {
    console.error('Failed to fetch waste analytics:', error);
    return {
      totalRawInputKg: 0,
      totalRawWasteKg: 0,
      overallWastePct: 0,
      standardWastePct: 20.0,
      totalRawWasteEgp: 0,
      totalSuppliesWasteEgp: 0,
      grandTotalWasteLoss: 0,
      suppliersList: [],
      operationsCount: 0,
    };
  }
}
