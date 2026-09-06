"use client";

import React, { useState } from "react";
import { Station, FinishedGoodsBatch, RawBatch } from "@prisma/client";
import { ArrowRightLeft, AlertCircle, Truck, User, CheckCircle2, Box, Package, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createStockTransfer } from "@/actions/transfers";
import { TransferFormValues } from "@/lib/validations/transfer";

type ExtendedFgBatch = FinishedGoodsBatch & {
  station?: Station;
};

type ExtendedRawBatch = RawBatch & {
  station?: Station;
};

interface TransferModalProps {
  stations: Station[];
  batches?: ExtendedFgBatch[];
  fgBatches?: ExtendedFgBatch[];
  rawBatches?: ExtendedRawBatch[];
  stationSupplies?: any[];
  trigger?: React.ReactNode;
}

export function TransferModal({
  stations,
  batches = [],
  fgBatches = [],
  rawBatches = [],
  stationSupplies = [],
  trigger,
}: TransferModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const availableFgBatches = fgBatches.length > 0 ? fgBatches : batches;

  const [formData, setFormData] = useState<TransferFormValues>({
    fromStationId: "",
    toStationId: "",
    itemType: "FINISHED",
    batchId: "",
    rawBatchId: "",
    fgBatchId: "",
    supplyId: "",
    qtyKg: 0,
    truckPlate: "",
    driverName: "",
    date: new Date().toISOString().substring(0, 10),
    notes: "",
  });

  // Calculate max available based on itemType
  let maxAvailable = 0;
  if (formData.itemType === "FINISHED") {
    const selected = availableFgBatches.find((b) => b.fgBatchId === (formData.fgBatchId || formData.batchId));
    maxAvailable = selected ? Number(selected.availableQty) : 0;
  } else if (formData.itemType === "RAW") {
    const selected = rawBatches.find((b) => b.batchId === formData.rawBatchId);
    maxAvailable = selected ? Number(selected.availableQty) : 0;
  } else if (formData.itemType === "SUPPLIES") {
    const selected = stationSupplies.find(
      (s) => s.supplyId === formData.supplyId && s.location?.stationId === formData.fromStationId
    );
    maxAvailable = selected ? Number(selected.stock) : 0;
  }

  const isQtyOver = formData.qtyKg > maxAvailable;

  const handleFgSelect = (fgBatchId: string) => {
    const b = availableFgBatches.find((item) => item.fgBatchId === fgBatchId);
    setFormData((prev) => ({
      ...prev,
      fgBatchId,
      batchId: fgBatchId,
      fromStationId: b ? b.stationId : prev.fromStationId,
    }));
  };

  const handleRawSelect = (rawBatchId: string) => {
    const b = rawBatches.find((item) => item.batchId === rawBatchId);
    setFormData((prev) => ({
      ...prev,
      rawBatchId,
      batchId: rawBatchId,
      fromStationId: b ? b.stationId : prev.fromStationId,
    }));
  };

  const handleSupplySelect = (supplyId: string) => {
    const item = stationSupplies.find((s) => s.supplyId === supplyId && (formData.fromStationId ? s.location?.stationId === formData.fromStationId : true));
    setFormData((prev) => ({
      ...prev,
      supplyId,
      fromStationId: item?.location?.stationId || prev.fromStationId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrors({});

    if (formData.fromStationId === formData.toStationId) {
      setErrorMessage("لا يمكن التحويل لنفس المحطة المصدر والوجهة");
      return;
    }

    if (isQtyOver) {
      setErrorMessage(`الكمية المنقولة تتجاوز الرصيد المتاح بالمخزن (${maxAvailable.toLocaleString()})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createStockTransfer(formData);
      if (res.success) {
        setOpen(false);
        setFormData({
          fromStationId: "",
          toStationId: "",
          itemType: "FINISHED",
          batchId: "",
          rawBatchId: "",
          fgBatchId: "",
          supplyId: "",
          qtyKg: 0,
          truckPlate: "",
          driverName: "",
          date: new Date().toISOString().substring(0, 10),
          notes: "",
        });
      } else {
        if (res.errors) {
          setErrors(res.errors);
        }
        setErrorMessage(res.error || "حدث خطأ أثناء تنفيذ التحويل");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "حدث خطأ متوقع أثناء الاتصال بالخادم");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-semibold text-xs shadow-sm">
            <ArrowRightLeft className="h-4 w-4" /> إنشاء إذن تحويل بين المخازن
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-white border border-gray-200 rounded-xl p-6 text-right">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#012d1d]" />
            <span>إذن تحويل بين المخازن والوحدات</span>
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            نقل رصيد (خامات / منتج تام / مستلزمات) بين المخازن المتماثلة في المحطات المختلفة مع إصدار رقم إذن نقل موثق.
          </p>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2 mt-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Warehouse Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">نوع المخزن والأصناف المنقولة</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, itemType: "FINISHED", batchId: "", fgBatchId: "", rawBatchId: "", supplyId: "" }))}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold border transition-all ${
                  formData.itemType === "FINISHED"
                    ? "bg-emerald-700 text-white border-emerald-800 shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Package className="h-3.5 w-3.5" /> منتج تام (FINISHED)
              </button>

              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, itemType: "RAW", batchId: "", fgBatchId: "", rawBatchId: "", supplyId: "" }))}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold border transition-all ${
                  formData.itemType === "RAW"
                    ? "bg-amber-700 text-white border-amber-800 shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Box className="h-3.5 w-3.5" /> خامات (RAW)
              </button>

              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, itemType: "SUPPLIES", batchId: "", fgBatchId: "", rawBatchId: "", supplyId: "" }))}
                className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-bold border transition-all ${
                  formData.itemType === "SUPPLIES"
                    ? "bg-cyan-700 text-white border-cyan-800 shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Layers className="h-3.5 w-3.5" /> مستلزمات (SUPPLIES)
              </button>
            </div>
          </div>

          {/* Item Selector based on itemType */}
          {formData.itemType === "FINISHED" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                الباتش الجاهز المراد نقله (Finished Goods) <span className="text-red-500">*</span>
              </Label>
              <select
                value={formData.fgBatchId || formData.batchId || ""}
                onChange={(e) => handleFgSelect(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#012d1d]"
              >
                <option value="">-- اختر الباتش من مخزن المنتج التام --</option>
                {availableFgBatches.map((b) => (
                  <option key={b.fgBatchId} value={b.fgBatchId}>
                    {b.fgBatchId} — {b.productName} ({b.station?.name || b.stationId}) — متاح:{" "}
                    {Number(b.availableQty).toLocaleString()} كجم
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.itemType === "RAW" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                لوط الخام المراد نقله (Raw Material) <span className="text-red-500">*</span>
              </Label>
              <select
                value={formData.rawBatchId || ""}
                onChange={(e) => handleRawSelect(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#012d1d]"
              >
                <option value="">-- اختر اللوط من مخزن الخامات --</option>
                {rawBatches.map((b) => (
                  <option key={b.batchId} value={b.batchId}>
                    {b.batchId} — {b.rawProduct} ({b.station?.name || b.stationId}) — متاح:{" "}
                    {Number(b.availableQty).toLocaleString()} كجم
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.itemType === "SUPPLIES" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                المستلزم المراد نقله من المحطة المصدر <span className="text-red-500">*</span>
              </Label>
              <select
                value={formData.supplyId || ""}
                onChange={(e) => handleSupplySelect(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#012d1d]"
              >
                <option value="">-- اختر المستلزم من مخزن المستلزمات --</option>
                {stationSupplies.map((s) => (
                  <option key={`${s.locationId}-${s.supplyId}`} value={s.supplyId}>
                    {s.supply?.name} ({s.location?.station?.name || 'محطة'}) — متاح:{" "}
                    {Number(s.stock).toLocaleString()} {s.supply?.unit}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* From Station -> To Station */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">المحطة المصدر</Label>
              <select
                value={formData.fromStationId}
                onChange={(e) => setFormData((p) => ({ ...p, fromStationId: e.target.value }))}
                className="w-full h-9 px-2 rounded-lg border border-gray-200 bg-gray-100 text-xs font-bold cursor-not-allowed"
              >
                <option value="">-- اختر المصدر --</option>
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                المحطة الوجهة (نفس نوع المخزن) <span className="text-red-500">*</span>
              </Label>
              <select
                value={formData.toStationId}
                onChange={(e) => setFormData((p) => ({ ...p, toStationId: e.target.value }))}
                className="w-full h-9 px-2 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#012d1d]"
              >
                <option value="">-- اختر المحطة الوجهة --</option>
                {stations
                  .filter((st) => st.id !== formData.fromStationId)
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-gray-700">
                الكمية المنقولة <span className="text-red-500">*</span>
              </Label>
              {maxAvailable > 0 && (
                <span className="text-[11px] text-gray-500">
                  المتاح بالمخزن: <strong className="text-gray-900">{maxAvailable.toLocaleString()}</strong>
                </span>
              )}
            </div>
            <Input
              type="number"
              min={0}
              step="any"
              value={formData.qtyKg || ""}
              onChange={(e) => setFormData((p) => ({ ...p, qtyKg: Number(e.target.value) }))}
              className={`h-9 font-mono text-xs font-bold ${
                isQtyOver ? "border-red-500 bg-red-50 text-red-700" : ""
              }`}
              placeholder="0"
            />
            {isQtyOver && (
              <p className="text-[11px] text-red-600">
                الكمية تتجاوز الرصيد المتاح بالمخزن المصدر ({maxAvailable.toLocaleString()})
              </p>
            )}
          </div>

          {/* Truck Plate & Driver Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-gray-500" />
                <span>لوحة سيارة النقل</span> <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={formData.truckPlate}
                onChange={(e) => setFormData((p) => ({ ...p, truckPlate: e.target.value }))}
                placeholder="أ ب ج 1234"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-gray-500" />
                <span>اسم السائق</span> <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData((p) => ({ ...p, driverName: e.target.value }))}
                placeholder="اسم السائق الثلاثي"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">ملاحظات التحويل</Label>
            <Input
              type="text"
              value={formData.notes || ""}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              placeholder="ملاحظات حول وسيلة النقل أو ظروف الشحن..."
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="text-xs h-9 font-semibold"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isQtyOver}
              className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-semibold text-xs h-9 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? "جاري تنفيذ التحويل..." : "اعتماد إذن النقل"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
