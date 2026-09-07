"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createStationStockAdjustment } from "@/actions/stations";
import { toast } from "sonner";
import {
  Scale,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  HelpCircle,
  Tag,
} from "lucide-react";

interface StationAdjustmentDialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  stationId: string;
  stationName: string;
  inventory?: {
    rawBatches?: any[];
    finishedBatches?: any[];
    stationSupplies?: any[];
  };
  rawBatches?: Array<{ batchId: string; rawProduct: string; availableQty: any }>;
  finishedBatches?: Array<{ fgBatchId: string; productName: string; availableQty: any }>;
  stationSupplies?: Array<{
    id?: string;
    supplyId?: string;
    stock: any;
    supply?: { id?: string; name: string; unit: string };
  }>;
  onSuccess?: () => void;
}

const DEFICIT_REASON_CODES = [
  { code: "SHRINKAGE", label: "انكماش وتبخر رطوبة (تبريد وتخزين)" },
  { code: "SPOILAGE", label: "تلف / هالك فرز غير مسجل" },
  { code: "HANDLING_LOSS", label: "هالك مناولة / كسر عبوات وتداول" },
  { code: "COUNT_DEFICIT", label: "فارق جرد دوري (عجز دفتري)" },
  { code: "WEIGHING_ERROR", label: "تصحيح خطأ وزن استلام سابق" },
];

const SURPLUS_REASON_CODES = [
  { code: "COUNT_SURPLUS", label: "فارق جرد دوري (فائض فعلي بالمخزن)" },
  { code: "SORTING_RETURN", label: "مرتجع فرز / إعادة تصنيف خامات" },
  { code: "INTAKE_SURPLUS", label: "زيادة وزن استلام لم تقيد دفترياً" },
  { code: "COUNT_CORRECTION", label: "تصحيح قيد جرد سابق" },
];

