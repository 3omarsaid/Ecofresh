import React from "react";
import Link from "next/link";
import { Cpu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CancelOperationModal } from "@/components/modules/common/cancel-operation-modal";
import { UserRole } from "@prisma/client";
import { can } from "@/lib/permissions";

interface ProcessingOperationItem {
  id: string;
  stationName: string;
  contractorName: string;
  rawProduct: string;
  finishedProduct: string;
  rawInputKg: number;
  finishedOutputKg: number;
  yieldPct: number;
  grandTotalCost: number;
  unitCostPerKg: number;
  date: string;
  status?: string;
}

interface OperationsTableProps {
  operations?: ProcessingOperationItem[];
  userRole?: UserRole;
}

export function OperationsTable({ operations = [], userRole = UserRole.ADMIN }: OperationsTableProps) {
  const canCancel = can(userRole, 'DELETE_OPERATION');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">سجل عمليات التشغيل المعتمدة</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            عرض إحصائيات التشغيل، نسب التصافي، وتكلفة الكيلو الموزونة لكل تشغيلة.
          </p>
        </div>
        <Button asChild className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-semibold text-xs shadow-sm">
  <Link href="/processing-operations/new">
            <Plus className="h-4 w-4" /> معالج إضافة عملية جديدة
          </Link>
</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
            <tr>
              <th className="p-3">رقم العملية</th>
              <th className="p-3">محطة التشغيل</th>
              <th className="p-3">المقاول</th>
              <th className="p-3">الخام / المنتج</th>
              <th className="p-3 font-mono">الداخل (كجم)</th>
              <th className="p-3 font-mono">الخارج (كجم)</th>
              <th className="p-3 font-mono">الهالك (كجم)</th>
              <th className="p-3 font-mono">نسبة الهالك</th>
              <th className="p-3 font-mono">نسبة التصافي</th>
              <th className="p-3 font-mono">إجمالي التكلفة</th>
              <th className="p-3 font-mono">تكلفة الكيلو</th>
              <th className="p-3">الحالة</th>
              <th className="p-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {operations.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-8 text-center text-gray-400 font-sans">
                  لا توجد عمليات تشغيل مسجلة حالياً. اضغط على &quot;معالج إضافة عملية جديدة&quot; لبدء تشغيلة.
                </td>
              </tr>
            ) : (
              operations.map((op) => {
                const isActive = !op.status || op.status === 'ACTIVE' || op.status === 'معتمدة';
                const isCancelled = op.status === 'CANCELLED' || op.status === 'ملغاة';
                const wasteKg = Math.max(0, Math.round((op.rawInputKg - op.finishedOutputKg) * 100) / 100);
                const wastePct = op.rawInputKg > 0 ? (wasteKg / op.rawInputKg) * 100 : 0;

                return (
                  <tr key={op.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-[#012d1d]">{op.id}</td>
                    <td className="p-3 font-sans text-gray-800">{op.stationName}</td>
                    <td className="p-3 font-sans text-gray-700">{op.contractorName}</td>
                    <td className="p-3 font-sans text-gray-700">
                      {op.rawProduct} ➔ {op.finishedProduct}
                    </td>
                    <td className="p-3 text-gray-900 font-bold">{op.rawInputKg.toLocaleString()}</td>
                    <td className="p-3 text-emerald-800 font-bold">
                      {op.finishedOutputKg.toLocaleString()}
                    </td>
                    <td className="p-3 text-rose-700 font-bold">
                      {wasteKg.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                        {wastePct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {op.yieldPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      {op.grandTotalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ج.م
                    </td>
                    <td className="p-3 text-cyan-800 font-bold">
                      {op.unitCostPerKg.toFixed(2)} ج.م
                    </td>
                    <td className="p-3 font-sans">
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-900 border border-red-300">
                          🚫 ملغاة ومكسوسة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          🔒 معتمدة ومقفلة
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-sans text-center">
                      {canCancel && isActive && (
                        <CancelOperationModal
                          operationType="processing"
                          operationId={op.id}
                          operationLabel={`عملية التشغيل ${op.id} (${op.rawProduct} ➔ ${op.finishedProduct})`}
                        />
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
