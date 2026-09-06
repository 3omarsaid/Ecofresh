import React, { useMemo } from "react";
import { Supply, Station } from "@prisma/client";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Warehouse,
  Building2,
  PackageCheck,
  AlertTriangle,
  ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableCombobox } from "@/components/ui/combobox";

export type SupplyIssueItem = {
  supplyId: string;
  requested: number;
  consumed: number;
  waste: number;
  unitCost: number;
};

type ExtendedStation = Station & {
  stockLocations?: Array<{
    id: string;
    type: string;
    name: string;
  }>;
};

type ExtendedSupply = Supply & {
  stationSupplies?: Array<{
    id: string;
    locationId: string;
    stock: number;
    location?: {
      id: string;
      stationId: string | null;
      type: string;
      name: string;
    };
  }>;
};

interface Step3SuppliesProps {
  stationId?: string;
  stations?: ExtendedStation[];
  supplies: ExtendedSupply[];
  suppliesIssues: SupplyIssueItem[];
  onChange: (suppliesIssues: SupplyIssueItem[]) => void;
  errors?: Record<string, string[]>;
}

export function Step3Supplies({
  stationId,
  stations = [],
  supplies,
  suppliesIssues,
  onChange,
  errors,
}: Step3SuppliesProps) {
  // Resolve Station and SUPPLIES Warehouse
  const selectedStation = useMemo(() => {
    return stations.find((s) => s.id === stationId);
  }, [stations, stationId]);

  const suppliesWarehouse = useMemo(() => {
    return selectedStation?.stockLocations?.find((l) => l.type === "SUPPLIES");
  }, [selectedStation]);

  const suppliesWarehouseName =
    suppliesWarehouse?.name ||
    (selectedStation ? `${selectedStation.name} — مخزن المستلزمات` : "مخزن المستلزمات");

  // Helper to get authoritative stock for a supply in this station's SUPPLIES warehouse
  const getStationStock = (supply: ExtendedSupply | undefined): number => {
    if (!supply) return 0;
    if (supply.stationSupplies && supply.stationSupplies.length > 0) {
      const match = supply.stationSupplies.find(
        (ss) =>
          ss.location?.stationId === stationId && ss.location?.type === "SUPPLIES"
      );
      if (match) return Number(match.stock || 0);
    }
    // Fallback if not populated or standalone
    return Number(supply.stock || 0);
  };

  const addSupplyRow = () => {
    const selectedIds = new Set(suppliesIssues.map((s) => s.supplyId));
    const nextSupply = supplies.find((s) => !selectedIds.has(s.id));

    if (nextSupply) {
      onChange([
        ...suppliesIssues,
        {
          supplyId: nextSupply.id,
          requested: 0,
          consumed: 0,
          waste: 0,
          unitCost: Number(nextSupply.unitPrice || 0),
        },
      ]);
    } else if (supplies.length > 0) {
      onChange([
        ...suppliesIssues,
        {
          supplyId: supplies[0].id,
          requested: 0,
          consumed: 0,
          waste: 0,
          unitCost: Number(supplies[0].unitPrice || 0),
        },
      ]);
    }
  };

  const removeSupplyRow = (index: number) => {
    const updated = [...suppliesIssues];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateSupplyRow = (index: number, field: keyof SupplyIssueItem, value: any) => {
    const updated = [...suppliesIssues];
    const item = { ...updated[index], [field]: value };

    if (field === "supplyId") {
      const sup = supplies.find((s) => s.id === value);
      if (sup) {
        item.unitCost = Number(sup.unitPrice || 0);
      }
    }

    updated[index] = item;
    onChange(updated);
  };

  // Quick action: Withdraw full requested amount as consumed
  const handleAutoFulfillRequested = (index: number) => {
    const row = suppliesIssues[index];
    const supply = supplies.find((s) => s.id === row.supplyId);
    const stock = getStationStock(supply);
    const requested = Number(row.requested || 0);
    const toConsume = Math.min(requested, stock);

    const updated = [...suppliesIssues];
    updated[index] = {
      ...row,
      consumed: toConsume,
      waste: 0,
    };
    onChange(updated);
  };

  let hasOverStock = false;
  let hasDiscrepancy = false;
  let totalConsumedCost = 0;
  let totalWasteCost = 0;
  let totalRequestedCount = 0;
  let totalWithdrawnCount = 0;

  const rowDetails = suppliesIssues.map((issue) => {
    const supply = supplies.find((s) => s.id === issue.supplyId);
    const stock = getStationStock(supply);
    const requested = Number(issue.requested || 0);
    const consumed = Number(issue.consumed || 0);
    const waste = Number(issue.waste || 0);
    const totalWithdrawn = Math.round((consumed + waste) * 100) / 100;
    const remaining = Math.round((requested - totalWithdrawn) * 100) / 100;

    const isOver = totalWithdrawn > stock;
    const isRowExactMatch = requested > 0 && Math.abs(remaining) < 0.001;
    const isRowOverRequested = requested > 0 && remaining < -0.001;
    const isRowUnderRequested = requested > 0 && remaining > 0.001;

    if (isOver) hasOverStock = true;
    if (requested > 0 && !isRowExactMatch) hasDiscrepancy = true;
    if (requested <= 0 && totalWithdrawn > 0) hasDiscrepancy = true;

    const unitCost = issue.unitCost || (supply ? Number(supply.unitPrice || 0) : 0);
    const consumedCost = consumed * unitCost;
    const wasteCost = waste * unitCost;
    const totalRowCost = totalWithdrawn * unitCost;

    totalConsumedCost += consumedCost;
    totalWasteCost += wasteCost;
    totalRequestedCount += requested;
    totalWithdrawnCount += totalWithdrawn;

    return {
      ...issue,
      supply,
      stock,
      requested,
      consumed,
      waste,
      totalWithdrawn,
      remaining,
      unitCost,
      consumedCost,
      wasteCost,
      totalRowCost,
      isOver,
      isRowExactMatch,
      isRowOverRequested,
      isRowUnderRequested,
    };
  });

  const grandSuppliesCost = totalConsumedCost + totalWasteCost;
  const allRowsExactMatch =
    rowDetails.length > 0 &&
    rowDetails.every((r) => r.isRowExactMatch && !r.isOver);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      {/* Header & Station / Warehouse Context Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#012d1d]" />
            <span>الخطوة 3: استهلاك مواد التعبئة والتغليف (Supplies)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            تسجيل الكراتين، الأكياس والمستلزمات المستهلكة مع إثبات هالك التعبئة وفق مبدأ المطابقة (Requested = Consumed + Waste).
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
            <span>المخزن: {suppliesWarehouseName}</span>
          </Badge>
          <Button
            type="button"
            onClick={addSupplyRow}
            disabled={supplies.length === 0}
            className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-semibold text-xs h-8"
          >
            <Plus className="h-4 w-4" /> إضافة مستلزم تعبئة
          </Button>
        </div>
      </div>

      {/* Cumulative Status Card (Target vs Actual for Supplies) */}
      {rowDetails.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-2xs space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-gray-500 block">عدد المستلزمات</span>
              <span className="text-lg font-extrabold font-mono text-gray-900">
                {rowDetails.length} <span className="text-xs font-normal font-sans">أصناف</span>
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-indigo-700 block">إجمالي المطلوب (Requested)</span>
              <span className="text-lg font-extrabold font-mono text-indigo-900">
                {totalRequestedCount.toLocaleString()}
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-emerald-700 block">إجمالي المنصرف (Withdrawn)</span>
              <span className="text-lg font-extrabold font-mono text-emerald-900">
                {totalWithdrawnCount.toLocaleString()}
              </span>
            </div>

            <div className={`p-3 rounded-lg border ${
              allRowsExactMatch
                ? "bg-emerald-100/80 border-emerald-300 text-emerald-900"
                : hasOverStock
                ? "bg-red-100/80 border-red-300 text-red-900"
                : "bg-amber-100/80 border-amber-300 text-amber-900"
            }`}>
              <span className="text-[11px] font-semibold block">حالة المطابقة الكلية</span>
              <span className="text-base font-bold font-sans">
                {allRowsExactMatch
                  ? "مطابق تماماً ✓"
                  : hasOverStock
                  ? "تجاوز الرصيد ✗"
                  : hasDiscrepancy
                  ? "غير مطابق ✗"
                  : "بانتظار الإدخال"}
              </span>
            </div>
          </div>

          {/* Status Message */}
          {allRowsExactMatch ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ جميع بنود المستلزمات متطابقة تماماً (المطلوب = السليم + الهالك) ولا يوجد تجاوز للأرصدة.</span>
            </div>
          ) : hasOverStock ? (
            <div className="p-2.5 bg-red-50 border border-red-300 rounded-lg text-red-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>تنبيه: يوجد مستلزم أو أكثر يتجاوز رصيد مخزن المستلزمات بالمحطة. زر المتابعة معطل.</span>
            </div>
          ) : hasDiscrepancy ? (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>تنبيه: يجب أن يتطابق إجمالي المنصرف (المستهلك السليم + الهالك) مع الكمية المطلوبة لكل مستلزم للمتابعة.</span>
            </div>
          ) : null}
        </div>
      )}

      {errors?.suppliesIssues && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errors.suppliesIssues[0]}</span>
        </div>
      )}

      {/* Supplies Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
              <tr>
                <th className="p-3 min-w-[220px]">الصنف / المستلزم</th>
                <th className="p-3">الوحدة</th>
                <th className="p-3">الرصيد المتاح بالمحطة</th>
                <th className="p-3 w-28 bg-indigo-50/50 text-indigo-900">المطلوب (Target)</th>
                <th className="p-3 w-28">المستهلك السليم</th>
                <th className="p-3 w-28 bg-red-50/50 text-red-900">الهالك (Waste)</th>
                <th className="p-3">المنصرف الكلي</th>
                <th className="p-3">المتبقي</th>
                <th className="p-3">سعر الوحدة</th>
                <th className="p-3">إجمالي التكلفة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {rowDetails.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-400 font-sans">
                    لم يتم إضافة أي مستلزم تعبئة بعد. اضغط على &quot;إضافة مستلزم تعبئة&quot; بالأعلى.
                  </td>
                </tr>
              ) : (
                rowDetails.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      row.isOver
                        ? "bg-red-50/50"
                        : row.isRowExactMatch
                        ? "bg-emerald-50/30"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Supply Selection */}
                    <td className="p-3 font-sans">
                      <SearchableCombobox
                        options={supplies.map((s) => {
                          const stock = getStationStock(s);
                          return {
                            value: s.id,
                            label: s.name,
                            sublabel: `كود: ${s.code}`,
                            badge: `رصيد المحطة: ${stock.toLocaleString()} ${s.unit} | ${Number(s.unitPrice || 0).toFixed(2)} ج.م`,
                            badgeColor: stock > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200",
                          };
                        })}
                        value={row.supplyId}
                        onChange={(val) => updateSupplyRow(idx, "supplyId", val)}
                        placeholder="-- اختر مستلزم التعبئة --"
                        searchPlaceholder="بحث باسم المستلزم أو الكود..."
                      />
                    </td>

                    {/* Unit */}
                    <td className="p-3 font-sans text-gray-600">
                      {row.supply?.unit || "وحدة"}
                    </td>

                    {/* Available Stock */}
                    <td className="p-3 font-bold text-gray-900 font-mono">
                      {row.stock.toLocaleString()}
                    </td>

                    {/* Requested / Target */}
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.requested === 0 ? "" : row.requested}
                        onChange={(e) => updateSupplyRow(idx, "requested", parseFloat(e.target.value) || 0)}
                        className="w-full h-8 px-2 rounded border border-indigo-300 bg-indigo-50/20 text-xs font-bold font-mono text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        placeholder="0"
                      />
                    </td>

                    {/* Consumed */}
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.consumed === 0 ? "" : row.consumed}
                        onChange={(e) => updateSupplyRow(idx, "consumed", parseFloat(e.target.value) || 0)}
                        className="w-full h-8 px-2 rounded border border-gray-300 text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#012d1d]"
                        placeholder="0"
                      />
                    </td>

                    {/* Waste */}
                    <td className="p-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.waste === 0 ? "" : row.waste}
                        onChange={(e) => updateSupplyRow(idx, "waste", parseFloat(e.target.value) || 0)}
                        className="w-full h-8 px-2 rounded border border-red-300 bg-red-50/30 text-xs font-bold font-mono text-red-800 focus:outline-none focus:ring-1 focus:ring-red-500"
                        placeholder="0"
                      />
                    </td>

                    {/* Total Withdrawn */}
                    <td className="p-3 font-bold text-gray-900">
                      <div>{row.totalWithdrawn.toLocaleString()}</div>
                      {row.isOver && (
                        <p className="text-[10px] text-red-600 font-sans mt-0.5 font-semibold">
                          يتجاوز الرصيد ({row.stock.toLocaleString()})
                        </p>
                      )}
                    </td>

                    {/* Remaining & Match Badge */}
                    <td className="p-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        row.isRowExactMatch
                          ? "bg-emerald-100 text-emerald-800"
                          : row.isRowOverRequested
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {row.isRowExactMatch
                          ? "مطابق ✓"
                          : row.isRowOverRequested
                          ? `+${Math.abs(row.remaining)}`
                          : `-${row.remaining}`}
                      </span>
                    </td>

                    {/* Unit Cost */}
                    <td className="p-3 text-gray-700">
                      {row.unitCost.toFixed(2)}{" "}
                      <span className="text-[10px] text-gray-400 font-sans">ج.م</span>
                    </td>

                    {/* Total Row Cost */}
                    <td className="p-3 font-bold text-[#012d1d]">
                      {row.totalRowCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      <span className="text-[10px] text-gray-500 font-sans">ج.م</span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.requested > 0 && !row.isRowExactMatch && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAutoFulfillRequested(idx)}
                            className="h-7 px-1.5 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border-indigo-200"
                            title="صرف المطلوب بالكامل كسليم"
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            صرف المطلوب
                          </Button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSupplyRow(idx)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="حذف البند"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Box for Stock Exceeding */}
      {hasOverStock && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>
            تنبيه: الكمية المنصرفة الكلية لمستلزم أو أكثر تتجاوز الرصيد المتاح بمخزن المستلزمات لهذه المحطة. يرجى تعديل الكميات للاستمرار.
          </span>
        </div>
      )}

      {/* Summary Cost Box */}
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
        <div className="text-gray-700">
          تكلفة المستهلك السليم:{" "}
          <strong className="text-emerald-700">
            {totalConsumedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
          </strong>{" "}
          | تكلفة الهالك:{" "}
          <strong className="text-red-600">
            {totalWasteCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
          </strong>
        </div>
        <div>
          إجمالي تكلفة المستلزمات:{" "}
          <strong className="text-sm text-[#012d1d]">
            {grandSuppliesCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
          </strong>
        </div>
      </div>
    </div>
  );
}
