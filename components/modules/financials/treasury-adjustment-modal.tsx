"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adjustTreasuryAccountBalance } from "@/actions/financials";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Scale,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";

interface TreasuryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: {
    id: string;
    name: string;
    currency: string;
    balance: number;
    type: string;
  } | null;
  onSuccess?: () => void;
}

export function TreasuryAdjustmentModal({
  isOpen,
  onClose,
  account,
  onSuccess,
}: TreasuryAdjustmentModalProps) {
  const router = useRouter();

  const [actualBalance, setActualBalance] = useState<number | "">("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!account) return null;

  const currentBalance = Number(account.balance) || 0;
  const numActual = typeof actualBalance === "number" && !isNaN(actualBalance) ? actualBalance : currentBalance;
  const difference = numActual - currentBalance;
  const isIncrease = difference > 0;
  const absDiff = Math.abs(difference);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (actualBalance === "" || isNaN(actualBalance)) {
      setErrorMessage("يرجى إدخال الرصيد الفعلي بعد الجرد");
      return;
    }

    if (Math.abs(difference) < 0.01) {
      setErrorMessage("الرصيد الفعلي مطابق للرصيد الدفتري، لا توجد فروق تستدعي التسوية");
      return;
    }

    if (!reason || reason.trim().length < 5) {
      setErrorMessage("يرجى توضيح سبب تسوية الفارق بالتفصيل (5 أحرف على الأقل)");
      return;
    }

    setIsSubmitting(true);
    const res = await adjustTreasuryAccountBalance({
      accountId: account.id,
      actualBalance: numActual,
      reason,
    });
    setIsSubmitting(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      router.refresh();
      onClose();
    } else {
      setErrorMessage(res.error || "حدث خطأ أثناء قيد تسوية الرصيد");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-right dir-rtl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-slate-900 to-[#012d1d] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                تسوية جرد رصيد الخزينة
              </DialogTitle>
              <p className="text-xs text-emerald-200/90 mt-1">
                قيد سند تسوية مالي وتحديث رصيد الحساب مع حفظ سجل التدقيق
              </p>
            </div>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs font-mono">
              {account.id}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">اسم الحساب المالي:</span>
              <span className="font-bold text-gray-900">{account.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الرصيد الدفتري الحالي:</span>
              <span className="font-mono font-bold text-[#012d1d]">
                {currentBalance.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} {account.currency}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="actualBal" className="text-xs font-bold text-gray-700">
              الرصيد الفعلي الحقيقي بعد الجرد ({account.currency}) *
            </Label>
            <Input
              id="actualBal"
              type="number"
              step="any"
              value={actualBalance}
              onChange={(e) =>
                setActualBalance(e.target.value === "" ? "" : parseFloat(e.target.value))
              }
              placeholder="أدخل ناتج الجرد الفعلي..."
              className="font-mono text-base font-bold text-left dir-ltr"
              required
              autoFocus
            />
          </div>

          {actualBalance !== "" && Math.abs(difference) >= 0.01 && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold ${
                isIncrease
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                {isIncrease ? "فائض نقدية (زيادة ستضاف):" : "عجز نقدية (خصم سيتم قيده):"}
              </span>
              <span className="font-mono text-sm">
                {isIncrease ? "+" : "-"}
                {absDiff.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} {account.currency}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="adjReason" className="text-xs font-bold text-gray-700">
              سبب التسوية والمحضر المرفق *
            </Label>
            <Input
              id="adjReason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="محضر جرد خزينة بتاريخ... أو فروق تسوية..."
              className="text-xs"
              required
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || actualBalance === "" || Math.abs(difference) < 0.01}
              className="bg-[#012d1d] hover:bg-[#02472e] text-white font-bold gap-2 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري قيد التسوية...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  اعتماد التسوية وقيد السند
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}