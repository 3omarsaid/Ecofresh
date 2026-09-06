import React from "react";
import { Users, AlertCircle, CheckCircle2 } from "lucide-react";

export interface SupplierWasteAttribution {
  name: string;
  rawDelivered: number;
  attributedWaste: number;
}

interface SupplierWasteTableProps {
  suppliers: SupplierWasteAttribution[];
}

export function SupplierWasteTable({ suppliers }: SupplierWasteTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              جدول نسبة وتوزيع هالك المزارع والموردين (Supplier Waste Attribution)
            </h2>
            <p className="text-xs text-gray-500">
              توزيع الكمية المفقودة نسبياً بناءً على مساهمة لوطات المورد في التشغيلات
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
            <tr>
              <th className="p-3">اسم المورد / المزرعة</th>
              <th className="p-3 font-mono">إجمالي الخام المسحوب (كجم)</th>
              <th className="p-3 font-mono">الهالك المنسوب (كجم)</th>
              <th className="p-3 font-mono">نسبة الهالك الفعلية</th>
              <th className="p-3">المطابقة المعيارية (20%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400 font-sans">
                  لا توجد بيانات مسجلة لتوزيع هالك الموردين حالياً.
                </td>
              </tr>
            ) : (
              suppliers.map((sup, index) => {
                const wastePct = sup.rawDelivered > 0 ? (sup.attributedWaste / sup.rawDelivered) * 100 : 0;
                const isHighWaste = wastePct > 20.0;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 font-sans font-bold text-gray-900">{sup.name}</td>
                    <td className="p-3 text-gray-800 font-semibold">{sup.rawDelivered.toLocaleString()} كجم</td>
                    <td className="p-3 text-rose-700 font-bold">{sup.attributedWaste.toLocaleString(undefined, { maximumFractionDigits: 2 })} كجم</td>
                    <td className="p-3 font-bold text-gray-900">{wastePct.toFixed(1)}%</td>
                    <td className="p-3 font-sans">
                      {isHighWaste ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                          أعلى من المعيار
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          مطابق للمعيار
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
