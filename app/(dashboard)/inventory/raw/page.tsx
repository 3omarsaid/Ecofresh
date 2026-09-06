export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { RawInventoryTable } from "@/components/modules/inventory/raw-inventory-table";

export const metadata = {
  title: "مخزن المواد الخام الزراعية — Nilotic Frost ERP",
};

export default async function RawInventoryPage() {
  const lots = await prisma.rawBatch.findMany({
    where: { availableQty: { gt: 0 } },
    include: { station: true, supplier: true },
    orderBy: { receivedDate: "desc" },
  });

  const totalRawKg = lots.reduce((sum, l) => sum + Number(l.availableQty), 0);
  const totalValue = lots.reduce(
    (sum, l) => sum + Number(l.availableQty) * Number(l.unitCost),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">
            إجمالي رصيد الخام المتاح في الثلاجات
          </span>
          <p className="text-2xl font-bold text-[#012d1d] mt-1">
            {totalRawKg.toLocaleString()} كجم
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">
            قيمة مخزون الخام التكليفية
          </span>
          <p className="text-2xl font-bold text-[#0054cd] mt-1">
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            ج.م
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-500 font-bold">
            عدد اللوطات المفتوحة
          </span>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {lots.length} لوط
          </p>
        </div>
      </div>

      {/* Raw Batches Inventory Table */}
      <RawInventoryTable lots={lots} />
    </div>
  );
}
