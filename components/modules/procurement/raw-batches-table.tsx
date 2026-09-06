import { Scale, CheckCircle2, AlertTriangle, Building2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface RawBatchItem {
  batchId: string;
  station: { name: string };
  supplier: { name: string };
  rawProduct: string;
  grossQtyKg: any;
  tareQtyKg: any;
  initialQty: any;
  availableQty: any;
  unitPriceEgp: any;
  transportCostEgp: any;
  unitCost: any;
  totalPayableEgp: any;
  receivedDate: Date | string;
  qcStatus: string;
  brixDegree?: any;
  truckPlate?: string | null;
}

interface RawBatchesTableProps {
  batches: RawBatchItem[];
}

export function RawBatchesTable({ batches }: RawBatchesTableProps) {
  return (
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-700 border-b font-semibold">
              <tr>
                <th className="py-3.5 px-4">رقم اللوط (Batch ID)</th>
                <th className="py-3.5 px-4">المحطة والمورد</th>
                <th className="py-3.5 px-4">الصنف الخام</th>
                <th className="py-3.5 px-4">الأوزان (قائم / فارغ / صافي)</th>
                <th className="py-3.5 px-4">تكلفة الكيلو الموزونة</th>
                <th className="py-3.5 px-4">إجمالي استحقاق المورد</th>
                <th className="py-3.5 px-4 text-center">البريكس والجودة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    لا توجد لوطات خام مسجلة حالياً
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const gross = Number(batch.grossQtyKg || 0);
                  const tare = Number(batch.tareQtyKg || 0);
                  const net = Number(batch.initialQty || 0);
                  const unitCostNum = Number(batch.unitCost || 0);
                  const totalPayableNum = Number(batch.totalPayableEgp || 0);

                  return (
                    <tr key={batch.batchId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#012d1d]">
                        {batch.batchId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                            {batch.station?.name}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Truck className="h-3 w-3 text-cyan-600" />
                            {batch.supplier?.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">
                        {batch.rawProduct}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-900">
                            الصافي: {net.toLocaleString()} كجم
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            (قائم: {gross.toLocaleString()} | فارغ: {tare.toLocaleString()})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-cyan-800">
                          {unitCostNum.toFixed(2)} ج.م / كجم
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-800">
                          {totalPayableNum.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          ج.م
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {batch.qcStatus}
                          </Badge>
                          {batch.brixDegree && (
                            <span className="text-xs text-amber-700 font-semibold">
                              Brix: {Number(batch.brixDegree)}°
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
