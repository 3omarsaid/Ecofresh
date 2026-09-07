export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { getGeneralLedger } from "@/lib/data/ledger";
import { getFinancialDashboardMetrics } from "@/actions/financials";
import { formatCurrency } from "@/lib/currency";
import { GeneralLedgerTable } from "@/components/modules/financials/general-ledger-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Receipt,
  Building2,
  Users,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { PaginationControls } from "@/components/modules/common/pagination-controls";

interface PageProps {
  searchParams: {
    tab?: string;
    type?: string;
    search?: string;
    page?: string;
  };
}

export default async function GeneralLedgerPage({ searchParams }: PageProps) {
  const currentTab = (searchParams.tab as "all" | "ar" | "ap" | "contractors") || "all";
  const currentPage = Number(searchParams.page) || 1;

  const [ledgerData, metrics] = await Promise.all([
    getGeneralLedger({
      tab: currentTab,
      type: searchParams.type,
      search: searchParams.search,
      page: currentPage,
      pageSize: 25,
    }),
    getFinancialDashboardMetrics(),
  ]);

  const todayNet = metrics.todayNetMovement;
  const isAllReconciled = metrics.reconciliationSummary.allBalanced;

  const tabs = [
    { id: "all", label: "الكل (All)", icon: BookOpen },
    { id: "ar", label: "العملاء (AR)", icon: Users },
    { id: "ap", label: "الموردون (AP)", icon: Building2 },
    { id: "contractors", label: "مقاولو العمالة", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            دفتر الأستاذ العام الموحد (General Ledger)
          </h1>
          <p className="text-muted-foreground mt-1">
            سجل مركزي لكافة القيود المالية والاستحقاقات التلقائية وسندات الخزينة مصنفة حسب الأطراف
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="gap-2 text-xs bg-[#196b24] hover:bg-[#13571d] text-white font-bold shadow-xs">
            <Link href="/financials/statements">
              <FileText className="w-4 h-4" />
              كشوف الحسابات (الدفتر)
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 text-xs">
            <Link href="/reports/aging">
              <Clock className="w-4 h-4" />
              أعمار الديون (AR/AP)
            </Link>
          </Button>
          <a href="/api/export/excel/ledger" download>
            <Button variant="outline" className="gap-2 text-xs">
              <BookOpen className="w-4 h-4" />
              تصدير Excel
            </Button>
          </a>
          <Button asChild className="gap-2 text-xs bg-[#012d1d] hover:bg-[#02472e] text-white font-bold">
            <Link href="/financials/transactions/new">
              <Plus className="w-4 h-4" />
              إضافة سند مالي جديد
            </Link>
          </Button>
        </div>
      </div>

      {/* Financial Health 4-KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer AR Due */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">مستحقات على العملاء (AR)</span>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {formatCurrency(metrics.totalArDue)}
          </div>
          <span className="text-[11px] text-emerald-600 block">ديون قائمة مطلوب تحصيلها</span>
        </div>

        {/* Supplier / Contractor AP Due */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">مستحقات للموردين والمقاولين (AP)</span>
            <Building2 className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {formatCurrency(metrics.totalApDue)}
          </div>
          <span className="text-[11px] text-amber-600 block">التزامات شراء وتشغيل واجبة السداد</span>
        </div>

        {/* Available Liquidity */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">السيولة المتاحة (خزائن وبنوك)</span>
            <Landmark className="h-5 w-5 text-[#012d1d]" />
          </div>
          <div className="text-2xl font-bold text-[#012d1d] font-mono">
            {formatCurrency(metrics.totalEgpLiquidity)}
          </div>
          <span className="text-[11px] text-gray-500 block font-mono">
            نقدية: {formatCurrency(metrics.treasuryCashBalance)} | بنك: {formatCurrency(metrics.bankBalance)}
          </span>
        </div>

        {/* Today's Flow */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">صافي حركة اليوم ({metrics.todayTxnCount} حركات)</span>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              todayNet >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {todayNet >= 0 ? "+" : ""}
            {formatCurrency(todayNet)}
          </div>
          <span className="text-[11px] text-gray-500 block">
            وارد: +{formatCurrency(metrics.todayInflow)} | منصرف: -{formatCurrency(metrics.todayOutflow)}
          </span>
        </div>
      </div>

      {/* Navigation Tabs Header */}
      <div className="flex border-b border-border space-x-2 space-x-reverse overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <Link
              key={t.id}
              href={`/financials?tab=${t.id}`}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Main Ledger Table */}
      <div className="space-y-0">
        <GeneralLedgerTable
          initialTransactions={ledgerData.transactions}
          currentTab={currentTab}
        />
        <PaginationControls
          currentPage={currentPage}
          totalPages={ledgerData.totalPages}
          totalCount={ledgerData.totalCount}
          pageSize={ledgerData.pageSize}
        />
      </div>
    </div>
  );
}