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
  ArrowRight,
  CheckCircle2,
  Coins,
  Loader2,
  Receipt,
  ShieldAlert,
  Wallet,
} from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  treasuryAccounts?: any[];
  onSuccess?: () => void;
}

export function ExpenseModal({
  isOpen,
  onClose,
  treasuryAccounts: preloadedAccounts = [],
  onSuccess,
}: ExpenseModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<"INPUT" | "CONFIRM" | "SUCCESS">("INPUT");
  const [accounts, setAccounts] = useState<any[]>(preloadedAccounts);
  const [loadingAccounts, setLoadingAccounts] = useState(preloadedAccounts.length === 0);

  const [amount, setAmount] = useState<number | "">("");
  const [accountId, setAccountId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [expenseCategory, setExpenseCategory] = useState<string>("مصروفات صيانة وتشغيل");
  const [beneficiary, setBeneficiary] = useState<string>("");
  const [customNotes, setCustomNotes] = useState<string>("");

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
          if (active.length > 0) setAccountId(active[0].id);
        })
        .finally(() => setLoadingAccounts(false));
    } else if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const treasuryBalance = selectedAccount ? Number(selectedAccount.balance) : 0;

  const numAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  const balanceAfter = treasuryBalance - numAmount;
  const isOverdraft = numAmount > treasuryBalance;

  // Auto-composed accounting description
  const autoComposedDescription = customNotes.trim()
    ? `${expenseCategory} - ${beneficiary ? `${beneficiary}: ` : ""}${customNotes.trim()}`
    : `${expenseCategory} لصالح ${beneficiary || "المحطة"}`;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (numAmount <= 0) {
      setErrorMessage("يرجى إدخال قيمة صحيحة للمصروف");
      return;
    }

    if (!accountId) {
      setErrorMessage("يرجى اختيار الحساب المالي (الخزينة)");
      return;
    }

    if (isOverdraft) {
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

    const payload = {
      date,
      type: `مصروف تشغيلي (${expenseCategory})`,
      partyType: "مصروفات عامة",
      partyId: "EXPENSE-GEN",
      partyName: beneficiary || expenseCategory,
      amountEgp: numAmount,
      amountCurrency: null,
      currency: "EGP",
      refDoc: `EXP-${Date.now().toString().slice(-4)}`,
      accountId,
      description: autoComposedDescription,
    };

    const res = await addFinancialTransaction(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessData({
        txnId: res.data?.txnId,
        amount: numAmount,
        currency: "EGP",
        amountEgp: numAmount,
        accountName: selectedAccount?.name,
        newBalance: balanceAfter,
      });
      setStep("SUCCESS");
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      setErrorMessage(res.error || "حدث خطأ أثناء قيد المصروف");
      setStep("INPUT");
    }
  };

  const handleClose = () => {
    setStep("INPUT");
    setAmount("");
    setBeneficiary("");
    setCustomNotes("");
    setErrorMessage(null);
    setSuccessData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md text-right dir-rtl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-amber-900 to-stone-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                تسجيل مصروف تشغيلي جديد
              </DialogTitle>
              <p className="text-xs text-amber-200/90 mt-1">
                صرف مباشر من الخزينة أو البنك مع تحديث الرصيد الفوري
              </p>
            </div>
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
              صرف نقدية 🔴
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6">
          {step === "INPUT" && (
            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              {/* Treasury Selector & Current Balance */}
              <div className="space-y-1.5">
                <Label htmlFor="account" className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>الحساب المالي المنصرف منه (الخزينة / البنك) *</span>
                  {selectedAccount && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 text-[10px]">
                      جنيه مصري (ج.م)
                    </Badge>
                  )}
                </Label>
                {loadingAccounts ? (
                  <div className="text-xs text-gray-400">جاري تحميل الحسابات...</div>
                ) : (
                  <select
                    id="account"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-amber-900"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — رصيده: {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-bold text-gray-700">
                  قيمة المصروف (ج.م) *
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

              {/* Live Treasury Before & After Strip in EGP */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>الرصيد الحالي للخزينة:</span>
                  <span className="font-mono font-bold text-gray-800">
                    {formatCurrency(treasuryBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>قيمة المصروف:</span>
                  <span className="font-mono font-bold text-rose-600">
                    - {formatCurrency(numAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 font-bold">
                  <span className="text-gray-900">الرصيد بعد العملية:</span>
                  <span
                    className={`font-mono text-sm ${
                      isOverdraft ? "text-rose-600" : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(balanceAfter)}
                  </span>
                </div>
              </div>

              {isOverdraft && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    رصيد الحساب المالي ({formatCurrency(treasuryBalance)}) لا يكفي لتغطية هذا المصروف.
                  </span>
                </div>
              )}

              {/* Category & Beneficiary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cat" className="text-xs font-bold text-gray-700">
                    بند المصروف
                  </Label>
                  <select
                    id="cat"
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold"
                  >
                    <option value="مصروفات صيانة وتشغيل">صيانة وتشغيل</option>
                    <option value="مصروفات نقل وشحن محلي">نقل ومشالات</option>
                    <option value="مصروفات كهرباء وطاقة">كهرباء وطاقة</option>
                    <option value="مصاريف جمركية وتخليص">تخليص جمركي</option>
                    <option value="مصاريف شهادات فحص">شهادات فحص ومختبرات</option>
                    <option value="بوفيه ومستلزمات إدارية">إداريات وضيافة</option>
                    <option value="مصروفات نثرية أخرى">نثريات أخرى</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ben" className="text-xs font-bold text-gray-700">
                    المستلم / الجهة
                  </Label>
                  <Input
                    id="ben"
                    type="text"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                    placeholder="اسم المستلم أو الورشة..."
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Details and Auto-Composed Description Preview */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-bold text-gray-700">
                  تفاصيل إضافية (اختياري)
                </Label>
                <Input
                  id="notes"
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="ملاحظات تفصيلية أو رقم فاتورة..."
                  className="text-xs"
                />
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-600">
                  <span className="font-semibold text-gray-700">البيان المسجل آلياً: </span>
                  <span className="font-sans">{autoComposedDescription}</span>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <Label htmlFor="date" className="text-xs font-bold text-gray-700">
                  تاريخ الصرف
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
                  disabled={numAmount <= 0 || isOverdraft}
                  className="bg-amber-900 hover:bg-amber-950 text-white font-bold gap-2"
                >
                  التالي: مراجعة الصرف
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Button>
              </DialogFooter>
            </form>
          )}

          {step === "CONFIRM" && (
            <div className="space-y-5">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <h4 className="font-bold text-amber-900">مراجعة صرف المصروف:</h4>
                <p className="text-amber-800">
                  يرجى التأكد من البيانات قبل خصم المبلغ نهائياً من رصيد الحساب.
                </p>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden text-xs">
                <div className="flex justify-between p-3 bg-gray-50/50">
                  <span className="text-gray-500">الحساب المالي:</span>
                  <span className="font-bold text-gray-900">{selectedAccount?.name}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">بند المصروف:</span>
                  <span className="font-bold text-gray-900">{expenseCategory}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50/50">
                  <span className="text-gray-500">قيمة المصروف:</span>
                  <div className="text-left font-mono">
                    <span className="font-bold text-base text-rose-700 block">
                      {formatCurrency(numAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-gray-500">البيان المسجل:</span>
                  <span className="font-bold text-gray-900">{autoComposedDescription}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50/50">
                  <span className="text-gray-500">رصيد الحساب قبل:</span>
                  <span className="font-mono font-bold text-gray-700">
                    {formatCurrency(treasuryBalance)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-50 font-bold">
                  <span className="text-emerald-900">رصيد الحساب بعد الصرف:</span>
                  <span className="font-mono text-sm text-emerald-800">
                    {formatCurrency(balanceAfter)}
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
                  className="bg-amber-900 hover:bg-amber-950 text-white font-bold gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري القيد والخصم...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      تأكيد صرف المصروف
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "SUCCESS" && successData && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">تم صرف وقيد المصروف بنجاح!</h3>
                <p className="text-xs text-gray-500 font-mono">
                  رقم السند: <strong>{successData.txnId}</strong>
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-w-sm mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">المبلغ المنصرف:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {formatCurrency(successData.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الحساب:</span>
                  <span className="font-bold text-gray-900">{successData.accountName}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-bold">
                  <span className="text-gray-900">رصيد الحساب الجديد:</span>
                  <span className="font-mono text-emerald-700 text-sm">
                    {formatCurrency(successData.newBalance)}
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
