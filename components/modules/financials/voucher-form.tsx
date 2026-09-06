"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TreasuryAccount, Customer, Supplier, Contractor } from "@prisma/client";
import { Receipt, Wallet, ArrowUpCircle, ArrowDownCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addFinancialTransaction } from "@/actions/financials";
import { TransactionFormValues } from "@/lib/validations/transaction";

interface VoucherFormProps {
  treasuryAccounts: TreasuryAccount[];
  customers: Customer[];
  suppliers: Supplier[];
  contractors: Contractor[];
}

export function VoucherForm({
  treasuryAccounts,
  customers,
  suppliers,
  contractors,
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

  const selectedAccount = treasuryAccounts.find((a) => a.id === formData.accountId);
  const accountBalance = selectedAccount ? Number(selectedAccount.balance) : 0;
  const isCollection = direction === "COLLECTION" || (formData.type && (formData.type.includes("تحصيل") || formData.type.includes("Inflow")));
  const isOverdraft = !isCollection && (formData.amountEgp || 0) > accountBalance;

  // Party options based on partyType
  const handlePartyTypeChange = (pType: string) => {
    let firstPartyId = "";
    let firstPartyName = "";

    if (pType === "عميل تصدير" && customers.length > 0) {
      firstPartyId = customers[0].id;
      firstPartyName = customers[0].name;
    } else if (pType === "مورد خام" && suppliers.length > 0) {
      firstPartyId = suppliers[0].id;
      firstPartyName = suppliers[0].name;
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
      setFormData((prev) => ({
        ...prev,
        type: defaultType,
        partyType: "مورد خام",
        partyId: suppliers.length > 0 ? suppliers[0].id : "",
        partyName: suppliers.length > 0 ? suppliers[0].name : "",
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

    if (isOverdraft) {
      setFormError(
        `رصيد الحساب ${selectedAccount?.name} (${accountBalance.toLocaleString()} ج.م) لا يكفي لسداد ${Number(
          formData.amountEgp
        ).toLocaleString()} ج.م`
      );
      return;
    }

    setIsSubmitting(true);
    const res = await addFinancialTransaction(formData);
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
                    {c.name} (أجر: {Number(c.tariffRatePerKg)} ج.م/كجم)
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
                  {acc.name} — رصيد: {Number(acc.balance).toLocaleString()} {acc.currency}
                </option>
              ))}
            </select>
            {errors.accountId && <p className="text-xs text-red-600">{errors.accountId[0]}</p>}
          </div>
        </div>

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
                  رصيد الحساب المتاح الحقيقي:{" "}
                  <strong className="text-sm">{accountBalance.toLocaleString()}</strong> {selectedAccount.currency}
                </span>
              </div>

              <div className="font-sans font-bold">
                {isOverdraft
                  ? `⚠️ السحب على المكشوف مرفوض: مبلغ السند (${Number(formData.amountEgp).toLocaleString()} ج.م) يتجاوز رصيد الحساب!`
                  : "✓ رصيد الحساب كافٍ لإتمام العملية المحاسبية"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Amount & Reference Details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">قيمة السند (بالجنيه EGP) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amountEgp || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amountEgp: parseFloat(e.target.value) || 0 }))
              }
              placeholder="0.00"
              className={`font-mono text-sm font-bold ${
                isOverdraft ? "border-red-500 bg-red-50 text-red-900" : "border-gray-300"
              }`}
            />
            {errors.amountEgp && <p className="text-xs text-red-600">{errors.amountEgp[0]}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="font-bold text-gray-800 text-xs">المبلغ بالعملية الأجنبية (اختياري)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amountCurrency || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amountCurrency: parseFloat(e.target.value) || undefined,
                }))
              }
              placeholder="0.00 EUR / USD"
              className="font-mono text-xs"
            />
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
          disabled={isSubmitting || isOverdraft}
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
