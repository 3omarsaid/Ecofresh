"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Wallet,
  PlusCircle,
  ArrowRightLeft,
  Receipt,
  RotateCcw,
  ExternalLink,
  Calendar,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransactionDetailsDrawer, TransactionDetailData } from "./transaction-details-drawer";
import { ExpenseModal } from "./expense-modal";
import { TreasuryTransferModal } from "./treasury-transfer-modal";

interface TransactionItem {
  txnId: string;
  date: Date | string;
  type: string;
  partyType: string;
  partyId: string;
  partyName: string;
  amountEgp: number;
  amountCurrency?: number | null;
  currency?: string | null;
  refDoc?: string | null;
  description?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  status: string;
  sourceLink?: string | null;
  createdByName?: string | null;
  account?: {
    id: string;
    name: string;
    bankName?: string | null;
    balance?: number | null;
    currency: string;
  } | null;
}

interface TransactionsTableProps {
  transactions: TransactionItem[];
  accounts: Array<{ id: string; name: string; currency: string }>;
  initialAccountFilter?: string;
}

export function TransactionsTable({
  transactions,
  accounts,
  initialAccountFilter = "ALL",
}: TransactionsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [directionFilter, setDirectionFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [accountFilter, setAccountFilter] = useState<string>(initialAccountFilter);
  const [partyTypeFilter, setPartyTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("ALL");

  // Modals & Drawer state
  const [selectedTxn, setSelectedTxn] = useState<TransactionDetailData | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredTransactions = transactions.filter((t) => {
    const isCancelled = t.status === "ملغاة";
    if (statusFilter === "ACTIVE" && isCancelled) return false;
    if (statusFilter === "CANCELLED" && !isCancelled) return false;

    const isCollection =
      t.type.includes("تحصيل") ||
      t.type.includes("وارد") ||
      t.type.includes("Inflow") ||
      t.type.includes("زيادة");

    const isOutflow =
      t.type.includes("سداد") ||
      t.type.includes("منصرف") ||
      t.type.includes("مصروف") ||
      t.type.includes("Outflow") ||
      t.type.includes("عجز");

    const isTransfer = t.type.includes("تحويل");

    let matchesDirection = true;
    if (directionFilter === "INFLOW") matchesDirection = isCollection;
    else if (directionFilter === "OUTFLOW") matchesDirection = isOutflow;
    else if (directionFilter === "TRANSFER") matchesDirection = isTransfer;

    let matchesType = true;
    if (typeFilter === "COLLECTION") matchesType = isCollection;
    else if (typeFilter === "PAYMENT") matchesType = isOutflow && !t.type.includes("مصروف");
    else if (typeFilter === "EXPENSE") matchesType = t.type.includes("مصروف");
    else if (typeFilter === "TRANSFER") matchesType = isTransfer;
    else if (typeFilter === "ADJUSTMENT") matchesType = t.type.includes("تسوية");

    let matchesAccount = true;
    if (accountFilter !== "ALL") matchesAccount = t.accountId === accountFilter;

    let matchesPartyType = true;
    if (partyTypeFilter !== "ALL") matchesPartyType = t.partyType.includes(partyTypeFilter);

    // Date filter
    let matchesDate = true;
    const tDate = new Date(t.date);
    if (dateRange === "TODAY") {
      matchesDate = tDate >= todayStart;
    } else if (dateRange === "YESTERDAY") {
      matchesDate = tDate >= yesterdayStart && tDate < todayStart;
    } else if (dateRange === "WEEK") {
      matchesDate = tDate >= weekStart;
    } else if (dateRange === "MONTH") {
      matchesDate = tDate >= monthStart;
    }

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.txnId.toLowerCase().includes(query) ||
      t.partyName.toLowerCase().includes(query) ||
      (t.refDoc && t.refDoc.toLowerCase().includes(query)) ||
      (t.description && t.description.toLowerCase().includes(query));

    return matchesDirection && matchesType && matchesAccount && matchesPartyType && matchesDate && matchesSearch;
  });

  // Calculate summary metrics (exclude cancelled)
  const activeTransactions = filteredTransactions.filter((t) => t.status !== "ملغاة");

  const totalCollections = activeTransactions
    .filter((t) => t.type.includes("تحصيل") || t.type.includes("وارد") || t.type.includes("Inflow"))
    .reduce((sum, t) => sum + Number(t.amountEgp), 0);

  const totalPayments = activeTransactions
    .filter((t) => !t.type.includes("تحصيل") && !t.type.includes("وارد") && !t.type.includes("Inflow"))
    .reduce((sum, t) => sum + Number(t.amountEgp), 0);

  const netFlow = totalCollections - totalPayments;

  const handleRowClick = (t: TransactionItem) => {
    let sourceLink: string | null = t.sourceLink || null;
    if (!sourceLink && t.refDoc) {
      if (t.refDoc.startsWith("SHP-")) sourceLink = "/shipments";
      else if (t.refDoc.startsWith("LOT-")) sourceLink = "/raw-purchases";
      else if (t.refDoc.startsWith("DEAL-")) sourceLink = "/finished-purchases";
      else if (t.refDoc.startsWith("PR-")) sourceLink = "/processing-operations";
    }

    setSelectedTxn({
      txnId: t.txnId,
      date: t.date,
      type: t.type,
      partyType: t.partyType,
      partyId: t.partyId,
      partyName: t.partyName,
      amountEgp: Number(t.amountEgp),
      amountCurrency: t.amountCurrency ? Number(t.amountCurrency) : null,
      currency: t.currency,
      refDoc: t.refDoc,
      description: t.description,
      accountId: t.accountId,
      accountName: t.accountName || t.account?.name || null,
      status: t.status,
      sourceLink,
      createdByName: t.createdByName,
    });
  };

  const resetFilters = () => {
    setDirectionFilter("ALL");
    setTypeFilter("ALL");
    setAccountFilter("ALL");
    setPartyTypeFilter("ALL");
    setStatusFilter("ACTIVE");
    setDateRange("ALL");
    setSearchQuery("");
  };

  const hasActiveFilters =
    directionFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    accountFilter !== "ALL" ||
    partyTypeFilter !== "ALL" ||
    statusFilter !== "ACTIVE" ||
    dateRange !== "ALL" ||
    searchQuery !== "";

  return (
    <div className="space-y-6">
      {/* Quick Operations Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700">عمليات سريعة:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setIsExpenseModalOpen(true)}
            variant="outline"
            className="h-8 text-xs gap-1.5 border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-700" />
            + تسجيل مصروف مباشر
          </Button>

          <Button
            size="sm"
            onClick={() => setIsTransferModalOpen(true)}
            variant="outline"
            className="h-8 text-xs gap-1.5 border-blue-300 text-blue-900 bg-blue-50 hover:bg-blue-100 font-semibold"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-700" />
            ↔ تحويل بين الحسابات
          </Button>

          <Button asChild size="sm" className="h-8 text-xs gap-1.5 bg-[#012d1d] hover:bg-[#02472e] text-white font-semibold">
            <Link href="/financials/transactions/new">
              <PlusCircle className="w-3.5 h-3.5" />
              + إصدار سند قبض / صرف
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Collections */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">إجمالي سندات التحصيل والوارد</span>
            <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {Math.round(totalCollections).toLocaleString()} <span className="text-xs font-normal font-sans">ج.م</span>
          </div>
          <span className="text-[11px] text-emerald-600 block">تدفقات نقدية داخلة للحسابات</span>
        </div>

        {/* Total Payments */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">إجمالي سندات الدفع والمنصرف</span>
            <ArrowDownCircle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono">
            {Math.round(totalPayments).toLocaleString()} <span className="text-xs font-normal font-sans">ج.م</span>
          </div>
          <span className="text-[11px] text-rose-600 block">مدفوعات ومصروفات مسددة</span>
        </div>

        {/* Net Flow */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">صافي التدفق النقدي المعروض</span>
            <Wallet className="h-5 w-5 text-[#012d1d]" />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              netFlow >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {Math.round(netFlow).toLocaleString()} <span className="text-xs font-normal font-sans">ج.م</span>
          </div>
          <span className="text-[11px] text-gray-500 block">الفارق بين القبض والصرف</span>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#012d1d]" />
            <span className="text-xs font-bold text-gray-800">تصفية وبحث القيود:</span>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 gap-1 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              إعادة ضبط الفلاتر
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Direction Filter */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1 font-medium">الاتجاه</label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#012d1d]"
            >
              <option value="ALL">جميع الاتجاهات</option>
              <option value="INFLOW">وارد / تحصيل 🟢</option>
              <option value="OUTFLOW">منصرف / سداد 🔴</option>
              <option value="TRANSFER">مناقلة خزائن ↔</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1 font-medium">نوع السند</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#012d1d]"
            >
              <option value="ALL">جميع الأنواع</option>
              <option value="COLLECTION">سند تحصيل عميل</option>
              <option value="PAYMENT">سند سداد مورد/مقاول</option>
              <option value="EXPENSE">مصروف تشغيلي مباشر</option>
              <option value="TRANSFER">تحويل بين الخزائن</option>
              <option value="ADJUSTMENT">تسوية جرد</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1 font-medium">الحساب المالي</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#012d1d]"
            >
              <option value="ALL">جميع الحسابات</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Party Type Filter */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1 font-medium">نوع الطرف</label>
            <select
              value={partyTypeFilter}
              onChange={(e) => setPartyTypeFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#012d1d]"
            >
              <option value="ALL">جميع الأطراف</option>
              <option value="عميل">عملاء التصدير</option>
              <option value="مورد">الموردون</option>
              <option value="مقاول">مقاولو العمالة</option>
              <option value="مصروف">مصروفات عامة</option>
              <option value="حساب مالي">حسابات داخلية</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1 font-medium">الفترة الزمنية</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#012d1d]"
            >
              <option value="ALL">كافة الفترات</option>
              <option value="TODAY">حركات اليوم</option>
              <option value="YESTERDAY">حركات الأمس</option>
              <option value="WEEK">آخر 7 أيام</option>
              <option value="MONTH">الشهر الحالي</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1 font-medium">حالة السند</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#012d1d]"
            >
              <option value="ACTIVE">القيود المعتمدة النشطة</option>
              <option value="CANCELLED">القيود الملغاة فقط</option>
              <option value="ALL">الكل (معتمد وملغي)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="بحث برقم السند (TXN-...)، اسم الطرف، رقم الشحنة أو العملية، أو البيان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-xs bg-gray-50/70 border-gray-200 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-xs text-right">
          <thead className="bg-gray-50/80 text-gray-700 font-bold border-b border-gray-200">
            <tr>
              <th className="p-3.5">التاريخ والوقت</th>
              <th className="p-3.5 font-mono">رقم السند</th>
              <th className="p-3.5">نوع الحركة</th>
              <th className="p-3.5">الطرف المتعامل</th>
              <th className="p-3.5 font-mono">المستند المرجعي</th>
              <th className="p-3.5">الحساب المالي</th>
              <th className="p-3.5">البيان والشرح</th>
              <th className="p-3.5 text-center">الوارد (+)</th>
              <th className="p-3.5 text-center">المنصرف (-)</th>
              <th className="p-3.5 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-400">
                  لا توجد قيود أو سندات مالية مطابقة لشروط البحث والتصفية.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => {
                const isCancelled = t.status === "ملغاة";
                const isCollection =
                  t.type.includes("تحصيل") ||
                  t.type.includes("وارد") ||
                  t.type.includes("Inflow") ||
                  t.type.includes("زيادة");

                return (
                  <tr
                    key={t.txnId}
                    onClick={() => handleRowClick(t)}
                    className={`cursor-pointer transition-colors ${
                      isCancelled
                        ? "bg-rose-50/40 hover:bg-rose-50/70 text-gray-400 line-through opacity-75"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    <td className="p-3 text-gray-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3 font-mono font-bold text-primary hover:underline whitespace-nowrap">
                      {t.txnId}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isCollection
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}
                      >
                        {isCollection ? (
                          <ArrowUpCircle className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <ArrowDownCircle className="w-3 h-3 text-rose-700" />
                        )}
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-gray-900 whitespace-nowrap">
                      {t.partyName}
                      {t.partyType && (
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {t.partyType}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-gray-600 whitespace-nowrap">
                      {t.refDoc ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200 text-[11px]">
                            {t.refDoc}
                          </span>
                          {t.sourceLink && (
                            <Link
                              href={t.sourceLink}
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
                    <td className="p-3 font-semibold text-gray-800 whitespace-nowrap">
                      {t.accountName || t.account?.name || "—"}
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-gray-600" title={t.description || ""}>
                      {t.description || "—"}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {isCollection
                        ? Number(t.amountEgp).toLocaleString("ar-EG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-rose-700 whitespace-nowrap">
                      {!isCollection
                        ? Number(t.amountEgp).toLocaleString("ar-EG", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isCancelled
                            ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Drawer */}
      {selectedTxn && (
        <TransactionDetailsDrawer
          transaction={selectedTxn}
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onReversalSuccess={() => router.refresh()}
        />
      )}

      {/* Direct Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        treasuryAccounts={accounts}
        onSuccess={() => router.refresh()}
      />

      {/* Treasury Transfer Modal */}
      <TreasuryTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        treasuryAccounts={accounts}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}