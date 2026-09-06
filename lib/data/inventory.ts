import { prisma } from "@/lib/prisma";

export async function getAvailableFinishedGoodsBatchesPaginated(page: number = 1, pageSize: number = 25) {
  try {
    const skip = (page - 1) * pageSize;
    const [batches, totalCount] = await Promise.all([
      prisma.finishedGoodsBatch.findMany({
        where: { availableQty: { gt: 0 } },
        include: { station: true, location: true },
        orderBy: { productionDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.finishedGoodsBatch.count({ where: { availableQty: { gt: 0 } } }),
    ]);

    return {
      batches: JSON.parse(JSON.stringify(batches)),
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Failed to fetch paginated finished goods batches:", error);
    return {
      batches: [],
      totalCount: 0,
      totalPages: 0,
      page,
      pageSize,
    };
  }
}

export async function getAvailableFinishedGoodsBatches() {
  try {
    return await prisma.finishedGoodsBatch.findMany({
      where: { availableQty: { gt: 0 } },
      include: { station: true, location: true },
      orderBy: { productionDate: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch available finished goods batches:", error);
    return [];
  }
}

export async function getFinishedGoodsBatchById(batchId: string) {
  try {
    return await prisma.finishedGoodsBatch.findUnique({
      where: { fgBatchId: batchId },
      include: { station: true, location: true },
    });
  } catch (error) {
    console.error(`Failed to fetch finished goods batch ${batchId}:`, error);
    return null;
  }
}
