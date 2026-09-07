"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  Calendar,
  CreditCard,
  FileText,
  Landmark,
  Loader2,
  Save,
  Store,
  User,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  createStatementMovement,
  simulateMovementImpact,
} from "@/actions/account-statements";

interface PartyOption {
  id: string;
  name: string;
  code?: string;
  category?: string;
}

interface TreasuryOption {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface RecordMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPartyType?: string;
  initialPartyId?: string;
  initialPartyName?: string;
  partiesList: {
    suppliers: PartyOption[];
    customers: PartyOption[];
    contractors: PartyOption[];
    employees: PartyOption[];
  };
  treasuries: TreasuryOption[];
}

export function RecordMovementModal({
  isOpen,
  onClose,
  onSuccess,
  initialPartyType = "SUPPLIERS",
  initialPartyId = "",
  initialPartyName = "",
  partiesList,
  treasuries,
}: RecordMovementModalProps) {
  const [isPending, startTransition] = useTransition();

  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [movementType, setMovementType] = useState<string>("سداد لمورد");
  const [accountId, setAccountId] = useState<string>(treasuries[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState<string>("نقدي (Cash)");
  const [refDoc, setRefDoc] = useState<string>("");
  const [selectedPartyType, setSelectedPartyType] = useState<string>(initialPartyType);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(initialPartyId);
  const [selectedPartyName, setSelectedPartyName] = useState<string>(initialPartyName);
  const [amount, setAmount] = useState<number | "">("");
  const [notes, setNotes] = useState<string>("");

  // Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Simulation State (Real-time Financial Impact)
  const [simulation, setSimulation] = useState<{
    currentTreasuryBalance: number;
    newTreasuryBalance: number;
    currentPartyBalance: number;
    newPartyBalance: number;
    treasuryCurrency: string;
    hasOverdraft: boolean;
  }>({
    currentTreasuryBalance: 0,
    newTreasuryBalance: 0,
    currentPartyBalance: 0,
    newPartyBalance: 0,
    treasuryCurrency: "EGP",
    hasOverdraft: false,
  });

  // Sync initial props
  useEffect(() => {
    if (initialPartyType) setSelectedPartyType(initialPartyType);
    if (initialPartyId) setSelectedPartyId(initialPartyId);
    if (initialPartyName) setSelectedPartyName(initialPartyName);

    if (initialPartyType.toUpperCase().includes("CUSTOMER")) {
      setMovementType("تحصيل من عميل");
    } else if (initialPartyType.toUpperCase().includes("CONTRACTOR")) {
      setMovementType("سداد لمقاول");
    } else if (initialPartyType.toUpperCase().includes("EMPLOYEE")) {
      setMovementType("صرف سلفة");
    } else {
      setMovementType("سداد لمورد");
    }
  }, [initialPartyType, initialPartyId, initialPartyName]);

  // Available parties based on selected party type
  const activeParties = React.useMemo(() => {
    if (selectedPartyType.toUpperCase().includes("CUSTOMER")) return partiesList.customers;
    if (selectedPartyType.toUpperCase().includes("CONTRACTOR")) return partiesList.contractors;
    if (selectedPartyType.toUpperCase().includes("EMPLOYEE")) return partiesList.employees;
    return partiesList.suppliers;
  }, [selectedPartyType, partiesList]);

  // Set default party if none selected
  useEffect(() => {
    if (!selectedPartyId && activeParties.length > 0) {
      setSelectedPartyId(activeParties[0].id);
      setSelectedPartyName(activeParties[0].name);
    }
  }, [activeParties, selectedPartyId]);

  // Trigger Real-Time Financial Impact Simulation whenever amount, treasury, or party changes
  useEffect(() => {
    let isCancelled = false;

    async function runSimulation() {
      if (!selectedPartyId) return;

      const numAmount = typeof amount === "number" ? amount : 0;
      const res = await simulateMovementImpact({
        partyId: selectedPartyId,
        partyType: selectedPartyType,
        amount: numAmount,
        accountId: accountId || undefined,
        movementType,
      });

      if (!isCancelled && res.success && res.data) {
        setSimulation({
          currentTreasuryBalance: res.data.treasury.currentBalance,
          newTreasuryBalance: res.data.treasury.newBalance,
          currentPartyBalance: res.data.party.currentBalance,
          newPartyBalance: res.data.party.newBalance,
          treasuryCurrency: res.data.treasury.currency,
          hasOverdraft: res.data.treasury.hasOverdraftWarning,
        });
      }
    }

    runSimulation();
    return () => {
      isCancelled = true;
    };
  }, [amount, accountId, selectedPartyId, selectedPartyType, movementType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numAmount = typeof amount === "number" ? amount : parseFloat(String(amount));
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("يرجى إدخال مبلغ صحيح أكبر من الصفر");
      return;
    }

    if (!selectedPartyId) {
      setErrorMsg("يرجى اختيار الطرف المتعامل");
      return;
    }

    startTransition(async () => {
      const res = await createStatementMovement({
        date,
        type: movementType,
        partyType: selectedPartyType,
        partyId: selectedPartyId,
        partyName: selectedPartyName,
        amount: numAmount,
        accountId: accountId || null,
        paymentMethod,
        refDoc: refDoc || null,
        notes: notes || null,
      });

      if (res.success) {
        setSuccessMsg(res.message || "تم تسجيل الحركة المالية بنجاح");
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.error || "حدث خطأ أثناء حفظ الحركة");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border border-gray-200 shadow-2xl dir-rtl text-right bg-white max-h-[92vh] overflow-y-auto">
        {/* Header matching Screenshot 2 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            تسجيل حركة مالية جديدة
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Top Movement Parameters Card */}
          <div className="bg-[#f8faff] border border-[#e5eeff] rounded-xl p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Movement Type */}
              <div className="space-y-1">
                <Label className="text-gray-600 font-semibold text-[11px]">نوع الحركة</Label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-emerald-800 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                >
                  <option value="سداد لمورد">سداد لمورد</option>
                  <option value="تحصيل من عميل">تحصيل من عميل</option>
                  <option value="سداد لمقاول">سداد لمقاول</option>
                  <option value="صرف سلفة">صرف سلفة</option>
                  <option value="سداد سلفة / توريد">سداد سلفة / توريد</option>
                  <option value="تسوية رصيد (فائض)">تسوية رصيد (فائض)</option>
                  <option value="تسوية رصيد (عجز)">تسوية رصيد (عجز)</option>
                </select>
              </div>

              {/* Movement Date */}
              <div className="space-y-1">
                <Label className="text-gray-600 font-semibold text-[11px] flex items-center justify-between">
                  <span>تاريخ الحركة</span>
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white border-gray-200 text-xs h-9 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Payment Method */}
              <div className="space-y-1">
                <Label className="text-gray-600 font-semibold text-[11px]">طريقة الدفع</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                >
                  <option value="نقدي (Cash)">نقدي (Cash)</option>
                  <option value="تحويل بنكي (Bank Transfer)">تحويل بنكي (Bank Transfer)</option>
                  <option value="شيك (Check)">شيك (Check)</option>
                </select>
              </div>

              {/* Cashbox (Treasury) */}
              <div className="space-y-1">
                <Label className="text-gray-600 font-semibold text-[11px]">
                  الخزينة (Cashbox) <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-emerald-800 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                >
                  {treasuries.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference / Voucher No */}
            <div className="space-y-1">
              <Label className="text-gray-600 font-semibold text-[11px]">رقم المرجع / الإيصال</Label>
              <Input
                type="text"
                value={refDoc}
                onChange={(e) => setRefDoc(e.target.value)}
                placeholder="مثال: REF-1029"
                className="bg-white border-gray-200 text-xs h-9 font-mono text-left"
              />
            </div>
          </div>

          {/* Section 2: Party Details Card matching Screenshot 1 & 2 */}
          <div className="bg-[#fcfdfa] border border-[#e8efe0] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs border-b border-amber-100 pb-2">
              <Store className="w-4 h-4 text-amber-600" />
              <span>بيانات الطرف المتعامل</span>
            </div>

            {/* Party Select */}
            <div className="space-y-1">
              <Label className="text-gray-600 font-semibold text-[11px]">الطرف</Label>
              <select
                value={selectedPartyId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedPartyId(val);
                  const p = activeParties.find((x) => x.id === val);
                  if (p) setSelectedPartyName(p.name);
                }}
                className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-900 shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
              >
                {activeParties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Due Balance Badge matching Screenshot */}
            <div className="bg-white border border-emerald-100 rounded-xl p-2.5 text-center shadow-xs">
              <span className="text-[11px] text-gray-500 font-medium block">
                {selectedPartyType.toUpperCase().includes("CUSTOMER")
                  ? "الرصيد المتبقي على العميل"
                  : "الرصيد المستحق للمورد / الطرف"}
              </span>
              <div className="text-lg font-black text-emerald-800 font-mono mt-0.5">
                {simulation.currentPartyBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-xs font-sans text-gray-500">ج.م</span>
              </div>
            </div>

            {/* Movement Amount Input */}
            <div className="space-y-1">
              <Label className="text-gray-700 font-bold text-[11px]">
                مبلغ الحركة (ج.م) <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === "" ? "" : parseFloat(val));
                }}
                placeholder="0.00"
                className="bg-white border-gray-300 text-base font-extrabold text-gray-900 h-10 font-mono text-left"
                required
              />
            </div>

            {/* Notes / Description */}
            <div className="space-y-1">
              <Label className="text-gray-600 font-semibold text-[11px]">ملاحظات / بيان</Label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="تفاصيل إضافية للحركة..."
                className="bg-white border-gray-200 text-xs h-9"
              />
            </div>
          </div>

          {/* Section 3: Real-Time Financial Impact Panel matching Screenshot 1 */}
          <div className="bg-[#edf3fd] border border-[#d6e4f8] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <Calculator className="w-4 h-4 text-blue-700" />
              <span>الأثر المالي اللحظي</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Current Treasury Balance */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">رصيد الخزينة الحالي</span>
                <span className="font-mono font-bold text-blue-900 text-sm">
                  {simulation.currentTreasuryBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Movement Value */}
              <div className="flex items-center justify-between">
                <span className="text-emerald-800 font-bold">
                  {movementType.includes("تحصيل") ? "قيمة الحركة (قبض)" : "قيمة الحركة (صرف)"}
                </span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  {(typeof amount === "number" ? amount : 0).toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* New Treasury Balance */}
              <div className="flex items-center justify-between pt-1 border-t border-blue-100">
                <span className="text-blue-950 font-bold">رصيد الخزينة الجديد</span>
                <span
                  className={`font-mono font-black text-sm ${
                    simulation.hasOverdraft ? "text-rose-600" : "text-blue-900"
                  }`}
                >
                  {simulation.newTreasuryBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              {simulation.hasOverdraft && (
                <p className="text-[10px] text-rose-600 font-bold">
                  تنبيه: المبلغ يتجاوز الرصيد المتوفر في الخزينة!
                </p>
              )}

              {/* New Party Balance in Soft Green Container matching Screenshot 1 */}
              <div className="bg-[#e4efe0] border border-[#cedfca] rounded-lg p-2.5 flex items-center justify-between text-emerald-950 font-extrabold mt-1">
                <span>رصيد الجهة بعد الحركة</span>
                <span className="font-mono text-base font-black">
                  {simulation.newPartyBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons matching Screenshot 1 */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending || simulation.hasOverdraft}
              className="flex-1 bg-[#196b24] hover:bg-[#13571d] text-white font-bold text-xs h-10 gap-1.5 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  تأكيد وحفظ
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[#e7effc] hover:bg-[#dce9ff] text-blue-900 border-none font-bold text-xs h-10 px-5"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
