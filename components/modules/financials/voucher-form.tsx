"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TreasuryAccount, Customer, Supplier, Contractor } from "@prisma/client";
import {
  Receipt,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Scale,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ArrowRightLeft,
  Calendar,
  Building2,
  Tag,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrency } from "@/lib/currency";
import { addFinancialTransaction, getFinancialTransactions } from "@/actions/financials";
import { TransactionFormValues } from "@/lib/validations/transaction";

interface PartyBalanceSummary {
  totalDue: number;
  totalPaidOrCollected: number;
  remaining: number;
}

interface VoucherFormProps {
  treasuryAccounts: TreasuryAccount[];
  customers: Customer[];
  suppliers: Supplier[];
  contractors: Contractor[];
  partyBalances?: Record<string, PartyBalanceSummary>;
}

export function VoucherForm({
  treasuryAccounts,
  customers,
  suppliers,
  contractors,
  partyBalances: initialPartyBalances,
}: VoucherFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [direction, setDirection] = useState<"COLLECTION" | "PAYMENT">("PAYMENT");
  const [formData, setFormData] = useState<Partial<TransactionFormValues>>({
    date: new Date().toISOString().substring(0, 10),
    type: "سداد مورد خام (AP)",
    partyType: "مورد خام",
    partyId: suppliers.length > 0 ? suppliers[0].id : "",
    partyName: suppliers.length > 0 ? suppliers[0].name : "",
    amountEgp: 0,
    amountCurrency: undefined,
    currency: "EGP",
    refDoc: "",
    accountId: treasuryAccounts.length > 0 ? treasuryAccounts[0].id : "",
    description: "",
  });

  const [partyBalances, setPartyBalances] = useState<Record<string, PartyBalanceSummary>>(
    initialPartyBalances || {}
  );
  const [loadingBalances, setLoadingBalances] = useState(!initialPartyBalances);

  // Fetch balances if not passed
  useEffect(() => {
    if (!initialPartyBalances) {
      setLoadingBalances(true);
      getFinancialTransactions()
        .then((txns) => {
          const map: Record<string, PartyBalanceSummary> = {};
          for (const t of txns) {
            if (!t.partyId) continue;
            if (!map[t.partyId]) {
              map[t.partyId] = { totalDue: 0, totalPaidOrCollected: 0, remaining: 0 };
            }
            const amt = Number(t.amountEgp || 0);
            const pType = t.partyType || "";
            const isCust = pType.includes("عميل");
            if (isCust) {
              const isCol =
                t.type.includes("تحصيل") || t.type.includes("وارد") || t.type.includes("Inflow");
              if (isCol) map[t.partyId].totalPaidOrCollected += amt;
              else map[t.partyId].totalDue += amt;
            } else {
              const isPay =
                t.type.includes("سداد") || t.type.includes("منصرف") || t.type.includes("Outflow");
              if (isPay) map[t.partyId].totalPaidOrCollected += amt;
              else map[t.partyId].totalDue += amt;
            }
          }
          for (const k of Object.keys(map)) {
            map[k].remaining = map[k].totalDue - map[k].totalPaidOrCollected;
          }
          setPartyBalances(map);
        })
        .catch((err) => console.error("Failed to load party balances:", err))
        .finally(() => setLoadingBalances(false));
    }
  }, [initialPartyBalances]);

  // Selected Treasury
  const selectedAccount = treasuryAccounts.find((a) => a.id === formData.accountId);
  const accountBalance = selectedAccount ? Number(selectedAccount.balance) : 0;

  const isCollection =
    direction === "COLLECTION" ||
    (formData.type && (formData.type.includes("تحصيل") || formData.type.includes("Inflow")));

  // Native amount strictly in EGP
  const effectiveAmount = Number(formData.amountEgp || 0);

  // Overdraft check
  const isOverdraft = !isCollection && effectiveAmount > accountBalance;

  // Selected party current balance
  const currentPartyBalance = formData.partyId ? partyBalances[formData.partyId] : null;
  const rawRemaining = currentPartyBalance ? currentPartyBalance.remaining : 0;
  const isCustomer = formData.partyType === "عميل تصدير";

  // Simulated remaining balance after transaction
  const voucherEgpAmount = Number(formData.amountEgp || 0);
  const simulatedRemaining = rawRemaining - voucherEgpAmount;

  // Party options based on partyType
  const handlePartyTypeChange = (pType: string) => {
    let firstPartyId = "";
    let firstPartyName = "";

    if (pType === "عميل تصدير" && customers.length > 0) {
      firstPartyId = customers[0].id;
      firstPartyName = customers[0].name;
    } else if (pType === "مورد خام" && suppliers.length > 0) {
      const rawSupps = suppliers.filter((s) => s.type === "RAW_AGRICULTURAL");
      const chosen = rawSupps.length > 0 ? rawSupps[0] : suppliers[0];
      firstPartyId = chosen.id;
      firstPartyName = chosen.name;
    } else if (pType === "مقاول عمالة" && contractors.length > 0) {
      firstPartyId = contractors[0].id;
      firstPartyName = contractors[0].name;
    } else if (pType === "مورد مستلزمات" && suppliers.length > 0) {
      const packSupps = suppliers.filter((s) => s.type === "PACKAGING");
      const chosen = packSupps.length > 0 ? packSupps[0] : suppliers[0];
      firstPartyId = chosen.id;
      firstPartyName = chosen.name;
    }

    setFormData((prev) => ({
      ...prev,
      partyType: pType,
      partyId: firstPartyId,
      partyName: firstPartyName,
    }));
  };

  const handleDirectionChange = (newDir: "COLLECTION" | "PAYMENT") => {
    setDirection(newDir);
    if (newDir === "COLLECTION") {
      const defaultType = "تحصيل عميل (AR)";
      setFormData((prev) => ({
        ...prev,
        type: defaultType,
        partyType: "عميل تصدير",
        partyId: customers.length > 0 ? customers[0].id : "",
        partyName: customers.length > 0 ? customers[0].name : "",
      }));
    } else {
      const defaultType = "سداد مورد خام (AP)";
      const rawSupps = suppliers.filter((s) => s.type === "RAW_AGRICULTURAL");
      const chosen = rawSupps.length > 0 ? rawSupps[0] : suppliers[0];
      setFormData((prev) => ({
        ...prev,
        type: defaultType,
        partyType: "مورد خام",
        partyId: chosen ? chosen.id : "",
        partyName: chosen ? chosen.name : "",
      }));
    }
  };

  const handlePartySelect = (pId: string) => {
    let pName = "";
    if (formData.partyType === "عميل تصدير") {
      const found = customers.find((c) => c.id === pId);
      if (found) pName = found.name;
    } else if (formData.partyType === "مورد خام" || formData.partyType === "مورد مستلزمات") {
      const found = suppliers.find((s) => s.id === pId);
      if (found) pName = found.name;
    } else if (formData.partyType === "مقاول عمالة") {
      const found = contractors.find((c) => c.id === pId);
      if (found) pName = found.name;
    }

    setFormData((prev) => ({
      ...prev,
      partyId: pId,
      partyName: pName,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});

    if (effectiveAmount <= 0) {
      setFormError("يرجى إدخال قيمة صحيحة للسند المالي أكبر من صفر");
      return;
    }

    if (isOverdraft) {
      setFormError(
        `رصيد الحساب ${selectedAccount?.name} (${formatCurrency(accountBalance)}) لا يكفي لسداد ${formatCurrency(effectiveAmount)}`
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      date: formData.date,
      type: formData.type || (direction === "COLLECTION" ? "تحصيل عميل (AR)" : "سداد مورد خام (AP)"),
      partyType: formData.partyType || "جهة متعاملة",
      partyId: formData.partyId || "",
      partyName: formData.partyName || "",
      amountEgp: effectiveAmount,
      amountCurrency: null,
      currency: "EGP",
      refDoc: formData.refDoc || null,
      accountId: formData.accountId || "",
      description:
        formData.description ||
        `${formData.type} لصالح ${formData.partyName || "الطرف"}`,
    };

    const res = await addFinancialTransaction(payload);
    setIsSubmitting(false);

    if (res.success) {
      router.push("/financials/transactions");
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      setFormError(res.error || "حدث خطأ أثناء قيد السند المالي");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Direction / Voucher Type Toggle */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
          <h3 className="font-bold text-base text-[#012d1d] flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#012d1d]" />
            <span>نوع السند المالي (Financial Voucher)</span>
          </h3>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleDirectionChange("PAYMENT")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                direction === "PAYMENT"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              سند صرف (Outflow Payment)
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange("COLLECTION")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                direction === "COLLECTION"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              سند قبض / تحصيل (Inflow Collection)
            </button>
          </div>
        </div>

        {/* Voucher Transaction Type Dropdown & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">نوع الحركة المالية *</Label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-[#012d1d] focus:ring-2 focus:ring-[#012d1d] outline-none"
            >
              {direction === "COLLECTION" ? (
                <>
                  <option value="تحصيل عميل (AR)">تحصيل عميل تصدير (AR)</option>
                  <option value="تحصيل مبيعات تصدير (AR)">تحصيل مبيعات تصدير (AR)</option>
                  <option value="تحصيل إيراد آخرى">تحصيل إيرادات وأرباح أخرى</option>
                </>
              ) : (
                <>
                  <option value="سداد مورد خام (AP)">سداد مستحقات مورد خام (AP)</option>
                  <option value="سداد مقاول عمالة (AP)">سداد أتعاب مقاول عمالة (AP)</option>
                  <option value="سداد مورد مستلزمات (AP)">سداد مستلزمات وتعبئة (AP)</option>
                  <option value="سداد مصروفات تشغيل">سداد مصروفات تشغيل ونولون</option>
                </>
              )}
            </select>
            {errors.type && <p className="text-xs text-red-600">{errors.type[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">تاريخ القيد السند</Label>
            <Input
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="bg-white border-gray-300 rounded-xl text-xs"
            />
          </div>
        </div>
      </div>

      {/* Party Selection & Treasury Account */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-bold text-base text-[#012d1d] flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#012d1d]" />
            <span>الجهة المستلمة / المسددة والحساب المالي</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Party Type */}
          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">نوع الجهة المتعاملة *</Label>
            <select
              value={formData.partyType}
              onChange={(e) => handlePartyTypeChange(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-[#012d1d] outline-none"
            >
              <option value="عميل تصدير">عميل تصدير</option>
              <option value="مورد خام">مورد خام زراعي</option>
              <option value="مقاول عمالة">مقاول عمالة وتجميع</option>
              <option value="مورد مستلزمات">مورد مستلزمات وتعبئة</option>
            </select>
          </div>

          {/* Party Selection */}
          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">اسم الجهة *</Label>
            <select
              value={formData.partyId}
              onChange={(e) => handlePartySelect(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-[#012d1d] focus:ring-2 focus:ring-[#012d1d] outline-none"
            >
              {formData.partyType === "عميل تصدير" &&
                customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
              {formData.partyType === "مورد خام" &&
                suppliers
                  .filter((s) => s.type === "RAW_AGRICULTURAL")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.location || "خام"})
                    </option>
                  ))}
              {formData.partyType === "مقاول عمالة" &&
                contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (أجر: {formatCurrency(c.tariffRatePerKg)} / كجم)
                  </option>
                ))}
              {formData.partyType === "مورد مستلزمات" &&
                suppliers
                  .filter((s) => s.type === "PACKAGING")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (تغليف)
                    </option>
                  ))}
            </select>
            {errors.partyId && <p className="text-xs text-red-600">{errors.partyId[0]}</p>}
          </div>

          {/* Treasury Account Selection */}
          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">الحساب المالي (البنك / الخزينة) *</Label>
            <select
              value={formData.accountId}
              onChange={(e) => setFormData((prev) => ({ ...prev, accountId: e.target.value }))}
              className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold font-mono text-[#012d1d] focus:ring-2 focus:ring-[#012d1d] outline-none"
            >
              {treasuryAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — رصيد: {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
            {errors.accountId && <p className="text-xs text-red-600">{errors.accountId[0]}</p>}
          </div>
        </div>

        {/* Counterparty Balance Live Card */}
        {formData.partyId && (
          <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-800" />
                كشف رصيد الجهة المتعاملة ({formData.partyName}):
              </span>
              <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 text-[11px] font-mono">
                {formData.partyType}
              </Badge>
            </div>

            {loadingBalances ? (
              <div className="text-xs text-gray-400 py-1 font-sans">جاري قراءة رصيد الأستاذ للجهة...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 font-sans block">
                    {isCustomer ? "إجمالي المطلوب (مبيعات)" : "إجمالي المستحق (مشتريات)"}
                  </span>
                  <span className="font-bold text-gray-800">
                    {formatCurrency(currentPartyBalance?.totalDue || 0)}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 font-sans block">
                    {isCustomer ? "إجمالي المحصل" : "إجمالي المسدد"}
                  </span>
                  <span className="font-bold text-blue-700">
                    {formatCurrency(currentPartyBalance?.totalPaidOrCollected || 0)}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-[11px] text-gray-500 font-sans block">الرصيد الدفتري الحالي</span>
                  <span
                    className={`font-bold ${
                      rawRemaining > 0
                        ? isCustomer
                          ? "text-rose-700"
                          : "text-blue-700"
                        : rawRemaining < 0
                        ? "text-purple-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(Math.abs(rawRemaining))}{" "}
                    <span className="text-[10px] font-sans font-normal">
                      {rawRemaining > 0
                        ? isCustomer
                          ? "(مدين)"
                          : "(دائن له)"
                        : rawRemaining < 0
                        ? "(رصيد مقدم)"
                        : "(مسدد)"}
                    </span>
                  </span>
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[11px] text-emerald-900 font-sans block">الرصيد بعد تنفيذ السند</span>
                  <span className="font-bold text-emerald-800">
                    {formatCurrency(Math.abs(simulatedRemaining))}{" "}
                    <span className="text-[10px] font-sans font-normal">
                      {simulatedRemaining === 0
                        ? "(خالص تماماً)"
                        : simulatedRemaining > 0
                        ? "(متبقي)"
                        : "(فائض مقدم)"}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Account Balance Live Badge & Overdraft Alert */}
        {selectedAccount && (
          <div className="pt-2">
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono font-bold ${
                isOverdraft
                  ? "bg-red-50 border-red-300 text-red-900"
                  : "bg-emerald-50 border-emerald-300 text-emerald-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {isOverdraft ? (
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                )}
                <span>
                  رصيد الحساب المالي المتاح:{" "}
                  <strong className="text-sm">{formatCurrency(accountBalance)}</strong>
                </span>
              </div>

              <div className="font-sans font-bold">
                {isOverdraft
                  ? `⚠️ السحب على المكشوف مرفوض: مبلغ السند (${formatCurrency(effectiveAmount)}) يتجاوز رصيد الحساب!`
                  : `✓ رصيد الحساب كافٍ لسداد ${formatCurrency(effectiveAmount)}`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Amount & Reference Details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="border-b border-gray-100 pb-2">
          <h4 className="font-bold text-xs text-gray-700 flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-emerald-800" />
            بيانات القيمة النقدية (بالجنيه المصري)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">قيمة السند (ج.م) *</Label>
            <CurrencyInput
              placeholder="0.00"
              value={formData.amountEgp || ""}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  amountEgp: typeof val === "number" ? val : 0,
                }))
              }
              className={isOverdraft ? "border-red-500 bg-red-50 text-red-900" : ""}
              required
            />
            {errors.amountEgp && <p className="text-xs text-red-600">{errors.amountEgp[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">المستند المرجعي (Ref Doc)</Label>
            <Input
              type="text"
              value={formData.refDoc || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, refDoc: e.target.value }))}
              placeholder="مثال: SHP-2026-001 / LOT-RAW-001"
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="font-bold text-gray-800 text-xs">البيان والوصف المحاسبي *</Label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="أدخل وصفاً تفصيلياً لسبب قيد السند المالي..."
            rows={2}
            className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#012d1d] outline-none"
          />
          {errors.description && <p className="text-xs text-red-600">{errors.description[0]}</p>}
        </div>
      </div>

      {/* Form Error Alert */}
      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-end gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/financials/transactions")}
          className="text-xs font-semibold text-gray-500"
        >
          إلغاء
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isOverdraft || effectiveAmount <= 0}
          className={`gap-2 font-semibold text-xs text-white shadow-sm ${
            direction === "COLLECTION"
              ? "bg-emerald-700 hover:bg-emerald-800"
              : "bg-[#012d1d] hover:bg-[#02472e]"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isSubmitting
            ? "جاري قيد السند..."
            : direction === "COLLECTION"
            ? "تأكيد وقيد سند القبض"
            : "تأكيد وقيد سند الصرف"}
        </Button>
      </div>
    </form>
  );
}
