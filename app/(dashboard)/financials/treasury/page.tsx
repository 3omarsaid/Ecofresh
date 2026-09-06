export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Landmark,
  Plus,
  Coins,
  Banknote,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { getTreasuryAccountsWithReconciliation } from "@/actions/treasury";
import { getStations } from "@/actions/stations";
import { getFinancialDashboardMetrics } from "@/actions/financials";
import { TreasuryViewWrapper } from "@/components/modules/financials/treasury-view-wrapper";
import { TreasuryActionBar } from "@/components/modules/financials/treasury-action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "الخزينة والحسابات البنكية — Nilotic Frost ERP",
};

export default async function TreasuryPage() {
  const [accounts, stations, metrics] = await Promise.all([
    getTreasuryAccountsWithReconciliation(),
    getStations(),
    getFinancialDashboardMetrics(),
  ]);

  const stationMap = new Map(stations.map((s) => [s.id, s.name]));

  // Currency-separated liquidity values (Strictly No mixing currencies)
  const formattedEgp = new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(metrics.totalEgpLiquidity);

  const formattedEur = new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(metrics.totalEurLiquidity);

  const formattedUsd = new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(metrics.totalUsdLiquidity);

  const todayNet = metrics.todayNetMovement;
  const isAllReconciled = metrics.reconciliationSummary.allBalanced;

  const enrichedAccounts = accounts.map((acc) => ({
    ...acc,
    stationName: acc.stationId ? stationMap.get(acc.stationId) : null,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#012d1d] text-white shadow-sm">
            <Landmark className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مركز التحكم بالخزينة والحسابات البنكية</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              مراقبة السيولة النقدية، تتبع التدفقات اللحظية، ومطابقة الأرصدة الدفترية مع الأستاذ العام
            </p>
          </div>
        </div>

        {/* Action Bar (Direct Expense & Account Transfer Modals) */}
        <TreasuryActionBar accounts={accounts} />
      </div>

      {/* Reconciliation Health Strip */}
      <div
        className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm ${
          isAllReconciled
            ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
            : "bg-rose-50 border-rose-200 text-rose-950"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl text-white ${
              isAllReconciled ? "bg-emerald-700" : "bg-rose-700"
            }`}
          >
            {isAllReconciled ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold">
              {isAllReconciled
                ? "سلامة وتطابق الأرصدة الدفترية (Reconciliation: 100% Balanced)"
                : `تنبيه: تم رصد عدم تطابق في ${metrics.reconciliationSummary.mismatchCount} حسابات مالية`}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {isAllReconciled
                ? `جميع أرصدة الحسابات البالغة (${metrics.reconciliationSummary.totalAccounts}) مطابقة بالكامل مع مجموع القيود المالية المعتمدة في الأستاذ العام.`
                : "يرجى مراجعة الحسابات المعلمة للتأكد من القيود وسندات التسوية."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold">
          <span className="bg-white/90 px-3 py-1.5 rounded-lg border border-gray-200">
            الحسابات المطابقة: {metrics.reconciliationSummary.balancedCount} / {metrics.reconciliationSummary.totalAccounts}
          </span>
        </div>
      </div>

      {/* Currency Liquidity KPI Strip (Strict Separation) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* EGP Liquidity */}
        <Card className="border-gray-200 bg-gradient-to-br from-emerald-950 via-[#012d1d] to-teal-900 text-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-200">سيولة الجنيه المصري (EGP)</p>
              <div className="flex items-baseline gap-2 mt-1.5 dir-ltr">
                <span className="text-2xl font-extrabold text-white">{formattedEgp}</span>
                <span className="text-sm font-bold text-emerald-300">ج.م</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 mt-1.5">
                خزائن نقدية: {metrics.treasuryCashBalance.toLocaleString()} | بنوك: {metrics.bankBalance.toLocaleString()}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
              <Banknote className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* EUR Liquidity */}
        <Card className="border-gray-200 bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-200">سيولة اليورو (EUR)</p>
              <div className="flex items-baseline gap-2 mt-1.5 dir-ltr">
                <span className="text-2xl font-extrabold text-white">{formattedEur}</span>
                <span className="text-sm font-bold text-purple-300">EUR (€)</span>
              </div>
              <p className="text-[11px] text-purple-300/80 mt-1.5">
                حسابات حصائل وعقود التصدير الخارجية
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-purple-300">
              <Coins className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* USD Liquidity */}
        <Card className="border-gray-200 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 text-white shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-200">سيولة الدولار الأمريكي (USD)</p>
              <div className="flex items-baseline gap-2 mt-1.5 dir-ltr">
                <span className="text-2xl font-extrabold text-white">{formattedUsd}</span>
                <span className="text-sm font-bold text-blue-300">USD ($)</span>
              </div>
              <p className="text-[11px] text-blue-300/80 mt-1.5">
                حسابات النولون البحري ومستلزمات الاستيراد
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-300">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Cash Flow Tracker Strip */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>ملخص حركة السيولة والعمليات اليوم (Today&apos;s Liquidity Flow)</span>
          </div>
          <span className="text-xs font-mono font-bold bg-white text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {metrics.todayTxnCount} عمليات مسجلة اليوم
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-xl p-3.5 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium block">المقبوضات / الوارد اليوم</span>
              <strong className="text-lg font-bold text-emerald-700 font-mono">
                +{metrics.todayInflow.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
              </strong>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-3.5 border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium block">المدفوعات / المنصرف اليوم</span>
              <strong className="text-lg font-bold text-rose-700 font-mono">
                -{metrics.todayOutflow.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
              </strong>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-xl p-3.5 border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium block">صافي حركة اليوم</span>
              <strong
                className={`text-lg font-bold font-mono ${
                  todayNet >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {todayNet >= 0 ? "+" : ""}
                {todayNet.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
              </strong>
            </div>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                todayNet >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              <Coins className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Treasury Accounts Grid with Live Adjustment */}
      <TreasuryViewWrapper accounts={enrichedAccounts} />
    </div>
  );
}