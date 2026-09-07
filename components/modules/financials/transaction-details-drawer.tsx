"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cancelFinancialTransaction } from "@/actions/financials";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Landmark,
  Loader2,
  Receipt,
  RotateCcw,
  ShieldAlert,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export interface TransactionDetailData {
  txnId: string;
  date: Date | string;
  type: string;
  partyType?: string;
  partyId?: string;
  partyName?: string;
  amountEgp: number;
  amountCurrency?: number | null;
  currency?: string | null;
  refDoc?: string | null;
  description?: string | null;
  accountId?: string | null;
  accountName?: string | null;
  status: string;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  sourceLink?: string | null;
  createdByName?: string | null;
}

interface TransactionDetailsDrawerProps {
  transaction: TransactionDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  onReversalSuccess?: () => void;
}

export function TransactionDetailsDrawer({
  transaction,
  isOpen,
  onClose,
  onReversalSuccess,
}: TransactionDetailsDrawerProps) {
  const router = useRouter();
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!transaction) return null;

  const isCollection =
    transaction.type.includes("تحصيل") ||
    transaction.type.includes("وارد") ||
    transaction.type.includes("Inflow");

  const isCancelled = transaction.status === "ملغاة";

  // Calculate deep link if not explicit
  let sourceLink = transaction.sourceLink;
  if (!sourceLink && transaction.refDoc) {
    if (transaction.refDoc.startsWith("SHP-")) sourceLink = `/shipments`;
    else if (transaction.refDoc.startsWith("LOT-")) sourceLink = `/raw-purchases`;
    else if (transaction.refDoc.startsWith("DEAL-")) sourceLink = `/finished-purchases`;
    else if (transaction.refDoc.startsWith("PR-")) sourceLink = `/processing-operations`;
  }

  const handleExecuteCancel = async () => {
    if (!cancelReason || cancelReason.trim().length < 5) {
      setCancelError("يرجى كتابة سبب الإلغاء بالتفصيل (5 أحرف على الأقل)");
      return;
    }

    setIsSubmittingCancel(true);
    setCancelError(null);

    const res = await cancelFinancialTransaction(transaction.txnId, cancelReason);
    setIsSubmittingCancel(false);

    if (res.success) {
      setShowCancelPrompt(false);
      if (onReversalSuccess) onReversalSuccess();
      router.refresh();
      onClose();
    } else {
      setCancelError(res.error || "حدث خطأ أثناء إلغاء السند");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg text-right dir-rtl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-[#012d1d] to-[#02472e] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-bold font-mono">
                  {transaction.txnId}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={
                    isCancelled
                      ? "bg-rose-500/20 text-rose-200 border-rose-400 font-bold"
                      : "bg-emerald-500/20 text-emerald-200 border-emerald-400 font-bold"
                  }
                >
                  {isCancelled ? "سند ملغي" : "سند معتمد"}
                </Badge>
              </div>
              <p className="text-xs text-emerald-100/90 flex items-center gap-1.5">
                <span>نوع الحركة:</span>
                <strong className="text-white">{transaction.type}</strong>
              </p>
            </div>

            <div className="p-2.5 bg-white/10 rounded-xl text-white">
              <Receipt className="w-6 h-6 text-cyan-300" />
            </div>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Main Amount Hero */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 block">قيمة السند المسجل</span>
              <div
                className={`text-2xl font-extrabold font-mono flex items-baseline gap-1 mt-0.5 ${
                  isCollection ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                <span>{isCollection ? "+" : "-"}</span>
                <span>{formatCurrency(transaction.amountEgp)}</span>
              </div>
            </div>

            <div className="text-left font-mono text-xs text-gray-500 space-y-1">
              {transaction.balanceBefore !== null && transaction.balanceBefore !== undefined && (
                <div>
                  <span className="text-[10px] text-gray-400 block">الرصيد قبل:</span>
                  <span className="font-bold text-gray-700">
                    {formatCurrency(transaction.balanceBefore)}
                  </span>
                </div>
              )}
              {transaction.balanceAfter !== null && transaction.balanceAfter !== undefined && (
                <div>
                  <span className="text-[10px] text-gray-400 block">الرصيد بعد:</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(transaction.balanceAfter)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Details Table */}
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden text-xs">
            {/* Party */}
            {transaction.partyName && (
              <div className="flex justify-between p-3 bg-white">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" /> الطرف المتعامل:
                </span>
                <div className="text-left font-bold text-gray-900">
                  <span>{transaction.partyName}</span>
                  {transaction.partyType && (
                    <span className="block text-[10px] text-gray-400 font-normal">
                      {transaction.partyType} ({transaction.partyId})
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex justify-between p-3 bg-gray-50/50">
              <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" /> تاريخ الحركة:
              </span>
              <span className="font-mono font-bold text-gray-800">
                {new Date(transaction.date).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Treasury / Account */}
            {transaction.accountName && (
              <div className="flex justify-between p-3 bg-white">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-gray-400" /> الحساب المالي (الخزينة/البنك):
                </span>
                <span className="font-bold text-gray-900">{transaction.accountName}</span>
              </div>
            )}

            {/* Reference Doc & Source Link */}
            {transaction.refDoc && (
              <div className="flex justify-between items-center p-3 bg-gray-50/50">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> المستند المرجعي:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {transaction.refDoc}
                  </span>
                  {sourceLink && (
                    <Link
                      href={sourceLink}
                      className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-bold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      فتح العملية
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="p-3 bg-white space-y-1">
              <span className="text-gray-500 font-semibold block">البيان والشرح:</span>
              <p className="text-gray-800 font-medium leading-relaxed">
                {transaction.description || "لا يوجد وصف مدون للسند."}
              </p>
            </div>
          </div>

          {/* Cancellation section */}
          {!isCancelled && (
            <div className="pt-2 border-t border-gray-100">
              {!showCancelPrompt ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelPrompt(true)}
                  className="w-full text-rose-700 border-rose-200 hover:bg-rose-50 text-xs font-bold gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  إلغاء وعكس أثر هذا السند (Reversal)
                </Button>
              ) : (
                <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      تأكيد إلغاء القيد المالي:
                    </span>
                    <p className="text-[11px] text-rose-800">
                      سيتم عكس أثر الحركة على رصيد الخزينة ورصيد الطرف المتعامل تلقائياً.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cReason" className="text-xs font-bold text-rose-900">
                      سبب الإلغاء (إلزامي) *
                    </Label>
                    <Input
                      id="cReason"
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="اكتب سبب إلغاء هذا السند..."
                      className="text-xs bg-white"
                      autoFocus
                    />
                  </div>

                  {cancelError && (
                    <div className="text-[11px] text-rose-700 font-bold bg-white p-2 rounded border border-rose-300">
                      {cancelError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSubmittingCancel}
                      onClick={() => {
                        setShowCancelPrompt(false);
                        setCancelError(null);
                      }}
                      className="text-xs"
                    >
                      تراجع
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSubmittingCancel || cancelReason.trim().length < 5}
                      onClick={handleExecuteCancel}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5"
                    >
                      {isSubmittingCancel ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          جاري الإلغاء والعكس...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          تأكيد الإلغاء الآن
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-end">
          <Button variant="outline" onClick={onClose} className="text-xs font-semibold">
            إغلاق التفاصيل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
