"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { addEmployeeTransaction } from "@/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Coins, Loader2, PlusCircle, ShieldAlert } from "lucide-react";

interface AddTransactionDialogProps {
  employeeId: string;
  employeeName: string;
  treasuryAccounts: Array<{ id: string; name: string; balance: number; currency: string }>;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddTransactionDialog({
  employeeId,
  employeeName,
  treasuryAccounts = [],
  trigger,
  onSuccess,
}: AddTransactionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("سلفة");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [treasuryAccountId, setTreasuryAccountId] = useState(
    treasuryAccounts.length > 0 ? treasuryAccounts[0].id : ""
  );
  const [refDoc, setRefDoc] = useState("");
  const [notes, setNotes] = useState("");

  // Determine nature of selected type
  const isNonCash = type === "خصم إداري" || type === "استحقاق راتب شهري" || type === "تسوية مستحقات غير نقدية";
  const isCashOutflow = type === "سلفة" || type === "صرف راتب" || type === "مكافأة" || type === "صرف عهدة" || type === "بدل انتقال";
  const isCashInflow = type === "سداد سلفة" || type === "تسوية عهدة نقدي";

  const selectedAccount = treasuryAccounts.find((a) => a.id === treasuryAccountId);
  const numericAmount = parseFloat(amount) || 0;
  const isOverdraft = isCashOutflow && selectedAccount && numericAmount > Number(selectedAccount.balance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side quick guard
    if (!isNonCash && !treasuryAccountId) {
      setError("يجب اختيار الخزينة أو الحساب البنكي للعمليات النقدية");
      setLoading(false);
      return;
    }

    if (isNonCash && treasuryAccountId) {
      // Clear for non-cash submission
    }

    try {
      const payload = {
        date,
        type,
        amount: numericAmount,
        treasuryAccountId: isNonCash ? null : treasuryAccountId,
        refDoc: refDoc || null,
        notes: notes || null,
      };

      const res = await addEmployeeTransaction(employeeId, payload);
      if (!res.success) {
        setError(res.error || "فشل قيد الحركة المالية");
      } else {
        setOpen(false);
        setAmount("");
        setNotes("");
        setRefDoc("");
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-bold shadow-sm">
            <Coins className="h-4 w-4" />
            + قيد حركة مالية
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-700" />
              <span>قيد حركة مالية: {employeeName}</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs text-gray-600">
              {employeeId}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-right">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="txnType" className="text-xs font-bold text-gray-700">نوع المعاملة *</Label>
              <select
                id="txnType"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-[#012d1d]"
              >
                <option value="صرف راتب">صرف راتب (منصرف من الخزينة)</option>
                <option value="سلفة">سلفة (منصرف من الخزينة)</option>
                <option value="مكافأة">مكافأة (منصرف من الخزينة)</option>
                <option value="خصم إداري">خصم إداري / جزاء (بدون خزينة)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">المبلغ (ج.م) *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="text-sm font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">تاريخ الحركة *</Label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">رقم الإذن / المرجع</Label>
              <Input
                value={refDoc}
                onChange={(e) => setRefDoc(e.target.value)}
                placeholder="ADV-2026-001"
                className="text-sm font-mono"
              />
            </div>
          </div>

          {/* Conditional Treasury Account Selector */}
          {!isNonCash ? (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="treasuryAccount" className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-emerald-700" />
                  الخزينة / الحساب البنكي المتأثر *
                </Label>
                {selectedAccount && (
                  <span className="text-[11px] text-gray-500 font-mono">
                    الرصيد المتاح: {Number(selectedAccount.balance).toLocaleString()} {selectedAccount.currency}
                  </span>
                )}
              </div>

              <select
                id="treasuryAccount"
                value={treasuryAccountId}
                onChange={(e) => setTreasuryAccountId(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#012d1d]"
              >
                {treasuryAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — ({Number(acc.balance).toLocaleString()} {acc.currency})
                  </option>
                ))}
              </select>

              {isOverdraft && (
                <div className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  تنبيه: المبلغ المطلوب أكبر من رصيد الخزينة المتاح! سيتم رفض العملية من الخادم.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                هذه الحركة <strong>إدارية وغير نقدية</strong>؛ سيتم قيد الأثر في كشف حساب الموظف فقط دون التأثير على رصيد الخزائن.
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">البيان والملاحظات</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="صرف سلفة على ذمة راتب الشهر..."
              className="text-sm"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading || (isOverdraft && isCashOutflow)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد وقيد الحركة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
