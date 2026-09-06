import React, { useState, useMemo } from "react";
import { RawBatch, Supplier, Station } from "@prisma/client";
import {
  AlertCircle,
  Search,
  Check,
  Warehouse,
  Building2,
  Layers,
  Target,
  CheckCircle2,
  ArrowDownToLine,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type RawBatchItem = {
  batchId: string;
  qty: number;
};

type ExtendedRawBatch = RawBatch & {
  supplier?: Supplier;
  station?: Station;
  location?: {
    id: string;
    type: string;
    name: string;
  } | null;
};

type ExtendedStation = Station & {
  stockLocations?: Array<{
    id: string;
    type: string;
    name: string;
  }>;
};

interface Step2RawIssuesProps {
  stationId: string;
  stations?: ExtendedStation[];
  rawBatches: ExtendedRawBatch[];
  targetRawKg?: number;
  onTargetChange?: (target: number) => void;
  rawIssues: RawBatchItem[];
  onChange: (rawIssues: RawBatchItem[]) => void;
  errors?: Record<string, string[]>;
}

export function Step2RawIssues({
  stationId,
  stations = [],
  rawBatches,
  targetRawKg = 0,
  onTargetChange,
  rawIssues,
  onChange,
  errors,
}: Step2RawIssuesProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Resolve Station and RAW Warehouse
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.id === stationId);
  }, [stations, stationId]);

  const rawWarehouse = useMemo(() => {
    return selectedStation?.stockLocations?.find((l) => l.type === "RAW");
  }, [selectedStation]);

  const rawWarehouseName =
    rawWarehouse?.name ||
    (selectedStation ? `${selectedStation.name} — مخزن الخامات` : "مخزن الخامات");

  // Filter available batches for this station's RAW warehouse with availableQty > 0 and QC APPROVED
  const availableBatches = useMemo(() => {
    return rawBatches.filter(
      (b) =>
        b.stationId === stationId &&
        Number(b.availableQty) > 0 &&
        b.qcStatus === "APPROVED"
    );
  }, [rawBatches, stationId]);

  // Search filtered batches
  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return availableBatches;
    const query = searchQuery.trim().toLowerCase();
    return availableBatches.filter(
      (b) =>
        b.batchId.toLowerCase().includes(query) ||
        (b.supplier?.name && b.supplier.name.toLowerCase().includes(query)) ||
        b.rawProduct.toLowerCase().includes(query)
    );
  }, [availableBatches, searchQuery]);

  // Map of issue quantities by batchId for O(1) lookups
  const issueQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    rawIssues.forEach((issue) => {
      map.set(issue.batchId, Number(issue.qty || 0));
    });
    return map;
  }, [rawIssues]);

  // Handle quantity input change
  const handleQtyChange = (batchId: string, value: number) => {
    const newQty = isNaN(value) || value < 0 ? 0 : Math.round(value * 100) / 100;
    const updated = rawIssues.filter((i) => i.batchId !== batchId);
    if (newQty > 0) {
      updated.push({ batchId, qty: newQty });
    }
    onChange(updated);
  };

  // Summary calculations
  let totalRawQty = 0;
  let totalRawCost = 0;
  let hasOverWithdrawal = false;
  let selectedBatchesCount = 0;

  rawIssues.forEach((issue) => {
    const batch = availableBatches.find((b) => b.batchId === issue.batchId);
    const available = batch ? Number(batch.availableQty) : 0;
    const unitCost = batch ? Number(batch.unitCost) : 0;
    const qty = Number(issue.qty || 0);

    if (qty > 0) {
      selectedBatchesCount++;
      totalRawQty += qty;
      totalRawCost += qty * unitCost;
      if (qty > available) {
        hasOverWithdrawal = true;
      }
    }
  });

  totalRawQty = Math.round(totalRawQty * 100) / 100;
  const target = Number(targetRawKg) || 0;
  const rawRemaining = Math.round((target - totalRawQty) * 100) / 100;
  const isExactMatch = target > 0 && Math.abs(rawRemaining) < 0.001;
  const isOverTarget = target > 0 && rawRemaining < -0.001;
  const isUnderTarget = target > 0 && rawRemaining > 0.001;
  const progressPct = target > 0 ? Math.min(100, Math.round((totalRawQty / target) * 100)) : 0;

  // Quick action: Withdraw remaining needed for target
  const handleWithdrawRemaining = (batch: ExtendedRawBatch) => {
    const currentQty = issueQtyMap.get(batch.batchId) || 0;
    const available = Number(batch.availableQty);
    const otherWithdrawn = totalRawQty - currentQty;
    const needed = Math.max(0, target - otherWithdrawn);
    const toWithdraw = Math.min(available, needed);
    handleQtyChange(batch.batchId, toWithdraw);
  };

  // Quick action: Withdraw all available for a batch
  const handleWithdrawAll = (batch: ExtendedRawBatch) => {
    const available = Number(batch.availableQty);
    if (target > 0) {
      const currentQty = issueQtyMap.get(batch.batchId) || 0;
      const otherWithdrawn = totalRawQty - currentQty;
      const needed = Math.max(0, target - otherWithdrawn);
      const toWithdraw = needed > 0 ? Math.min(available, needed) : available;
      handleQtyChange(batch.batchId, toWithdraw);
    } else {
      handleQtyChange(batch.batchId, available);
    }
  };

  // Toggle selection for a batch
  const handleToggleSelect = (batch: ExtendedRawBatch) => {
    const currentQty = issueQtyMap.get(batch.batchId) || 0;
    if (currentQty > 0) {
      handleQtyChange(batch.batchId, 0);
    } else {
      handleWithdrawRemaining(batch);
    }
  };

  const weightedAvgCost = totalRawQty > 0 ? totalRawCost / totalRawQty : 0;
  const totalAvailableStockInWarehouse = availableBatches.reduce(
    (sum, b) => sum + Number(b.availableQty || 0),
    0
  );

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      {/* Header & Station / Warehouse Context Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#012d1d]" />
            <span>الخطوة 2: سحب لوطات الخام من مخزن المحطة (Target &rarr; Actual)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            حدد الكمية المستهدفة للتشغيل أولاً، ثم وزع السحب على اللوطات المتاحة حتى الوصول للمطابقة التامة (Exact Match).
          </p>
        </div>

        {/* Station & Warehouse Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-700 text-xs py-1 px-2.5 gap-1.5 font-semibold">
            <Building2 className="w-3.5 h-3.5 text-[#012d1d]" />
            <span>المحطة: {selectedStation?.name || stationId || "غير محدد"}</span>
          </Badge>
          <Badge variant="outline" className="bg-emerald-50 border-emerald-300 text-emerald-800 text-xs py-1 px-2.5 gap-1.5 font-semibold">
            <Warehouse className="w-3.5 h-3.5 text-emerald-700" />
            <span>المخزن: {rawWarehouseName}</span>
          </Badge>
          <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-800 text-xs py-1 px-2.5 gap-1.5 font-semibold font-mono">
            <span>الرصيد المتاح بالمحطة: {totalAvailableStockInWarehouse.toLocaleString()} كجم</span>
          </Badge>
        </div>
      </div>

      {/* Target Input Section */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-700" />
            <div>
              <label htmlFor="targetRawKgInput" className="text-sm font-bold text-gray-900">
                الكمية المستهدفة للسحب (Target Quantity) <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-gray-500">
                إجمالي كمية الخام المطلوب سحبها لتشغيل هذه الوجبة (كجم)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="targetRawKgInput"
              type="number"
              min={0}
              step="any"
              value={target === 0 ? "" : target}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                if (onTargetChange) onTargetChange(val);
              }}
              placeholder="مثال: 5000"
              className="w-44 h-10 text-base font-bold font-mono bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-600"
            />
            <span className="text-xs font-bold text-gray-600">كجم</span>
          </div>
        </div>

        {target > totalAvailableStockInWarehouse && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              تنبيه: الكمية المستهدفة ({target.toLocaleString()} كجم) تتجاوز إجمالي الرصيد المتاح بالمخزن ({totalAvailableStockInWarehouse.toLocaleString()} كجم).
            </span>
          </div>
        )}
      </div>

      {/* Target vs Actual Progress Card */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-gray-500 block">المطلوب (Target)</span>
            <span className="text-lg font-extrabold font-mono text-gray-900">
              {target.toLocaleString()} <span className="text-xs font-normal font-sans">كجم</span>
            </span>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <span className="text-[11px] font-semibold text-indigo-700 block">المسحوب الفعلي (Actual)</span>
            <span className="text-lg font-extrabold font-mono text-indigo-900">
              {totalRawQty.toLocaleString()} <span className="text-xs font-normal font-sans">كجم</span>
            </span>
          </div>

          <div className={`p-3 rounded-lg border ${
            isExactMatch
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : isOverTarget
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <span className="text-[11px] font-semibold block">المتبقي (Remaining)</span>
            <span className="text-lg font-extrabold font-mono">
              {rawRemaining.toLocaleString()} <span className="text-xs font-normal font-sans">كجم</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-semibold text-gray-500 block">نسبة الإنجاز</span>
            <span className="text-lg font-extrabold font-mono text-gray-900">
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isExactMatch
                ? "bg-emerald-600"
                : isOverTarget
                ? "bg-red-600"
                : "bg-indigo-600"
            }`}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>

        {/* Dynamic Status Alert Banner */}
        {target <= 0 ? (
          <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>يرجى إدخال الكمية المستهدفة للسحب أولاً للبدء في توزيع السحب على اللوطات.</span>
          </div>
        ) : isExactMatch ? (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>✓ تطابق تام (Exact Match): المسحوب الفعلي ({totalRawQty.toLocaleString()} كجم) يطابق المطلوب تماماً. زر المتابعة مفعل.</span>
          </div>
        ) : isOverTarget ? (
          <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>تجاوز الكمية المطلوبة: إجمالي المسحوب يتجاوز المستهدف بمقدار {Math.abs(rawRemaining).toLocaleString()} كجم. زر المتابعة معطل حتى المطابقة.</span>
          </div>
        ) : (
          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>متبقي {rawRemaining.toLocaleString()} كجم للوصول للمستهدف. يمكنك الضغط على زر &quot;سحب المتبقي&quot; أمام أي لوط لتسوية الفارق فوراً.</span>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors?.rawIssues && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors.rawIssues[0]}</span>
        </div>
      )}

      {availableBatches.length === 0 ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex flex-col items-center justify-center text-center gap-2">
          <AlertCircle className="h-8 w-8 text-amber-600 mb-1" />
          <strong className="font-bold">لا توجد لوطات خام متاحة حالياً بمخزن خامات هذه المحطة</strong>
          <p className="text-xs text-amber-700 max-w-md">
            لم يتم العثور على لوطات خام برصيد متاح &gt; 0 ومعتمدة جودة (QC APPROVED) في {rawWarehouseName}.
            يرجى إضافة أو استلام لوط خام للمحطة أولاً من شاشة مشتريات الخام.
          </p>
        </div>
      ) : (
        <>
          {/* Search bar & quick filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
              <Input
                type="text"
                placeholder="بحث برقم اللوط أو اسم المورد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 h-9 text-xs"
              />
            </div>
            <div className="text-xs text-gray-500 font-semibold">
              تم العثور على {filteredBatches.length} لوط خام متاح بالمحطة
            </div>
          </div>

          {/* Available Raw Batches Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="p-3 w-12 text-center">اختيار</th>
                    <th className="p-3">رقم اللوط (Batch ID)</th>
                    <th className="p-3">المورد / المزرعة</th>
                    <th className="p-3">تاريخ الاستلام</th>
                    <th className="p-3">الرصيد المتاح (كجم)</th>
                    <th className="p-3">تكلفة الكيلو (ج.م)</th>
                    <th className="p-3 w-64">الكمية المسحوبة (كجم)</th>
                    <th className="p-3">إجمالي تكلفة السحب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {filteredBatches.map((batch) => {
                    const currentQty = issueQtyMap.get(batch.batchId) || 0;
                    const available = Number(batch.availableQty);
                    const unitCost = Number(batch.unitCost);
                    const isSelected = currentQty > 0;
                    const isOver = currentQty > available;
                    const rowCost = currentQty * unitCost;

                    return (
                      <tr
                        key={batch.batchId}
                        className={`transition-colors ${
                          isOver
                            ? "bg-red-50/60"
                            : isSelected
                            ? "bg-emerald-50/40"
                            : "hover:bg-gray-50/80"
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(batch)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-[#012d1d] border-[#012d1d] text-white"
                                : "border-gray-300 bg-white hover:border-gray-400 text-transparent"
                            }`}
                            title={isSelected ? "إلغاء اختيار اللوط" : "اختيار اللوط"}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </td>

                        {/* Batch ID */}
                        <td className="p-3 font-bold text-gray-900">
                          <div className="flex items-center gap-1.5">
                            <span>{batch.batchId}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans font-semibold">
                              معتمد
                            </span>
                          </div>
                        </td>

                        {/* Supplier */}
                        <td className="p-3 font-sans text-gray-700 font-semibold">
                          {batch.supplier?.name || "مورد معتمد"}
                        </td>

                        {/* Received Date */}
                        <td className="p-3 text-gray-500 font-sans text-[11px]">
                          {batch.receivedDate
                            ? new Date(batch.receivedDate).toISOString().substring(0, 10)
                            : "—"}
                        </td>

                        {/* Available Qty */}
                        <td className="p-3 font-bold text-gray-900 font-mono">
                          {available.toLocaleString()}{" "}
                          <span className="text-[10px] text-gray-500 font-sans">كجم</span>
                        </td>

                        {/* Unit Cost */}
                        <td className="p-3 text-gray-700 font-mono">
                          {unitCost.toFixed(2)}{" "}
                          <span className="text-[10px] text-gray-400 font-sans">ج.م/كجم</span>
                        </td>

                        {/* Withdrawn Qty Input & Quick Actions */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={available}
                              step="any"
                              value={currentQty === 0 ? "" : currentQty}
                              onChange={(e) =>
                                handleQtyChange(
                                  batch.batchId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className={`w-28 h-8 px-2 rounded border text-xs font-bold font-mono focus:outline-none transition-colors ${
                                isOver
                                  ? "border-red-500 bg-red-50 text-red-700"
                                  : isSelected
                                  ? "border-emerald-500 bg-white text-emerald-900 focus:ring-1 focus:ring-emerald-600"
                                  : "border-gray-300 bg-white text-gray-700 focus:ring-1 focus:ring-[#012d1d]"
                              }`}
                            />

                            {/* Withdraw Remaining Button */}
                            {target > 0 && rawRemaining > 0 && currentQty === 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleWithdrawRemaining(batch)}
                                className="h-8 px-2 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border-indigo-200 shrink-0 gap-1"
                                title="سحب المتبقي لإكمال المستهدف"
                              >
                                <ArrowDownToLine className="w-3 h-3" />
                                سحب المتبقي
                              </Button>
                            )}

                            {/* Withdraw All Button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleWithdrawAll(batch)}
                              className="h-8 px-2 text-[10px] font-bold text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 shrink-0"
                              title="سحب الرصيد"
                            >
                              الكل
                            </Button>
                          </div>
                          {isOver && (
                            <p className="text-[10px] text-red-600 font-sans mt-0.5 font-semibold">
                              يتجاوز رصيد اللوط ({available.toLocaleString()} كجم)
                            </p>
                          )}
                        </td>

                        {/* Line Cost */}
                        <td className="p-3 font-bold text-[#012d1d] font-mono">
                          {rowCost.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          <span className="text-[10px] text-gray-500 font-sans">ج.م</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warning Box for Over-withdrawal */}
          {hasOverWithdrawal && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>
                تنبيه: يوجد لوط خام أو أكثر تم إدخال كمية مسحوبة أكبر من رصيده المتاح بالمخزن. يرجى تصحيح الكميات للاستمرار.
              </span>
            </div>
          )}

          {/* Live Summary Footer */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-emerald-950 font-mono shadow-2xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-gray-600 font-sans block text-[11px]">اللوطات المحددة:</span>
                <strong className="text-sm text-emerald-900 font-mono">
                  {selectedBatchesCount} من أصل {availableBatches.length} لوط
                </strong>
              </div>
              <div>
                <span className="text-gray-600 font-sans block text-[11px]">إجمالي الكمية المسحوبة:</span>
                <strong className="text-sm text-[#012d1d] font-mono">
                  {totalRawQty.toLocaleString()} كجم
                </strong>
              </div>
              <div>
                <span className="text-gray-600 font-sans block text-[11px]">حالة المطابقة:</span>
                <strong className={`text-sm font-sans font-bold ${
                  isExactMatch ? "text-emerald-700" : isOverTarget ? "text-red-600" : "text-amber-700"
                }`}>
                  {isExactMatch ? "مطابق تماماً ✓" : isOverTarget ? "تجاوز المستهدف ✗" : "غير مكتمل"}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-6 text-left sm:text-right">
              <div>
                <span className="text-gray-600 font-sans block text-[11px]">متوسط سعر الكيلو:</span>
                <strong className="text-sm text-emerald-900 font-mono">
                  {weightedAvgCost.toFixed(2)} ج.م/كجم
                </strong>
              </div>
              <div>
                <span className="text-gray-600 font-sans block text-[11px]">إجمالي تكلفة الخام:</span>
                <strong className="text-base text-[#012d1d] font-mono">
                  {totalRawCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ج.م
                </strong>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
