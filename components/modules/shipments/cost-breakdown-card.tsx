import React from "react";
import { ShipmentTraceabilityData } from "@/lib/data/shipment-dna";
import {
  Receipt,
  Truck,
  Ship,
  FileCheck2,
  Building,
  Factory,
  PieChart,
} from "lucide-react";

interface CostBreakdownCardProps {
  shipment: ShipmentTraceabilityData;
}

export function CostBreakdownCard({ shipment }: CostBreakdownCardProps) {
  const prodCost = Number(shipment.productionCostEgp);
  const trucking = Number(shipment.inlandTruckingEgp);
  const freight = Number(shipment.oceanFreightEgp);
  const customs = Number(shipment.customsClearanceEgp);
  const inspection = Number(shipment.inspectionCertificatesEgp);
  const terminal = Number(shipment.portTerminalChargesEgp);
  const totalCost = Number(shipment.totalShipmentCostEgp) || 1;

  const costItems = [
    {
      name: "تكلفة الباتشات والإنتاج",
      amount: prodCost,
      icon: Factory,
      color: "bg-emerald-500",
      pct: ((prodCost / totalCost) * 100).toFixed(1),
    },
    {
      name: "النقل والتحميل الداخلي",
      amount: trucking,
      icon: Truck,
      color: "bg-blue-500",
      pct: ((trucking / totalCost) * 100).toFixed(1),
    },
    {
      name: "الشحن البحري (Ocean Freight)",
      amount: freight,
      icon: Ship,
      color: "bg-indigo-500",
      pct: ((freight / totalCost) * 100).toFixed(1),
    },
    {
      name: "التخليص الجمركي بالفرع",
      amount: customs,
      icon: Receipt,
      color: "bg-purple-500",
      pct: ((customs / totalCost) * 100).toFixed(1),
    },
    {
      name: "فحوصات وشهادات الجودة",
      amount: inspection,
      icon: FileCheck2,
      color: "bg-amber-500",
      pct: ((inspection / totalCost) * 100).toFixed(1),
    },
    {
      name: "عوائد الميناء والمناولات",
      amount: terminal,
      icon: Building,
      color: "bg-rose-500",
      pct: ((terminal / totalCost) * 100).toFixed(1),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 dir-rtl">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-700" />
          تفاصيل وتوزيع بنود التكلفة الستة
        </h3>
        <span className="text-xs font-mono font-bold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
          إجمالي: {totalCost.toLocaleString()} ج.م
        </span>
      </div>

      <div className="space-y-3">
        {costItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-gray-50/60 p-3 rounded-xl border border-gray-100 space-y-1.5"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-900">
                    {item.amount.toLocaleString()} ج.م
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200">
                    {item.pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color}`}
                  style={{ width: `${Math.min(100, Math.max(0, Number(item.pct)))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
