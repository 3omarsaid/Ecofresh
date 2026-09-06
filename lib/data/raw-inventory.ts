import { prisma } from "@/lib/prisma";

export async function getAvailableRawInventory() {
  try {
    return await prisma.rawBatch.findMany({
      where: { availableQty: { gt: 0 } },
      include: {
        station: true,
        supplier: true,
      },
      orderBy: { receivedDate: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch available raw inventory:", error);
    return [];
  }
}

export async function getRawBatchById(batchId: string) {
  try {
    return await prisma.rawBatch.findUnique({
      where: { batchId },
      include: {
        station: true,
        supplier: true,
        createdBy: true,
      },
    });
  } catch (error) {
    console.error(`Failed to fetch raw batch ${batchId}:`, error);
    return null;
  }
}
