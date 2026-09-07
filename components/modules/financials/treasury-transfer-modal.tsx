"use client";

import React, { useState, useEffect } from "react";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/currency";
import { transferBetweenTreasuryAccounts } from "@/actions/financials";
import { getTreasuryAccounts } from "@/actions/treasury";
import {
  AlertCircle,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Landmark,
  Loader2,
  ShieldAlert,
  Wallet,
} from "lucide-react";

interface TreasuryTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasuryAccounts?: any[];
  onSuccess?: () => void;
}

export function TreasuryTransferModal({
  isOpen,
  onClose,
  treasuryAccounts: preloadedAccounts = [],
  onSuccess,
}: TreasuryTransferModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<"INPUT" | "CONFIRM" | "SUCCESS">("INPUT");
  const [accounts, setAccounts] = useState<any[]>(preloadedAccounts);
  const [loadingAccounts, setLoadingAccounts] = useState(preloadedAccounts.length === 0);

  const [sourceAccountId, setSourceAccountId] = useState<string>("");
  const [destinationAccountId, setDestinationAccountId] = useState<string>("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    if (accounts.length === 0) {
      setLoadingAccounts(true);
      getTreasuryAccounts()
        .then((accs) => {
          const active = accs.filter((a: any) => a.isActive);
          setAccounts(active);
          if (active.length >= 1) {
            setSourceAccountId(active[0].id);
          }
        })
        .finally(() => setLoadingAccounts(false));
    } else if (!sourceAccountId && accounts.length >= 1) {
      setSourceAccountId(accounts[0].id);
    }
  }, [accounts, sourceAccountId]);

  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);

  // Destination accounts can be any active account except source
  const compatibleDestAccounts = accounts.filter((a) => a.id !== sourceAccountId);

  useEffect(() => {
    if (sourceAccount) {
      const currentDest = accounts.find((a) => a.id === destinationAccountId);
      if (!currentDest || currentDest.id === sourceAccountId) {
        const firstMatching = accounts.find((a) => a.id !== sourceAccountId);
        setDestinationAccountId(firstMatching ? firstMatching.id : "");
      }
    }
  }, [sourceAccountId, sourceAccount, accounts, destinationAccountId]);

  const destAccount = accounts.find((a) => a.id === destinationAccountId);

  const sourceBalance = sourceAccount ? Number(sourceAccount.balance) : 0;
  const destBalance = destAccount ? Number(destAccount.balance) : 0;

  const numAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;

  const sourceAfter = sourceBalance - numAmount;
  const destAfter = destBalance + numAmount;

  const isOverdraft = numAmount > sourceBalance;
  const isSameAccount = Boolean(sourceAccountId && destinationAccountId && sourceAccountId === destinationAccountId);

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (numAmount <= 0) {
      setErrorMessage("يرجى إدخال مبلغ تحويل صحيح أكبر من صفر");
      return;
    }

    if (!sourceAccountId || !destinationAccountId) {
      setErrorMessage("يرجى تحديد كل من الحساب المصدر والحساب المستلم");
      return;
    }

    if (isSameAccount) {
      setErrorMessage("لا يمكن التحويل لنفس الحساب المالي");
      return;
    }

    if (isOverdraft) {
      setErrorMessage(
        `رصيد الحساب المصدر (${formatCurrency(sourceBalance)}) لا يكفي لتحويل ${formatCurrency(numAmount)}`
      );
      return;
    }

    setStep("CONFIRM");
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      date,
      sourceAccountId,
      destinationAccountId,
      amountEgp: numAmount,
      notes: notes || `مناقلة نقدية داخلية من ${sourceAccount?.name} إلى ${destAccount?.name}`,
    };

    const res = await transferBetweenTreasuryAccounts(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessData({
        transferRef: res.data?.transferRef,
        amount: numAmount,
        currency: "EGP",
        sourceName: sourceAccount?.name,
        destName: destAccount?.name,
        sourceAfter,
        destAfter,
      });
      setStep("SUCCESS");
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      setErrorMessage(res.error || "حدث خطأ أثناء إجراء التحويل");
      setStep("INPUT");
    }
  };

  const handleClose = () => {
    setStep("INPUT");
    setAmount("");
    setNotes("");
    setErrorMessage(null);
    setSuccessData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg text-right dir-rtl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-300" />
                تحويل نقدية داخلي (مناقلة خزائن وبنوك)
              </DialogTitle>
              <p className="text-xs text-blue-200/90 mt-1">
                نقل سيولة بين الحسابات بالجنيه المصري بدون التأثير على الإيرادات أو الأرباح
              </p>
            </div>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
              جنيه مصري (ج.م)
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6">
          {step === "INPUT" && (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              {/* Source Account */}
              <div className="space-y-1.5">
                <Label htmlFor="source" className="text-xs font-bold text-gray-700">
                  الحساب المالي المصدر (الخصم منه) *
                </Label>
                {loadingAccounts ? (
                  <div className="text-xs text-gray-400">جاري تحميل الحسابات...</div>
                ) : (
                  <select
                    id="source"
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-900"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — رصيده الحالي: {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Destination Account */}
              <div className="space-y-1.5">
                <Label htmlFor="dest" className="text-xs font-bold text-gray-700">
                  الحساب المالي المستلم (الإيداع إليه) *
                </Label>
                {compatibleDestAccounts.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>لا توجد حسابات أخرى للتحويل إليها.</span>
                  </div>
                ) : (
                  <select
                    id="dest"
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-blue-900"
                    required
                  >
                    <option value="">-- اختر الحساب المستلم --</option>
                    {compatibleDestAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — رصيده الحالي: {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-bold text-gray-700">
                  مبلغ التحويل (ج.م) *
                </Label>
                <CurrencyInput
                  id="amount"
                  value={amount}
                  onChange={(val) => setAmount(typeof val === "number" ? val : "")}
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>

              {/* Live Dual Balance Preview in Native Currency */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <div className="space-y-1">
                  <span className="text-gray-500 font-semibold block">المصدر بعد التحويل:</span>
                  <span
                    className={`font-mono font-bold block ${
                      isOverdraft ? "text-rose-600" : "text-gray-800"
                    }`}
                  >
                    {formatCurrency(sourceAfter)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    (قبل: {formatCurrency(sourceBalance)})
                  </span>
                </div>

                <div className="space-y-1 border-r border-gray-200 pr-3">
                  <span className="text-gray-500 font-semibold block">المستلم بعد التحويل:</span>
                  <span className="font-mono font-bold text-emerald-700 block">
                    {formatCurrency(destAfter)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    (قبل: {formatCurrency(destBalance)})
                  </span>
                </div>
              </div>

              {isOverdraft && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    رصيد الحساب المصدر ({formatCurrency(sourceBalance)}) لا يكفي لإجراء هذا التحويل.
                  </span>
                </div>
              )}

              {isSameAccount && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-bold">
                  لا يمكن التحويل لنفس الحساب المالي.
                </div>
              )}

              {/* Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="date" className="text-xs font-bold text-gray-700">
                    تاريخ التحويل
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs font-bold text-gray-700">
                    ملاحظات التحويل
                  </Label>
                  <Input
                    id="notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="سبب المناقلة..."
                    className="text-xs"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={
                    numAmount <= 0 ||
                    isOverdraft ||
                    isSameAccount ||
                    !destinationAccountId ||
                    compatibleDestAccounts.length === 0
                  }
                  className="bg-blue-900 hover:bg-blue-950 text-white font-bold gap-2"
                >
                  التالي: مراجعة التحويل
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Button>
              </DialogFooter>
            </form>
          )}

          {step === "CONFIRM" && (
            <div className="space-y-5">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <h4 className="font-bold text-blue-900">مراجعة التحويل المالي:</h4>
                <p className="text-blue-800">
                  سيتم خصم المبلغ من الحساب المصدر وإضافته للحساب المستلم لحظياً بالجنيه المصري.
                </p>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden text-xs">
                <div className="flex justify-between p-3 bg-gray-50/50">
                  <span className="text-gray-500">من الحساب (المصدر):</span>
                  <span className="font-bold text-gray-900">{sourceAccount?.name}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">إلى الحساب (المستلم):</span>
                  <span className="font-bold text-gray-900">{destAccount?.name}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50/50 font-bold">
                  <span className="text-gray-500">قيمة التحويل:</span>
                  <span className="font-mono text-base text-blue-800">
                    {formatCurrency(numAmount)}
                  </span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">رصيد المصدر بعد الخصم:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {formatCurrency(sourceAfter)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-50 font-bold">
                  <span className="text-emerald-900">رصيد المستلم بعد الإيداع:</span>
                  <span className="font-mono text-emerald-800">
                    {formatCurrency(destAfter)}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
                  {errorMessage}
                </div>
              )}

              <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setStep("INPUT")}
                >
                  تعديل
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-900 hover:bg-blue-950 text-white font-bold gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري التحويل...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      تأكيد وتنفيذ التحويل
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "SUCCESS" && successData && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">تم التحويل بنجاح!</h3>
                <p className="text-xs text-gray-500 font-mono">
                  المرجع المشترك: <strong>{successData.transferRef}</strong>
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-sm mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">المبلغ المحول:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatCurrency(successData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">رصيد {successData.sourceName}:</span>
                  <span className="font-mono font-bold text-gray-700">
                    {formatCurrency(successData.sourceAfter)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>رصيد {successData.destName}:</span>
                  <span className="font-mono">
                    {formatCurrency(successData.destAfter)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleClose}
                  className="bg-[#012d1d] hover:bg-[#02472e] text-white font-bold px-8"
                >
                  إتمام وإغلاق
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