export function StationAdjustmentDialog({
  isOpen,
  open,
  onClose,
  onOpenChange,
  stationId,
  stationName,
  inventory,
  rawBatches: rawBatchesProp,
  finishedBatches: finishedBatchesProp,
  stationSupplies: stationSuppliesProp,
  onSuccess,
}: StationAdjustmentDialogProps) {
  const isModalOpen = open !== undefined ? open : isOpen ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  const rawBatches = rawBatchesProp || inventory?.rawBatches || [];
  const finishedBatches = finishedBatchesProp || inventory?.finishedBatches || [];
  const stationSupplies = stationSuppliesProp || inventory?.stationSupplies || [];

  const [isPending, startTransition] = useTransition();
  const [targetType, setTargetType] = useState<"RAW_LOT" | "FINISHED_BATCH" | "SUPPLY">("RAW_LOT");
  const [targetId, setTargetId] = useState<string>("");

  // Direction & Synchronized Inputs
  const [direction, setDirection] = useState<"DEFICIT" | "SURPLUS">("DEFICIT");
  const [deltaQty, setDeltaQty] = useState<string>("");
  const [actualQty, setActualQty] = useState<string>("");

  // Standard Reason Code & Notes
  const [reasonCode, setReasonCode] = useState<string>(DEFICIT_REASON_CODES[0].code);
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive current system quantity
  const currentSystemQty = (() => {
    if (!targetId) return 0;
    if (targetType === "RAW_LOT") {
      const b = rawBatches.find((rb) => rb.batchId === targetId);
      return b ? Number(b.availableQty) : 0;
    } else if (targetType === "FINISHED_BATCH") {
      const b = finishedBatches.find((fb) => fb.fgBatchId === targetId);
      return b ? Number(b.availableQty) : 0;
    } else if (targetType === "SUPPLY") {
      const s = stationSupplies.find(
        (ss) => ss.supply?.id === targetId || ss.supplyId === targetId || ss.id === targetId
      );
      return s ? Number(s.stock) : 0;
    }
    return 0;
  })();

  const unitLabel = (() => {
    if (targetType === "SUPPLY") {
      const s = stationSupplies.find(
        (ss) => ss.supply?.id === targetId || ss.supplyId === targetId || ss.id === targetId
      );
      return s?.supply?.unit || "وحدة";
    }
    return "كجم";
  })();

  // Reset inputs when target item changes
  useEffect(() => {
    setDeltaQty("");
    setActualQty(targetId ? String(currentSystemQty) : "");
    setErrorMsg(null);
  }, [targetId, targetType, currentSystemQty]);

  // Adjust default reason code when direction changes
  const handleDirectionChange = (newDir: "DEFICIT" | "SURPLUS") => {
    setDirection(newDir);
    setReasonCode(newDir === "DEFICIT" ? DEFICIT_REASON_CODES[0].code : SURPLUS_REASON_CODES[0].code);

    const parsedDelta = parseFloat(deltaQty);
    if (!isNaN(parsedDelta) && parsedDelta > 0) {
      if (newDir === "DEFICIT") {
        const computedActual = Math.max(0, Math.round((currentSystemQty - parsedDelta) * 100) / 100);
        setActualQty(String(computedActual));
      } else {
        const computedActual = Math.round((currentSystemQty + parsedDelta) * 100) / 100;
        setActualQty(String(computedActual));
      }
    }
  };

  // Two-way sync: editing delta computes actualQty
  const handleDeltaChange = (val: string) => {
    setDeltaQty(val);
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed <= 0) {
      setActualQty(String(currentSystemQty));
      return;
    }

    if (direction === "DEFICIT") {
      const computed = Math.round((currentSystemQty - parsed) * 100) / 100;
      setActualQty(String(Math.max(0, computed)));
    } else {
      const computed = Math.round((currentSystemQty + parsed) * 100) / 100;
      setActualQty(String(computed));
    }
  };

  // Two-way sync: editing actualQty computes delta & adjusts direction
  const handleActualChange = (val: string) => {
    setActualQty(val);
    const parsed = parseFloat(val);
    if (isNaN(parsed)) {
      setDeltaQty("");
      return;
    }

    const diff = Math.round((parsed - currentSystemQty) * 100) / 100;
    if (diff < 0) {
      setDirection("DEFICIT");
      setDeltaQty(String(Math.abs(diff)));
    } else if (diff > 0) {
      setDirection("SURPLUS");
      setDeltaQty(String(diff));
    } else {
      setDeltaQty("0");
    }
  };

  const parsedDelta = parseFloat(deltaQty);
  const parsedActual = parseFloat(actualQty);
  const isZeroDelta = isNaN(parsedDelta) || parsedDelta <= 0;
  const isExcessDeficit = direction === "DEFICIT" && parsedDelta > currentSystemQty;

  const activeReasonList = direction === "DEFICIT" ? DEFICIT_REASON_CODES : SURPLUS_REASON_CODES;
  const selectedReasonObj = activeReasonList.find((r) => r.code === reasonCode) || activeReasonList[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!targetId) {
      setErrorMsg("يرجى اختيار بند المخزون المراد تسويته");
      return;
    }

    if (isZeroDelta) {
      setErrorMsg("يرجى إدخال كمية تسوية (عجز أو زيادة) أكبر من صفر");
      return;
    }

    if (isExcessDeficit) {
      setErrorMsg(
        `قيمة العجز (${parsedDelta.toLocaleString()} ${unitLabel}) تتجاوز الرصيد الدفتري الحالي (${currentSystemQty.toLocaleString()} ${unitLabel})`
      );
      return;
    }

    if (isNaN(parsedActual) || parsedActual < 0) {
      setErrorMsg("الرصيد الفعلي لا يمكن أن يكون سالباً");
      return;
    }

    const composedReason = notes.trim()
      ? `[${selectedReasonObj.label}] - ${notes.trim()}`
      : selectedReasonObj.label;

    startTransition(async () => {
      const res = await createStationStockAdjustment({
        stationId,
        targetType,
        targetId,
        actualQty: parsedActual,
        reason: composedReason,
      });

      if (res.success) {
        toast.success(res.message);
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || "حدث خطأ أثناء إجراء التسوية");
      }
    });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(val) => { if (!val) handleClose(); }}>
      <DialogContent className="sm:max-w-[550px] text-right font-sans" dir="rtl">
        <DialogHeader className="text-right border-b pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-700" />
              إجراء جرد وتسوية مخزنية
            </DialogTitle>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs">
              {stationName}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            تسوية الفروق المخزنية الدفترية مع حماية ضد التضارب في الإشارات ومنع الأرصدة السالبة.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Target Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">نوع المخزون المستهدف</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType("RAW_LOT");
                  setTargetId("");
                }}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  targetType === "RAW_LOT"
                    ? "bg-[#012d1d] text-white border-[#012d1d] shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                لوط خام (RAW)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType("FINISHED_BATCH");
                  setTargetId("");
                }}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  targetType === "FINISHED_BATCH"
                    ? "bg-[#012d1d] text-white border-[#012d1d] shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                منتج تام (FG)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetType("SUPPLY");
                  setTargetId("");
                }}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  targetType === "SUPPLY"
                    ? "bg-[#012d1d] text-white border-[#012d1d] shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                مستلزم تعبئة
              </button>
            </div>
          </div>

          {/* Item Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">اختر البند المحدد *</Label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
              required
            >
              <option value="">-- اختر من القائمة --</option>
              {targetType === "RAW_LOT" &&
                rawBatches.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchId} — {b.rawProduct} (الرصيد: {Number(b.availableQty).toLocaleString()} كجم)
                  </option>
                ))}
              {targetType === "FINISHED_BATCH" &&
                finishedBatches.map((b) => (
                  <option key={b.fgBatchId} value={b.fgBatchId}>
                    {b.fgBatchId} — {b.productName} (الرصيد: {Number(b.availableQty).toLocaleString()} كجم)
                  </option>
                ))}
              {targetType === "SUPPLY" &&
                stationSupplies.map((s) => (
                  <option key={s.supply?.id || s.supplyId || s.id} value={s.supply?.id || s.supplyId || s.id}>
                    {s.supply?.name || "مستلزم"} (الرصيد: {Number(s.stock).toLocaleString()} {s.supply?.unit || "وحدة"})
                  </option>
                ))}
            </select>
          </div>

          {/* Direction Toggle: Deficit (عجز) vs Surplus (فائض) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">طبيعة التسوية المخزنية *</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleDirectionChange("DEFICIT")}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  direction === "DEFICIT"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                عجز / نقص في المخزون (خصم)
              </button>
              <button
                type="button"
                onClick={() => handleDirectionChange("SURPLUS")}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  direction === "SURPLUS"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                فائض / زيادة في المخزون (إضافة)
              </button>
            </div>
          </div>

          {/* Two-Way Synchronized Inputs: Delta vs Actual */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-200">
              <span className="font-sans font-semibold text-gray-600">الرصيد الدفتري الحالي بالنظام:</span>
              <span className="font-bold text-gray-900 text-sm">
                {currentSystemQty.toLocaleString()} {unitLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Absolute Delta Input */}
              <div className="space-y-1">
                <Label className="text-[11px] font-sans font-bold text-gray-700 block">
                  {direction === "DEFICIT" ? "كمية العجز المطلوب خصمها *" : "كمية الفائض المطلوب إضافتها *"}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0.01"
                    step="any"
                    value={deltaQty}
                    onChange={(e) => handleDeltaChange(e.target.value)}
                    placeholder="0.00"
                    className={`h-9 font-mono font-bold bg-white text-left dir-ltr pl-12 ${
                      isExcessDeficit ? "border-rose-500 bg-rose-50 text-rose-900" : ""
                    }`}
                    disabled={!targetId}
                  />
                  <span
                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold ${
                      direction === "DEFICIT" ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {direction === "DEFICIT" ? "-" : "+"} {unitLabel}
                  </span>
                </div>
              </div>

              {/* Physical Actual Count Input (Two-Way Synced) */}
              <div className="space-y-1">
                <Label className="text-[11px] font-sans font-bold text-gray-700 block">
                  الرصيد الفعلي بعد الجرد *
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={actualQty}
                    onChange={(e) => handleActualChange(e.target.value)}
                    placeholder="0.00"
                    className="h-9 font-mono font-bold bg-white text-left dir-ltr pl-12"
                    disabled={!targetId}
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-500">
                    {unitLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Delta Summary Card */}
            {targetId && !isZeroDelta && (
              <div
                className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-between ${
                  direction === "DEFICIT"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                <span className="font-sans flex items-center gap-1.5">
                  {direction === "DEFICIT" ? (
                    <MinusCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    {direction === "DEFICIT"
                      ? `سيتم خصم عجز قدره ${parsedDelta.toLocaleString()} ${unitLabel}`
                      : `سيتم إضافة فائض قدره ${parsedDelta.toLocaleString()} ${unitLabel}`}
                  </span>
                </span>
                <span className="font-mono text-sm">
                  الجديد: {parsedActual.toLocaleString()} {unitLabel}
                </span>
              </div>
            )}

            {isExcessDeficit && (
              <div className="text-[11px] font-sans text-rose-700 font-bold bg-rose-50 p-2 rounded border border-rose-200">
                ⚠️ كمية العجز تتجاوز الرصيد المتاح. لا يمكن أن يصبح رصيد المخزون سالباً.
              </div>
            )}
          </div>

          {/* Standard Reason Code Dropdown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-gray-600" />
              سبب التسوية القياسي (كود المحاسبة والمخازن) *
            </Label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-300 bg-white font-sans focus:outline-none focus:ring-1 focus:ring-emerald-600"
              required
            >
              {activeReasonList.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">ملاحظات توضيحية إضافية (اختياري)</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder="مثال: رقم محضر الجرد، تقرير مراقبة الجودة، فحص عنبر التبريد..."
              className="text-xs"
            />
          </div>

          <DialogFooter className="border-t pt-3 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isPending}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !targetId || isZeroDelta || isExcessDeficit}
              className={`text-white text-xs font-bold gap-1.5 ${
                direction === "DEFICIT"
                  ? "bg-rose-700 hover:bg-rose-800"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isPending
                ? "جاري التوثيق..."
                : direction === "DEFICIT"
                ? "اعتماد خصم العجز"
                : "اعتماد قيد الفائض"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
