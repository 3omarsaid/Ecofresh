"use client";

import React, { useState, useTransition } from "react";
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
import { createStationStockAdjustment } from "@/actions/stations";
import { toast } from "sonner";
import { Scale, AlertCircle, CheckCircle2 } from "lucide-react";

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
  stationSupplies?: Array<{ id?: string; supplyId?: string; stock: any; supply?: { id?: string; name: string; unit: string } }>;
  onSuccess?: () => void;
}

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
  const [actualQty, setActualQty] = useState<string>("");
  const [reason, setReason] = useState<string>("");
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
      const s = stationSupplies.find((ss) => ss.supply?.id === targetId || ss.supplyId === targetId);
      return s ? Number(s.stock) : 0;
    }
    return 0;
  })();

  const unitLabel = (() => {
    if (targetType === "SUPPLY") {
      const s = stationSupplies.find((ss) => ss.supply.id === targetId);
      return s?.supply.unit || "وحدة";
    }
    return "كجم";
  })();

  const parsedActual = parseFloat(actualQty);
  const diff = !isNaN(parsedActual) ? Math.round((parsedActual - currentSystemQty) * 100) / 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!targetId) {
      setErrorMsg("يرجى اختيار بند المخزون المراد تسويته");
      return;
    }

    if (isNaN(parsedActual) || parsedActual < 0) {
      setErrorMsg("يرجى إدخال كمية جرد فعلية صحيحة (أكبر من أو تساوي الصفر)");
      return;
    }

    if (Math.abs(diff) < 0.001) {
      setErrorMsg("الكمية الفعلية تطابق الرصيد الدفتري الحالي تماماً، لا يوجد فارق للتسوية");
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg("يرجى إدخال سبب التسوية بالتفصيل (5 أحرف على الأقل)");
      return;
    }

    startTransition(async () => {
      const res = await createStationStockAdjustment({
        stationId,
        targetType,
        targetId,
        actualQty: parsedActual,
        reason: reason.trim(),
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
      <DialogContent className="sm:max-w-[520px] text-right font-sans" dir="rtl">
        <DialogHeader className="text-right border-b pb-3">
          <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-700" />
            إجراء جرد وتسوية مخزنية رسمية
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            تسوية الفروق المخزنية في {stationName} مع التوثيق الدفتري وتحديث الأستاذ وسجل التدقيق.
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
                    ? "bg-[#012d1d] text-white border-[#012d1d]"
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
                    ? "bg-[#012d1d] text-white border-[#012d1d]"
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
                    ? "bg-[#012d1d] text-white border-[#012d1d]"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                مستلزم تعبئة
              </button>
            </div>
          </div>

          {/* Item Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">اختر البند المحدد</Label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-lg border border-gray-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">-- اختر من القائمة --</option>
              {targetType === "RAW_LOT" &&
                rawBatches.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchId} — {b.rawProduct} (المتاح: {Number(b.availableQty).toLocaleString()} كجم)
                  </option>
                ))}
              {targetType === "FINISHED_BATCH" &&
                finishedBatches.map((b) => (
                  <option key={b.fgBatchId} value={b.fgBatchId}>
                    {b.fgBatchId} — {b.productName} (المتاح: {Number(b.availableQty).toLocaleString()} كجم)
                  </option>
                ))}
              {targetType === "SUPPLY" &&
                stationSupplies.map((s) => (
                  <option key={s.supply.id} value={s.supply.id}>
                    {s.supply.name} (الرصيد: {Number(s.stock).toLocaleString()} {s.supply.unit})
                  </option>
                ))}
            </select>
          </div>

          {/* System vs Actual Qty Grid */}
          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 font-mono">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 block font-sans">
                الرصيد الدفتري الحالي:
              </span>
              <span className="text-base font-extrabold text-gray-900">
                {currentSystemQty.toLocaleString()} <span className="text-xs font-sans text-gray-500">{unitLabel}</span>
              </span>
            </div>

            <div>
              <Label className="text-[11px] font-semibold text-emerald-900 block font-sans">
                الرصيد الفعلي بعد الجرد:
              </Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
                placeholder="0"
                className="h-8 text-sm font-bold font-mono bg-white mt-1"
              />
            </div>
          </div>

          {/* Difference Summary */}
          {targetId && actualQty !== "" && !isNaN(parsedActual) && (
            <div
              className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-between font-mono ${
                diff === 0
                  ? "bg-gray-100 border-gray-300 text-gray-700"
                  : diff > 0
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : "bg-rose-50 border-rose-300 text-rose-800"
              }`}
            >
              <span className="font-sans">فارق التسوية (Adjustment Delta):</span>
              <span>
                {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()} {unitLabel}
              </span>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              سبب التسوية المخزنية <span className="text-red-500">*</span>
            </Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              placeholder="مثال: فارق جرد دوري، معالجة هالك غير مسجل، إعادة وزن..."
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
              disabled={isPending || !targetId || actualQty === ""}
              className="bg-[#012d1d] hover:bg-[#02472e] text-white text-xs font-bold gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isPending ? "جاري التوثيق..." : "اعتماد التسوية وتوثيق الحركة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
