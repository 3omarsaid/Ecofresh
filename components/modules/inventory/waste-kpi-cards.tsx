import React from "react";
import { Scale, DollarSign, Package, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WasteKpiCardsProps {
  totalRawWasteKg: number;
  totalRawWasteEgp: number;
  totalSuppliesWasteEgp: number;
  grandTotalWasteLoss: number;
  overallWastePct: number;
  standardWastePct: number;
}

export function WasteKpiCards({
  totalRawWasteKg,
  totalRawWasteEgp,
  totalSuppliesWasteEgp,
  grandTotalWasteLoss,
  overallWastePct,
  standardWastePct,
}: WasteKpiCardsProps) {
  const isWithinStandard = overallWastePct <= standardWastePct;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Raw Waste (Kg) */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">إجمالي هالك الخام المسجل</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-rose-700 font-mono">
                {totalRawWasteKg.toLocaleString()}
              </p>
              <span className="text-xs text-rose-600 font-medium">كجم</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 font-mono">
              نسبة الهالك الفعلية: {overallWastePct.toFixed(1)}%
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700 shrink-0">
            <Scale className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Raw Waste Cost (EGP) */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">التكلفة المالية لهالك الخام</p>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="text-2xl font-bold text-rose-700 font-mono">
                {totalRawWasteEgp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-rose-600 font-medium">ج.م</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">محسوبة بـ Unit Cost المباشر</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700 shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Supplies Waste Cost (EGP) */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">تكلفة هالك المستلزمات والتعبئة</p>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="text-2xl font-bold text-amber-700 font-mono">
                {totalSuppliesWasteEgp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-amber-600 font-medium">ج.م</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">كراتين وأكياس تالفة أثناء التعبئة</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
            <Package className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Standard Compliance Badge */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">المطابقة للمعيار (20.0%)</p>
            <div className="mt-2">
              {isWithinStandard ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  مطابق للمعيار ({overallWastePct.toFixed(1)}% ≤ 20.0%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  تجاوز المعيار ({overallWastePct.toFixed(1)}% &gt; 20.0%)
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-mono">
              إجمالي الفاقد: {grandTotalWasteLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
