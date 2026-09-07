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
import { addFinancialTransaction } from "@/actions/financials";
import { getTreasuryAccounts } from "@/actions/treasury";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  FileText,
  Landmark,
  Loader2,
  ShieldAlert,
  Wallet,
} from "lucide-react";

interface PartyPaymentCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  partyId: string;
  partyName: string;
  partyType: "customer" | "supplier" | "contractor" | "other";
  initialDue: number;
  initialPaidOrCollected: number;
  initialRemaining: number;
  treasuryAccounts?: any[];
  onSuccess?: () => void;
}

export function PartyPaymentCollectionModal({
  isOpen,
  onClose,
  partyId,
  partyName,
  partyType,
  initialDue,
  initialPaidOrCollected,
  initialRemaining,
  treasuryAccounts: preloadedAccounts = [],
  onSuccess,
}: PartyPaymentCollectionModalProps) {
  const router = useRouter();
  const isCustomer = partyType === "customer";

  const [step, setStep] = useState<"INPUT" | "CONFIRM" | "SUCCESS">("INPUT");
  const [accounts, setAccounts] = useState<any[]>(preloadedAccounts);
  const [loadingAccounts, setLoadingAccounts] = useState(preloadedAccounts.length === 0);

  // Form states
  const [amount, setAmount] = useState<number | "">("");
  const [accountId, setAccountId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [refDoc, setRefDoc] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Load accounts if not provided
  useEffect(() => {
    if (accounts.length === 0) {
      setLoadingAccounts(true);
      getTreasuryAccounts()
        .then((accs) => {
          const active = accs.filter((a: any) => a.isActive);
          setAccounts(active);
          if (active.length > 0) setAccountId(active[0].id);
        })
        .finally(() => setLoadingAccounts(false));
    } else if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Selected Treasury
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const treasuryBalance = selectedAccount ? Number(selectedAccount.balance) : 0;

  // Live calculations
  const numAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const remainingBefore = initialRemaining;
  const remainingAfter = remainingBefore - numAmount;

  // Treasury after
  const treasuryAfter = isCustomer
    ? treasuryBalance + numAmount
    : treasuryBalance - numAmount;

  // Validation
  const isTreasuryOverdraft = !isCustomer && numAmount > treasuryBalance;
  const isOverRemaining = numAmount > remainingBefore && remainingBefore > 0;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (numAmount <= 0) {
      setErrorMessage("يرجى إدخال مبلغ صحيح أكبر من صفر");
      return;
    }

    if (!accountId) {
      setErrorMessage("يرجى اختيار الحساب المالي (الخزينة أو البنك)");
      return;
    }

    if (isTreasuryOverdraft) {
      setErrorMessage(
        `رصيد الحساب المالي (${formatCurrency(treasuryBalance)}) لا يكفي لسداد ${formatCurrency(numAmount)}`
      );
      return;
    }

    setStep("CONFIRM");
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    let txnType = "";
    let pTypeLabel = "";

    if (isCustomer) {
      txnType = "تحصيل عميل (AR)";
      pTypeLabel = "عميل تصدير";
    } else if (partyType === "supplier") {
      txnType = "سداد مورد خام (AP)";
      pTypeLabel = "مورد معتمد";
    } else {
      txnType = "سداد مقاول عمالة";
      pTypeLabel = "مقاول تشغيل وعمالة";
    }

    const payload = {
      date,
      type: txnType,
      partyType: pTypeLabel,
      partyId,
      partyName,
      amountEgp: numAmount,
      amountCurrency: null,
      currency: "EGP",
      refDoc:
        refDoc ||
        (isCustomer
          ? `COL-${Date.now().toString().slice(-4)}`
          : `PAY-${Date.now().toString().slice(-4)}`),
      accountId,
      description:
        description ||
        (isCustomer
          ? `تحصيل دفعة مالية من العميل ${partyName}`
          : `سداد مستحقات للطرف ${partyName}`),
    };

    const res = await addFinancialTransaction(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessData({
        txnId: res.data?.txnId,
        amount: numAmount,
        currency: "EGP",
        amountEgp: numAmount,
        newRemaining: remainingAfter,
        accountName: selectedAccount?.name,
      });
      setStep("SUCCESS");
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      setErrorMessage(res.error || "حدث خطأ أثناء قيد السند المالي");
      setStep("INPUT");
    }
  };

  const handleClose = () => {
    setStep("INPUT");
    setAmount("");
    setErrorMessage(null);
    setSuccessData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl text-right dir-rtl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-[#012d1d] to-[#02472e] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-300" />
                {isCustomer ? "تسجيل سند تحصيل من عميل" : "تسجيل سند سداد لطرف"}
              </DialogTitle>
              <p className="text-xs text-emerald-100/90">
                الطرف المتعامل: <strong className="text-white">{partyName}</strong>
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-white/10 text-white border-white/20 text-xs"
            >
              {isCustomer ? "تدفق نقد وارد 🟢" : "تدفق نقد صادر 🔴"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* STEP 1: FORM INPUT */}
          {step === "INPUT" && (
            <form onSubmit={handleProceedToConfirm} className="space-y-5">
              {/* Financial Status Strip */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-gray-500 font-semibold block">
                    {isCustomer ? "إجمالي المطلوب" : "إجمالي المستحق"}
                  </span>
                  <span className="text-sm font-bold font-mono text-gray-800">
                    {formatCurrency(initialDue)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-gray-500 font-semibold block">
                    {isCustomer ? "تم تحصيله" : "تم سداده"}
                  </span>
                  <span className="text-sm font-bold font-mono text-blue-700">
                    {formatCurrency(initialPaidOrCollected)}
                  </span>
                </div>

                <div className="bg-white rounded-lg p-1.5 border border-gray-200">
                  <span className="text-[11px] text-gray-500 font-semibold block">
                    المتبقي قبل العملية
                  </span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      remainingBefore > 0
                        ? isCustomer
                          ? "text-rose-700"
                          : "text-blue-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(remainingBefore)}
                  </span>
                </div>
              </div>

              {/* Treasury Account Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="treasury" className="text-xs font-bold text-gray-700">
                  الحساب المالي (الخزينة أو البنك) *
                </Label>
                {loadingAccounts ? (
                  <div className="text-xs text-gray-400">جاري تحميل الحسابات المالية...</div>
                ) : (
                  <select
                    id="treasury"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#012d1d]"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) — رصيده: {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </select>
                )}

                {/* Treasury Overdraft warning for Payments */}
                {selectedAccount && !isCustomer && (
                  <div className="flex items-center justify-between text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-gray-500">رصيد الحساب بعد السداد:</span>
                    <span
                      className={`font-mono font-bold ${
                        isTreasuryOverdraft ? "text-rose-600" : "text-gray-800"
                      }`}
                    >
                      {formatCurrency(treasuryAfter)}
                    </span>
                  </div>
                )}

                {isTreasuryOverdraft && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-bold">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>رصيد الحساب لا يكفي لإتمام السداد (حماية ضد السحب المكشوف).</span>
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-bold text-gray-700">
                  {isCustomer ? "مبلغ التحصيل (ج.م) *" : "مبلغ السداد (ج.م) *"}
                </Label>
                <CurrencyInput
                  id="amount"
                  value={amount}
                  onChange={(val) => setAmount(typeof val === "number" ? val : "")}
                  placeholder="0.00"
                  required
                  autoFocus
                />

                {/* Over Remaining Warning */}
                {isOverRemaining && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      تنبيه: المبلغ المدخل ({formatCurrency(numAmount)}) أكبر من الرصيد المتبقي (
                      {formatCurrency(remainingBefore)}). سيتحول الحساب إلى رصيد دائن مقدم.
                    </span>
                  </div>
                )}

                {/* Live Remaining After Badge */}
                <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900">
                    {isCustomer ? "المتبقي على العميل بعد التحصيل:" : "المتبقي للطرف بعد السداد:"}
                  </span>
                  <span className="font-mono font-bold text-base text-emerald-800">
                    {formatCurrency(remainingAfter)}
                  </span>
                </div>
              </div>

              {/* Date & Reference Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-bold text-gray-700">
                    تاريخ السند
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

                <div className="space-y-1.5">
                  <Label htmlFor="refDoc" className="text-xs font-bold text-gray-700">
                    رقم الشيك / الإيصال / المستند المرجعي
                  </Label>
                  <Input
                    id="refDoc"
                    type="text"
                    value={refDoc}
                    onChange={(e) => setRefDoc(e.target.value)}
                    placeholder="مثال: CHQ-99120 أو إيصال 401"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="desc" className="text-xs font-bold text-gray-700">
                  البيان والشرح
                </Label>
                <Input
                  id="desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ملاحظات تفصيلية حول السند..."
                  className="text-xs"
                />
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
                  disabled={numAmount <= 0 || isTreasuryOverdraft}
                  className="bg-[#012d1d] hover:bg-[#02472e] text-white font-bold gap-2"
                >
                  التالي: مراجعة السند
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* STEP 2: CONFIRMATION STEP */}
          {step === "CONFIRM" && (
            <div className="space-y-5">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                <h3 className="text-sm font-bold text-amber-900">
                  يرجى مراجعة تفاصيل السند المالي قبل التأكيد النهائي:
                </h3>
                <p className="text-xs text-amber-800">
                  سيتم قيد هذا السند رسمياً في الأستاذ العام وتحديث رصيد الحساب المالي فوراً.
                </p>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white text-xs">
                <div className="flex justify-between p-3 bg-gray-50/50">
                  <span className="text-gray-500 font-semibold">نوع السند:</span>
                  <span className="font-bold text-gray-900">
                    {isCustomer ? "سند تحصيل نقدية (AR)" : "سند سداد نقدية (AP)"}
                  </span>
                </div>

                <div className="flex justify-between p-3">
                  <span className="text-gray-500 font-semibold">الطرف المتعامل:</span>
                  <span className="font-bold text-gray-900">{partyName}</span>
                </div>

                <div className="flex justify-between p-3 bg-gray-50/50">
                  <span className="text-gray-500 font-semibold">قيمة السند:</span>
                  <div className="text-left font-mono">
                    <span className="font-bold text-base text-emerald-700 block">
                      {formatCurrency(numAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between p-3">
                  <span className="text-gray-500 font-semibold">الحساب المالي:</span>
                  <span className="font-bold text-gray-900">
                    {selectedAccount?.name}
                  </span>
                </div>

                <div className="flex justify-between p-3 bg-gray-50/50">
                  <span className="text-gray-500 font-semibold">رصيد الطرف قبل السند:</span>
                  <span className="font-mono font-bold text-gray-700">
                    {formatCurrency(remainingBefore)}
                  </span>
                </div>

                <div className="flex justify-between p-3 bg-emerald-50 font-bold">
                  <span className="text-emerald-900">رصيد الطرف بعد تنفيذ السند:</span>
                  <span className="font-mono text-base text-emerald-800">
                    {formatCurrency(remainingAfter)}
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
                  تعديل البيانات
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري القيد والتحديث...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      تأكيد وقيد السند الآن
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* STEP 3: SUCCESS RESULT DISPLAY */}
          {step === "SUCCESS" && successData && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">تم تسجيل السند المالي بنجاح!</h3>
                <p className="text-xs text-gray-500 font-mono">
                  رقم القيد المسجل: <strong>{successData.txnId}</strong>
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-sm mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">المبلغ المسدد:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {formatCurrency(successData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الحساب المالي:</span>
                  <span className="font-bold text-gray-900">{successData.accountName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                  <span className="text-emerald-900">الرصيد المتبقي الجديد:</span>
                  <span className="font-mono text-emerald-700 text-sm">
                    {formatCurrency(successData.newRemaining)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleClose}
                  className="bg-[#012d1d] hover:bg-[#02472e] text-white font-bold px-8 shadow-sm"
                >
                  إتمام وإغلاق النافذة
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
