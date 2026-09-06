import React from "react";
import { Station, FinishedGoodsBatch, StockTransfer, UserRole } from "@prisma/client";
import { ArrowLeftRight, Truck, Calendar, User, ShieldCheck } from "lucide-react";
import { CancelOperationModal } from "@/components/modules/common/cancel-operation-modal";
import { can } from "@/lib/permissions";

type ExtendedTransfer = StockTransfer & {
  fromStation?: Station | null;
  toStation?: Station | null;
  fromLocation?: any | null;
  toLocation?: any | null;
  batch?: FinishedGoodsBatch | null;
};

interface TransferLogTableProps {
  transfers: ExtendedTransfer[];
  userRole?: UserRole;
}

export function TransferLogTable({ transfers, userRole = UserRole.ADMIN }: TransferLogTableProps) {
  const canCancel = can(userRole, 'DELETE_OPERATION');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">سجل أذون التحويل الرسمية (TRF-Log)</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            توثيق كافة حركات النقل اللوجستي المبرد بين المحطات بسجلات حركة معتمدة.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          إجمالي الأذون: {transfers.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
            <tr>
              <th className="p-3">رقم إذن النقل</th>
              <th className="p-3">تاريخ التحويل</th>
              <th className="p-3">المحطة المصدر (From)</th>
              <th className="p-3">المحطة المستقبلة (To)</th>
              <th className="p-3">رقم الباتش والمنتج</th>
              <th className="p-3 font-mono">الكمية المنقولة (كجم)</th>
              <th className="p-3">سيارة النقل والسيارة</th>
              <th className="p-3">الحالة اللوجستية</th>
              <th className="p-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {transfers.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-400 font-sans">
                  لا توجد حركات تحويل مسجلة حالياً بين المحطات.
                </td>
              </tr>
            ) : (
              transfers.map((t) => {
                const isActive = t.status !== 'CANCELLED' && t.status !== 'ملغاة';
                const isCancelled = t.status === 'CANCELLED' || t.status === 'ملغاة';

                return (
                  <tr key={t.transferId} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-[#012d1d]">{t.transferId}</td>
                    <td className="p-3 font-sans text-gray-600">
                      {new Date(t.date).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3 font-sans font-semibold text-amber-900">
                      {t.fromStation?.name || t.fromStationId}
                    </td>
                    <td className="p-3 font-sans font-semibold text-emerald-900">
                      {t.toStation?.name || t.toStationId}
                    </td>
                    <td className="p-3 font-sans text-gray-800">
                      <span className="font-mono font-bold block text-gray-900">{t.batchId || t.fgBatchId || t.rawBatchId}</span>
                      <span className="text-[11px] text-gray-500">{t.productName}</span>
                    </td>
                    <td className="p-3 font-bold text-emerald-800 text-sm">
                      {Number(t.qtyKg).toLocaleString()} كجم
                    </td>
                    <td className="p-3 font-sans text-gray-700">
                      <div className="flex items-center gap-1 text-gray-900 font-bold">
                        <Truck className="h-3.5 w-3.5 text-gray-500" />
                        <span>{t.truckPlate || "غير محدد"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                        <User className="h-3 w-3" />
                        <span>{t.driverName || "غير محدد"}</span>
                      </div>
                    </td>
                    <td className="p-3 font-sans">
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-900 border border-red-300">
                          🚫 ملغى ومكسوس
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {t.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-sans text-center">
                      {canCancel && isActive && (
                        <CancelOperationModal
                          operationType="transfer"
                          operationId={t.transferId}
                          operationLabel={`إذن التحويل ${t.transferId} من محطة ${t.fromStation?.name || t.fromStationId} إلى ${t.toStation?.name || t.toStationId}`}
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
