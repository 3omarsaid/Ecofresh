"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Wallet,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TreasuryAccountData {
  id: string;
  name: string;
  accountNumber?: string | null;
  bankName?: string | null;
  currency: string;
  balance: number | string | { toString(): string };
  type: string;
  stationId?: string | null;
  stationName?: string | null;
  isActive: boolean;
  reconciliationStatus?: 'BALANCED' | 'MISMATCH';
  calculatedBalance?: number;
  difference?: number;
  totalInflows?: number;
  totalOutflows?: number;
  activeTxnCount?: number;
}

interface TreasuryCardProps {
  account: TreasuryAccountData;
  onAdjustClick?: (account: TreasuryAccountData) => void;
}

export function TreasuryCard({ account, onAdjustClick }: TreasuryCardProps) {
  const isBank = account.type === "حساب بنكي جاري";
  const numericBalance = Number(account.balance) || 0;
  const isBalanced = account.reconciliationStatus !== 'MISMATCH';

  return (
    <Card className="border-gray-200 hover:shadow-md transition-shadow bg-white flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isBank ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isBank ? <Landmark className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">{account.name}</CardTitle>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{account.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[11px]"
            >
              ج.م
            </Badge>
            <Badge
              variant="secondary"
              className={`text-[11px] ${isBank ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}
            >
              {account.type}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3.5">
          {/* Balance Display */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">السيولة المتاحة</span>
            <div className="text-left dir-ltr">
              <span className="text-2xl font-extrabold text-[#012d1d]">{formatCurrency(numericBalance)}</span>
            </div>
          </div>

          {/* Reconciliation Status Badge */}
          <div className="flex items-center justify-between p-2.5 rounded-lg border text-xs bg-gray-50/70">
            <span className="text-gray-600 font-medium">حالة مطابقة الدفتر:</span>
            {isBalanced ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                مطابق 100%
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                يوجد فرق دفتري ({formatCurrency(account.difference || 0)})
              </span>
            )}
          </div>

          {/* Details List */}
          <div className="space-y-2 text-xs">
            {isBank && account.bankName && (
              <div className="flex justify-between items-center text-gray-600">
                <span>اسم البنك:</span>
                <span className="font-semibold text-gray-900">{account.bankName}</span>
              </div>
            )}
            {isBank && account.accountNumber && (
              <div className="flex justify-between items-center text-gray-600">
                <span>رقم الحساب:</span>
                <span className="font-mono text-gray-900 dir-ltr font-semibold">{account.accountNumber}</span>
              </div>
            )}
            {account.stationName && (
              <div className="flex justify-between items-center text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" /> المحطة التابعة:
                </span>
                <span className="font-semibold text-gray-900">{account.stationName}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-gray-600">
              <span>حالة الحساب:</span>
              {account.isActive ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> نشط وجاري
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                  <XCircle className="h-3.5 w-3.5" /> موقوف
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Card Footer Actions */}
      <div className="p-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-bold gap-1 text-primary hover:bg-emerald-50">
          <Link href={`/financials/transactions?account=${account.id}`}>
            <FileText className="w-3.5 h-3.5" />
            كشف حركات الحساب
          </Link>
        </Button>

        {onAdjustClick && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAdjustClick(account)}
            className="h-8 text-[11px] font-semibold gap-1 text-gray-600 hover:text-gray-900 border-gray-300"
          >
            <SlidersHorizontal className="w-3 h-3" />
            تسوية رصيد
          </Button>
        )}
      </div>
    </Card>
  );
}
