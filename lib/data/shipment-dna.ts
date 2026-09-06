import { prisma } from "@/lib/prisma";

export async function getShipmentTraceabilityTree(shipmentId: string) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { shipmentId },
      include: {
        customer: true,
        order: true,
        allocatedBatches: {
          include: {
            batch: {
              include: {
                station: true,
                operation: {
                  include: {
                    contractor: true,
                    rawIssues: {
                      include: {
                        rawBatch: {
                          include: {
                            supplier: true,
                          },
                        },
                      },
                    },
                  },
                },
                deal: {
                  include: {
                    supplier: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return shipment;
  } catch (error) {
    console.error(`Failed to fetch shipment traceability tree for ${shipmentId}:`, error);
    return null;
  }
}

export type ShipmentTraceabilityData = NonNullable<
  Awaited<ReturnType<typeof getShipmentTraceabilityTree>>
>;
