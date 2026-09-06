import React from "react";
import { Station, Contractor } from "@prisma/client";
import { RawBatchItem } from "./step-2-raw-issues";
import { SupplyIssueItem } from "./step-3-supplies";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Scale, AlertCircle } from "lucide-react";

interface Step4CostingPreviewProps {
  station: Station | undefined;
  contractor: Contractor | undefined;
  rawIssues: RawBatchItem[];
  rawBatches: Array<{ batchId: string; unitCost: any }>;
  suppliesIssues: SupplyIssueItem[];
  finishedOutputKg: number;
  secondaryOutputKg?: number;
  otherCost: number;
  notes: string;
  onChange: (fields: Partial<{
    finishedOutputKg: number;
    secondaryOutputKg?: number;
    otherCost: number;
    notes: string;
  }>) => void;
  errors?: Record<string, string[]>;
}

export function Step4CostingPreview({
  station,
  contractor,
  rawIssues,
  rawBatches,
  suppliesIssues,
  finishedOutputKg,
  otherCost,
  notes,
  onChange,
  errors,
}: Step4CostingPreviewProps) {
  // 1. Calculate Raw Input (kg) & Total Raw Cost (EGP)
  const totalRawInputKg = rawIssues.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const totalRawCostEgp = rawIssues.reduce((sum, item) => {
    const b = rawBatches.find((batch) => batch.batchId === item.batchId);
    const unitCost = b ? Number(b.unitCost) : 0;
    return sum + Number(item.qty || 0) * unitCost;
  }, 0);

  // 2. Strict Deterministic Calculations (Rule 1 & Rule 3):
  // Waste = Input - Output
  const isOutputExceedingInput = finishedOutputKg > totalRawInputKg;
  const rawWasteKg = Math.max(0, Math.round((totalRawInputKg - Number(finishedOutputKg || 0)) * 100) / 100);

  // Waste % and Yield %
  const wastePct = totalRawInputKg > 0
    ? Math.round(((rawWasteKg / totalRawInputKg) * 100) * 100) / 100
    : 0;
  const yieldPct = totalRawInputKg > 0
    ? Math.round(((Number(finishedOutputKg || 0) / totalRawInputKg) * 100) * 100) / 100
    : 0;

  // 3. Contractor Cost = Finished Output * Contractor Rate
  const contractorRate = contractor ? Number(contractor.tariffRatePerKg) : 2.0;
  const contractorCostEgp = Math.round(Number(finishedOutputKg || 0) * contractorRate * 100) / 100;

  // 4. Station Cost = Finished Output * Station Electricity Rate
  const stationRate = station ? Number(station.electricityRatePerKg) : 2.5;
  const stationCostEgp = Math.round(Number(finishedOutputKg || 0) * stationRate * 100) / 100;

  // 5. Supplies Cost
  let suppliesConsumedCostEgp = 0;
  let suppliesWasteCostEgp = 0;
  suppliesIssues.forEach((item) => {
    const unitCost = Number(item.unitCost || 0);
    const consumedCost = Number(item.consumed || 0) * unitCost;
    const wasteCost = Number(item.waste || 0) * unitCost;
    suppliesConsumedCostEgp += consumedCost;
    suppliesWasteCostEgp += wasteCost;
  });
  const totalSuppliesCostEgp = Math.round((suppliesConsumedCostEgp + suppliesWasteCostEgp) * 100) / 100;

  // 6. Grand Total Cost = Raw Cost + Contractor Cost + Station Cost + Supplies Cost + Other Cost
  const grandTotalCostEgp =
    Math.round((totalRawCostEgp + contractorCostEgp + stationCostEgp + totalSuppliesCostEgp + Number(otherCost || 0)) * 100) / 100;

  // 7. Unit Cost (EGP/kg) = Grand Total Cost / Finished Output
  const unitCostPerKg = finishedOutputKg > 0 ? Math.round((grandTotalCostEgp / finishedOutputKg) * 100) / 100 : 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          الخطوة 4: الناتج الفعلي والمعاينة الحسابية اللحظية (Reactive Costing)
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          إدخال الناتج التام الفعلي، واحتساب الهالك ونسبة التصافي آلياً وتوزيع عناصر التكاليف المباشرة.
        </p>
      </div>

      {/* Warning if Output > Input */}
      {isOutputExceedingInput && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong className="block text-sm font-bold">خطأ في كمية الإنتاج:</strong>
            <p className="text-xs mt-0.5">
              الكمية الخارجة ({finishedOutputKg.toLocaleString()} كجم) لا يمكن أن تكون أكبر من الكمية الداخلة ({totalRawInputKg.toLocaleString()} كجم).
            </p>
          </div>
        </div>
      )}

      {/* Total Loss notice if Output = 0 */}
      {finishedOutputKg === 0 && totalRawInputKg > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-center gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>حالة هالك كلي (Total Loss): إجمالي الكمية الداخلة ({totalRawInputKg.toLocaleString()} كجم) تم تصنيفها كهالك بالكامل (100%).</span>
        </div>
      )}

      {/* Main Reactive Production Matrix (Rule 16) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Input */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5">
          <span className="text-xs font-semibold text-gray-600 block">إجمالي الكمية الداخلة (Input)</span>
          <div className="text-2xl font-extrabold font-mono text-gray-900">
            {totalRawInputKg.toLocaleString()} <span className="text-xs font-normal font-sans text-gray-500">كجم</span>
          </div>
          <span className="text-[10px] text-gray-500 block">مجموع لوطات الخام المسحوبة</span>
        </div>

        {/* Finished Output (Input Field) */}
        <div className="bg-emerald-50/50 border-2 border-emerald-500/40 rounded-xl p-4 space-y-1.5">
          <Label className="text-xs font-bold text-emerald-900 block">
            الكمية الخارجة التامة (Output) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            min={0}
            max={totalRawInputKg}
            step="any"
            value={finishedOutputKg === 0 && totalRawInputKg === 0 ? "" : finishedOutputKg}
            onChange={(e) => onChange({ finishedOutputKg: Number(e.target.value) })}
            className="h-10 text-xl font-mono font-extrabold text-emerald-900 bg-white border-emerald-300 focus:ring-emerald-600"
            placeholder="0"
          />
          {errors?.finishedOutputKg && (
            <p className="text-[11px] text-red-600 font-semibold">{errors.finishedOutputKg[0]}</p>
          )}
        </div>

        {/* Waste (Auto Calculated) */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-900">
            <span>الهالك الفعلي (Waste)</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.2 rounded-full font-mono font-bold">
              {wastePct.toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-800">
            {isOutputExceedingInput ? "—" : rawWasteKg.toLocaleString()}{" "}
            <span className="text-xs font-normal font-sans text-rose-600">كجم</span>
          </div>
          <span className="text-[10px] text-rose-700 block">الداخل - الخارج (محسوب آلياً)</span>
        </div>

        {/* Yield % (Auto Calculated) */}
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
            <span>نسبة التصافي والإنتاج (Yield)</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-blue-800">
            {isOutputExceedingInput ? "—" : `${yieldPct.toFixed(1)}%`}
          </div>
          <span className="text-[10px] text-blue-700 block">(الخارج ÷ الداخل) × 100</span>
        </div>
      </div>

      {/* Reactive Visual Yield Progress */}
      <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-gray-700">توزيع نسبة التصافي مقابل الهالك:</span>
          <span className="font-mono text-gray-900">
            إنتاج: {yieldPct.toFixed(1)}% | هالك: {wastePct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden flex">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${Math.min(yieldPct, 100)}%` }}
            title={`تصافي: ${yieldPct.toFixed(1)}%`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${Math.min(wastePct, 100)}%` }}
            title={`هالك: ${wastePct.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Direct Cost Components Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900">توزيع التكاليف المباشرة والخدمات:</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50">
            <span className="text-xs text-gray-500 block">مصنعية المقاول (محسوبة):</span>
            <span className="text-sm font-bold font-mono text-gray-900 mt-1 block">
              {contractorCostEgp.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
            </span>
            <span className="text-[10px] text-gray-400">
              ({contractorRate} ج.م/كجم × {finishedOutputKg || 0} كجم خارج)
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50">
            <span className="text-xs text-gray-500 block">تكلفة تشغيل المحطة:</span>
            <span className="text-sm font-bold font-mono text-gray-900 mt-1 block">
              {stationCostEgp.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
            </span>
            <span className="text-[10px] text-gray-400">
              ({stationRate} ج.م/كجم × {finishedOutputKg || 0} كجم خارج)
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50">
            <span className="text-xs text-gray-500 block">تكلفة مواد التعبئة (محسوبة):</span>
            <span className="text-sm font-bold font-mono text-gray-900 mt-1 block">
              {totalSuppliesCostEgp.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م
            </span>
            <span className="text-[10px] text-gray-400">
              (سليم: {suppliesConsumedCostEgp.toLocaleString()} | هالك: {suppliesWasteCostEgp.toLocaleString()})
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50">
            <Label className="text-xs text-gray-700 block mb-1">مصاريف ونثريات أخرى (ج.م):</Label>
            <Input
              type="number"
              min={0}
              step="any"
              value={otherCost || ""}
              onChange={(e) => onChange({ otherCost: Number(e.target.value) })}
              className="h-9 font-mono font-bold text-gray-800 text-xs"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Summary Cost Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#012d1d] to-[#02472e] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-emerald-200 font-semibold block">إجمالي تكلفة التشغيلة (Grand Total):</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {grandTotalCostEgp.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
            <span className="text-xs font-normal font-sans">ج.م</span>
          </div>
          <span className="text-[11px] text-emerald-300/80 block mt-0.5">
            خام: {totalRawCostEgp.toLocaleString()} ج.م | مستلزمات: {totalSuppliesCostEgp.toLocaleString()} ج.م | مقاول: {contractorCostEgp.toLocaleString()} ج.م | محطة: {stationCostEgp.toLocaleString()} ج.م
          </span>
        </div>

        <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-r border-emerald-800 pt-3 sm:pt-0 sm:pr-6">
          <span className="text-xs text-emerald-200 font-semibold block">تكلفة الكيلو الموزونة التامة:</span>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
            {unitCostPerKg > 0 ? unitCostPerKg.toFixed(2) : "0.00"}{" "}
            <span className="text-xs font-normal font-sans text-white">ج.م/كجم</span>
          </div>
          <span className="text-[10px] text-emerald-300/80 block mt-0.5">
            تُسجل كرصيد تكلفة للباتش التام المتولد
          </span>
        </div>
      </div>

      {/* Operation Notes */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-gray-700">ملاحظات التشغيل والفرز:</Label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="أدخل أي ملاحظات فنية أو تشغيلية خاصة بالتشغيلة..."
          className="w-full p-3 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#012d1d]"
        />
      </div>
    </div>
  );
}
