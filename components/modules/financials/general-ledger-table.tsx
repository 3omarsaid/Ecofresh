"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Filter, Calendar, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TransactionItem {
  txnId: string;
  date: Date;
  type: string;
  partyType: string;
  partyId: string;
  partyName: string;
  amountEgp: number;
  amountCurrency: number | null;
  currency: string | null;
  refDoc: string | null;
  description: string | null;
  accountName?: string | null;
}

interface GeneralLedgerTableProps {
  initialTransactions: TransactionItem[];
  currentTab: string;
}

export function GeneralLedgerTable({
  initialTransactions,
  currentTab,
}: GeneralLedgerTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredTransactions = initialTransactions.filter((txn) => {
    // Search
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      const matchSearch =
        txn.txnId.toLowerCase().includes(q) ||
        txn.partyName.toLowerCase().includes(q) ||
        (txn.refDoc && txn.refDoc.toLowerCase().includes(q)) ||
        (txn.description && txn.description.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    // Type filter
    if (typeFilter !== "ALL" && txn.type !== typeFilter) {
      return false;
    }

    // Date range
    if (startDate) {
      const txnDate = new Date(txn.date).toISOString().split("T")[0];
      if (txnDate < startDate) return false;
    }
    if (endDate) {
      const txnDate = new Date(txn.date).toISOString().split("T")[0];
      if (txnDate > endDate) return false;
    }

    return true;
  });

  const uniqueTypes = Array.from(new Set(initialTransactions.map((t) => t.type)));

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-card p-4 rounded-lg border border-border">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم القيد، اسم الطرف، أومستند مرجعي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">جميع أنواع القيود</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
            <span className="text-xs text-muted-foreground">إلى</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </div>
        </div>

        {(search || typeFilter !== "ALL" || startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setTypeFilter("ALL");
              setStartDate("");
              setEndDate("");
            }}
          >
            إعادة ضبط الفلاتر
          </Button>
        )}
      </div>

      {/* Standard Table UI */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm text-right">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="p-3 text-right">التاريخ</th>
              <th className="p-3 text-right">رقم القيد</th>
              <th className="p-3 text-right">نوع الحركة</th>
              <th className="p-3 text-right">الطرف الحسابي</th>
              <th className="p-3 text-right">المستند المرجعي</th>
              <th className="p-3 text-right">الحساب البنكي / الخزينة</th>
              <th className="p-3 text-center">المبلغ (ج.م)</th>
              <th className="p-3 text-center">كشف الحساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  لا توجد قيود محاسبية مطابقة لشروط البحث والتصفية.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr key={txn.txnId} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono text-sm">
                    {new Date(txn.date).toISOString().split("T")[0]}
                  </td>
                  <td className="p-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {txn.txnId}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      {txn.type}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-sm text-foreground">{txn.partyName}</div>
                    <span className="text-xs text-muted-foreground">
                      ({txn.partyType})
                    </span>
                  </td>
                  <td className="p-3 font-mono text-sm text-muted-foreground">
                    {txn.refDoc || "—"}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {txn.accountName || "—"}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-foreground">
                    {txn.amountEgp.toLocaleString("ar-EG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-3 text-center">
                    <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary/80">
  <Link href={`/financials/parties/${txn.partyId}`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                        عرض الكشف
                      </Link>
</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
