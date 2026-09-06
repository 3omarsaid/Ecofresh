import React from "react";
import { Boxes, PackageCheck } from "lucide-react";

interface SuppliesWasteCardProps {
  totalSuppliesWasteEgp: number;
}

export function SuppliesWasteCard({ totalSuppliesWasteEgp }: SuppliesWasteCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              كارت هالك الكراتين ومستلزمات التعبئة (Packaging & Supplies Waste)
            </h2>
            <p className="text-xs text-gray-500">
              متابعة التكلفة المباشرة للكراتين والأكياس والمواد التالفة أثناء الإنتاج والعبوات المرفوضة
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          تلفيات التعبئة والفرز
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-1">
          <span className="text-xs text-gray-500 font-medium">إجمالي القيمة المالية لهالك المستلزمات</span>
          <div className="text-xl font-bold text-amber-800 font-mono">
            {totalSuppliesWasteEgp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
          </div>
          <p className="text-[11px] text-gray-500">محسوبة مباشرة حسب سعر وحدة المستلزم (unitPrice)</p>
        </div>

        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
            <PackageCheck className="h-4 w-4 text-emerald-600" />
            سياسة ضبط الهالك
          </div>
          <p className="text-xs text-emerald-950 leading-relaxed mt-1">
            يتم تسجيل كافة الكراتين التالفة أو الباليتات غير المطبقة مباشرة بالسوفتوير لحساب التكلفة الحقيقية للشحنة ومنع التسريب المخزني.
          </p>
        </div>
      </div>
    </div>
  );
}
