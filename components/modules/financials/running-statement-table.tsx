"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StatementRow } from "@/lib/data/ledger";
import { TransactionDetailsDrawer } from "./transaction-details-drawer";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, ExternalLink, FileText, Info } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface RunningStatementTableProps {
  rows: StatementRow[];
  openingBalance?: number;
  closingBalance?: number;
}

export function RunningStatementTable({
  rows,
  openingBalance = 0,
  closingBalance = 0,
}: RunningStatementTableProps) {
  const [selectedTxn, setSelectedTxn] = useState<StatementRow | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs text-right">
          <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-200">
            <tr>
              <th className="p-3.5">التاريخ</th>
              <th className="p-3.5 font-mono">رقم القيد</th>
              <th className="p-3.5">نوع الحركة</th>
              <th className="p-3.5 font-mono">المستند المرجعي</th>
              <th className="p-3.5">البيان / الشرح</th>
              <th className="p-3.5 text-center">المطلوب / المستحق (+)</th>
              <th className="p-3.5 text-center">المحصل / المدفوع (-)</th>
              <th className="p-3.5 text-center">الرصيد قبل</th>
              <th className="p-3.5 text-center">الرصيد بعد</th>
              <th className="p-3.5 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {/* Opening Balance Row */}
            <tr className="bg-emerald-50/40 font-bold text-gray-800">
              <td colSpan={7} className="p-3 font-sans text-xs text-emerald-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-700" />
                <span>الرصيد الافتتاحي السابق (قبل الفترة / الصفحة الحالية):</span>
              </td>
              <td className="p-3 text-center text-gray-400 font-mono">—</td>
              <td className="p-3 text-center font-mono font-extrabold text-emerald-800">
                {formatCurrency(openingBalance)}
              </td>
              <td className="p-3 text-center font-sans">
                <Badge variant="outline" className="bg-emerald-100/60 text-emerald-800 border-emerald-300 text-[10px]">
                  افتتاحي
                </Badge>
              </td>
            </tr>

            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10 text-gray-400 font-sans">
                  لا توجد حركات مالية مسجلة خلال الفترة المحددة.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isCancelled = row.isCancelled || row.status === "ملغاة";
                return (
                  <tr
                    key={row.txnId}
                    onClick={() => setSelectedTxn(row)}
                    className={`cursor-pointer transition-colors ${
                      isCancelled
                        ? "bg-rose-50/40 hover:bg-rose-50/70 text-gray-400 line-through opacity-75"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    <td className="p-3 text-gray-600 font-mono">
                      {new Date(row.date).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3 font-bold text-primary hover:underline">
                      {row.txnId}
                    </td>
                    <td className="p-3 font-sans not-italic">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          row.dueAmount > 0
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}
                      >
                        {row.dueAmount > 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 text-blue-700" />
                        )}
                        {row.type}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">
                      {row.refDoc ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200 text-[11px]">
                            {row.refDoc}
                          </span>
                          {row.sourceLink && (
                            <Link
                              href={row.sourceLink}
                              onClick={(e) => e.stopPropagation()}
                              className="text-primary hover:text-emerald-800"
                              title="عرض المستند الأصلي"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 font-sans max-w-[220px] truncate text-gray-700 not-italic">
                      {row.description || "—"}
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700">
                      {row.dueAmount > 0
                        ? formatCurrency(row.dueAmount)
                        : "—"}
                    </td>
                    <td className="p-3 text-center font-bold text-blue-700">
                      {row.paidAmount > 0
                        ? formatCurrency(row.paidAmount)
                        : "—"}
                    </td>
                    <td className="p-3 text-center font-medium text-gray-500">
                      {row.balanceBefore !== undefined && row.balanceBefore !== null
                        ? formatCurrency(row.balanceBefore)
                        : "—"}
                    </td>
                    <td
                      className={`p-3 text-center font-bold ${
                        row.balanceAfter > 0
                          ? "text-rose-700"
                          : row.balanceAfter < 0
                          ? "text-blue-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {row.balanceAfter !== undefined && row.balanceAfter !== null
                        ? formatCurrency(row.balanceAfter)
                        : formatCurrency(Number(row.balance) || 0)}
                    </td>
                    <td className="p-3 text-center font-sans">
                      <Badge
                        variant="outline"
                        className={
                          isCancelled
                            ? "bg-rose-100 text-rose-800 border-rose-300 text-[10px]"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]"
                        }
                      >
                        {isCancelled ? "ملغاة" : "معتمد"}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}

            {/* Closing Balance Row */}
            <tr className="bg-gray-100/60 font-bold text-gray-900 border-t-2 border-gray-200">
              <td colSpan={7} className="p-3 font-sans text-xs text-gray-800">
                الرصيد الختامي النهائي التراكمي:
              </td>
              <td className="p-3 text-center text-gray-400 font-mono">—</td>
              <td className="p-3 text-center font-mono font-extrabold text-base text-gray-900">
                {formatCurrency(closingBalance)}
              </td>
              <td className="p-3 text-center font-sans">
                <Badge variant="secondary" className="bg-gray-200 text-gray-800 text-[10px]">
                  ختامي
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Transaction Details Drawer */}
      {selectedTxn && (
        <TransactionDetailsDrawer
          transaction={selectedTxn}
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
        />
      )}
    </>
  );
}

