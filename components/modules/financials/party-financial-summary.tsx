"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Coins,
  FileText,
  PlusCircle,
  Receipt,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PartyFinancialSummary as PartySummaryType } from "@/lib/data/ledger";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PartyPaymentCollectionModal } from "./party-payment-collection-modal";
import { formatCurrency } from "@/lib/currency";

interface PartyFinancialSummaryProps {
  summary: PartySummaryType;
  treasuryAccounts?: any[];
  showActions?: boolean;
}

export function PartyFinancialSummary({
  summary,
  treasuryAccounts = [],
  showActions = true,
}: PartyFinancialSummaryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isCustomer = summary.partyType === "customer";
  const isSupplier = summary.partyType === "supplier";
  const isContractor = summary.partyType === "contractor";

  // Balance status styling
  const isSettled = summary.remaining === 0;
  const isDueOnThem = isCustomer ? summary.remaining > 0 : summary.remaining < 0;
  const isDueToThem = isCustomer ? summary.remaining < 0 : summary.remaining > 0;

  const currentBalanceAmount = Math.abs(summary.remaining);

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {summary.partyName}
              </h2>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold px-2.5 py-0.5"
              >
                {summary.partyTypeLabel}
              </Badge>
              <span className="font-mono text-xs text-gray-400">({summary.partyId})</span>
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-0.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>آخر حركة مالية: </span>
              <strong className="text-gray-700">
                {summary.lastMovementRelative || "لا توجد حركات سابقة"}
              </strong>
              {summary.lastMovementType && (
                <span className="text-gray-400 font-mono text-[11px]">
                  • ({summary.lastMovementType})
                </span>
              )}
            </p>
          </div>

          {/* Quick Actions */}
          {showActions && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setIsModalOpen(true)}
                className={`gap-2 font-bold text-xs shadow-sm text-white ${
                  isCustomer
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                {isCustomer ? "تسجيل تحصيل من العميل" : "تسجيل سداد للطرف"}
              </Button>

              <Button asChild variant="outline" className="gap-1.5 text-xs font-semibold text-gray-700">
  <Link href={`/financials/parties/${summary.partyId}`}>
                  <FileText className="w-4 h-4 text-primary" />
                  كشف الحساب
                </Link>
</Button>
            </div>
          )}
        </div>

        {/* Hero Current Balance & Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-5">
          {/* 1. HERO CURRENT BALANCE */}
          <div
            className={`p-5 rounded-xl border flex flex-col justify-between ${
              isSettled
                ? "bg-gray-50 border-gray-200 text-gray-800"
                : isDueOnThem
                ? "bg-rose-50/70 border-rose-200 text-rose-900"
                : "bg-blue-50/70 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                الرصيد المالي الحالي
              </span>
              <div
                className={`p-2 rounded-lg ${
                  isSettled
                    ? "bg-gray-200 text-gray-700"
                    : isDueOnThem
                    ? "bg-rose-200/80 text-rose-800"
                    : "bg-blue-200/80 text-blue-800"
                }`}
              >
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-500 mb-1">
                {isCustomer
                  ? summary.remaining > 0
                    ? "مستحق على العميل (مدين للشركة)"
                    : summary.remaining < 0
                    ? "رصيد دائن لصالح العميل (مقدم)"
                    : "حساب العميل مسدد بالكامل"
                  : summary.remaining > 0
                  ? "مستحق للطرف عند الشركة (دائن)"
                  : summary.remaining < 0
                  ? "دفعة مقدمة للطرف (مدين)"
                  : "حساب الطرف مسدد بالكامل"}
              </div>

              <div className="text-2xl md:text-3xl font-extrabold font-mono flex items-baseline gap-1.5">
                <span>{summary.balanceText}</span>
              </div>
            </div>
          </div>

          {/* 2. TOTAL DUE */}
          <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                {isCustomer ? "إجمالي المطلوب (المبيعات)" : "إجمالي المستحق (المشتريات/الأتعاب)"}
              </span>
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl md:text-2xl font-bold font-mono text-gray-900">
                {formatCurrency(summary.totalDue)}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isCustomer ? "إجمالي فواتير الشحن والاستحقاق" : "إجمالي استحقاقات التوريد أو التشغيل"}
              </p>
            </div>
          </div>

          {/* 3. TOTAL PAID / COLLECTED */}
          <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                {isCustomer ? "إجمالي المحصل" : "إجمالي المدفوع"}
              </span>
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl md:text-2xl font-bold font-mono text-gray-900">
                {formatCurrency(summary.totalPaidOrCollected)}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isCustomer ? "إجمالي سندات القبض المعتمدة" : "إجمالي سندات الصرف المعتمدة"}
              </p>
            </div>
          </div>

          {/* 4. REMAINING */}
          <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">صافي المتبقي</span>
              <div
                className={`p-2 rounded-lg ${
                  summary.remaining !== 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div
                className={`text-xl md:text-2xl font-bold font-mono ${
                  summary.remaining > 0
                    ? isCustomer
                      ? "text-rose-700"
                      : "text-blue-700"
                    : summary.remaining < 0
                    ? "text-purple-700"
                    : "text-emerald-700"
                }`}
              >
                {formatCurrency(Math.abs(summary.remaining))}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                الفارق المالي المستحق للتسوية
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Collection / Payment */}
      {isModalOpen && (
        <PartyPaymentCollectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          partyId={summary.partyId}
          partyName={summary.partyName}
          partyType={summary.partyType}
          initialDue={summary.totalDue}
          initialPaidOrCollected={summary.totalPaidOrCollected}
          initialRemaining={summary.remaining}
          treasuryAccounts={treasuryAccounts}
        />
      )}
    </div>
  );
}
