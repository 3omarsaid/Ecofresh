import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { getWasteAnalytics } from "@/lib/data/waste-analytics";
import { WasteKpiCards } from "@/components/modules/inventory/waste-kpi-cards";
import { SupplierWasteTable } from "@/components/modules/inventory/supplier-waste-table";
import { SuppliesWasteCard } from "@/components/modules/inventory/supplies-waste-card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "مركز مراقبة وتكاليف الهالك — Nilotic Frost ERP",
};

export default async function WasteMonitoringPage() {
  const analytics = await getWasteAnalytics();

  const isOverStandard = analytics.overallWastePct > analytics.standardWastePct;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                مركز مراقبة وتكاليف الهالك (Waste Monitoring Hub)
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                متابعة هالك الخام والمستلزمات، احتساب التكاليف المباشرة بالجنيه المصري، وتوزيع نسب الهالك على المزارع والموردين
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-rose-100 text-rose-900 border border-rose-300 px-3 py-1.5 rounded-lg font-bold">
            مركز التحكم المباشر وتكاليف الهالك
          </span>
        </div>
      </div>

      {/* Exceptional Alert Banner if High Waste */}
      {isOverStandard && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between text-xs text-amber-950 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0" />
            تنبيه تشغيلي: نسبة هالك الخام الإجمالية ({analytics.overallWastePct.toFixed(1)}%) أعلى من النسبة المعيارية المستهدفة ({analytics.standardWastePct.toFixed(1)}%).
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <WasteKpiCards
        totalRawWasteKg={analytics.totalRawWasteKg}
        totalRawWasteEgp={analytics.totalRawWasteEgp}
        totalSuppliesWasteEgp={analytics.totalSuppliesWasteEgp}
        grandTotalWasteLoss={analytics.grandTotalWasteLoss}
        overallWastePct={analytics.overallWastePct}
        standardWastePct={analytics.standardWastePct}
      />

      {/* Supplier Waste Attribution Table */}
      <SupplierWasteTable suppliers={analytics.suppliersList} />

      {/* Supplies Waste Card */}
      <SuppliesWasteCard totalSuppliesWasteEgp={analytics.totalSuppliesWasteEgp} />
    </div>
  );
}
