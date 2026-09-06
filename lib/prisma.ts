import { PrismaClient, Prisma } from '@prisma/client';

function serializeDecimal(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Prisma.Decimal.isDecimal(obj)) {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal);
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = serializeDecimal(value);
  }
  return result;
}

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ query, args }) {
        const result = await query(args);
        return serializeDecimal(result);
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton | undefined };

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

