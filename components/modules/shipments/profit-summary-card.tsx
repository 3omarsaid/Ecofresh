import React from "react";
import Link from "next/link";
import { ShipmentTraceabilityData } from "@/lib/data/shipment-dna";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  ArrowUpRight,
  Calculator,
  Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface ProfitSummaryCardProps {
  shipment: ShipmentTraceabilityData;
}

export function ProfitSummaryCard({ shipment }: ProfitSummaryCardProps) {
  const sellingEur = Number(shipment.sellingPriceEur);
  const fxRate = Number(shipment.fxRate);
  const revenueEgp = Number(shipment.grossRevenueEgp);
  const totalCostEgp = Number(shipment.totalShipmentCostEgp);
  const netProfitEgp = Number(shipment.netProfitEgp);
  const marginPct = Number(shipment.marginPercent);

  // Financial Transaction reference / Commercial Invoice
  const invoiceRef = `INV-${shipment.shipmentId}`;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 dir-rtl">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          بطاقة الإيراد والأرباح والهامش الصافي
        </h3>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          معتمدة آلياً
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-1">
          <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            إجمالي الإيراد الصادر
          </span>
          <div className="text-xl font-bold font-mono text-emerald-950">
            {formatCurrency(revenueEgp)}
          </div>
          <span className="text-[10px] text-emerald-700 font-mono block">
            ({formatCurrency(sellingEur)} × {Number(shipment.shippedQtyKg).toLocaleString()} كجم)
          </span>
        </div>

        {/* Total Cost */}
        <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100 space-y-1">
          <span className="text-xs text-rose-800 font-semibold flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-rose-600" />
            إجمالي التكلفة الكلية
          </span>
          <div className="text-xl font-bold font-mono text-rose-950">
            {formatCurrency(totalCostEgp)}
          </div>
          <span className="text-[10px] text-rose-700 block">
            إنتاج + مصاريف لوجستية
          </span>
        </div>

        {/* Net Profit */}
        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-1">
          <span className="text-xs text-blue-800 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            صافي الربح الصافي
          </span>
          <div className="text-xl font-bold font-mono text-blue-950">
            +{formatCurrency(netProfitEgp)}
          </div>
          <span className="text-[10px] text-blue-700 font-bold block">
            صافي الأرباح المحققة
          </span>
        </div>

        {/* Profit Margin */}
        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-1">
          <span className="text-xs text-indigo-800 font-semibold flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-indigo-600" />
            هامش الربحية
          </span>
          <div className="text-xl font-bold font-mono text-indigo-950">
            {marginPct.toFixed(1)}%
          </div>
          <span className="text-[10px] text-indigo-700 font-semibold block">
            معدل العائد المالي
          </span>
        </div>
      </div>

      {/* Commercial Invoice & General Ledger Link Section */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              الفاتورة التجارية (Commercial Invoice AR):{" "}
              <span className="font-mono text-indigo-700">{invoiceRef}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              تم توليد الاستحقاق المحاسبي تلقائياً لصالح العميل {shipment.customer.name}
            </div>
          </div>
        </div>

        <Link
          href={`/financials?refDoc=${shipment.shipmentId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 shadow-sm transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
          استعراض القيد المالي في دفتر الأستاذ
        </Link>
      </div>
    </div>
  );
}
