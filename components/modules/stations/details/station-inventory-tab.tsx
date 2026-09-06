"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Box,
  Package,
  Layers,
  Scale,
  GitBranch,
  Warehouse,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StationInventoryTabProps {
  station: any;
  inventory: {
    rawBatches: any[];
    finishedBatches: any[];
    stationSupplies: any[];
  };
  onOpenAdjustment: () => void;
  onSelectLotForTrace: (lotId: string) => void;
}

export function StationInventoryTab({
  station,
  inventory,
  onOpenAdjustment,
  onSelectLotForTrace,
}: StationInventoryTabProps) {
  const [filterType, setFilterType] = useState<"ALL" | "RAW" | "FINISHED" | "SUPPLIES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Normalize all three inventory sources into a single unified row format
  const unifiedRows = useMemo(() => {
    const rows: Array<{
      id: string;
      itemType: "RAW" | "FINISHED" | "SUPPLIES";
      typeLabel: string;
      productName: string;
      category: string;
      lotId: string;
      date: string;
      totalQty: number;
      availableQty: number;
      unit: string;
      locationName: string;
      status: string;
      unitCost: number;
      supplierName?: string;
    }> = [];

    // 1. Raw Batches
    inventory.rawBatches.forEach((b) => {
      rows.push({
        id: `raw-${b.batchId}`,
        itemType: "RAW",
        typeLabel: "خام زراعي",
        productName: b.rawProduct,
        category: "محاصيل زراعية",
        lotId: b.batchId,
        date: new Date(b.receivedDate).toLocaleDateString("ar-EG"),
        totalQty: Number(b.initialQty),
        availableQty: Number(b.availableQty),
        unit: "كجم",
        locationName: b.location?.name || "مخزن الخامات",
        status: b.qcStatus === "APPROVED" ? "معتمد جودة" : b.qcStatus,
        unitCost: Number(b.unitCost),
        supplierName: b.supplier?.name,
      });
    });

    // 2. Finished Goods Batches
    inventory.finishedBatches.forEach((fg) => {
      rows.push({
        id: `fg-${fg.fgBatchId}`,
        itemType: "FINISHED",
        typeLabel: "منتج تام",
        productName: fg.productName,
        category: "مجمدات IQF",
        lotId: fg.fgBatchId,
        date: new Date(fg.productionDate).toLocaleDateString("ar-EG"),
        totalQty: Number(fg.initialQty),
        availableQty: Number(fg.availableQty),
        unit: "كجم",
        locationName: fg.location?.name || "مخزن المنتج التام",
        status: fg.qualityStatus || "مطابق للمواصفات",
        unitCost: Number(fg.costPerKg),
      });
    });

    // 3. Station Supplies
    inventory.stationSupplies.forEach((ss) => {
      const stock = Number(ss.stock);
      if (stock > 0) {
        rows.push({
          id: `sup-${ss.id}`,
          itemType: "SUPPLIES",
          typeLabel: "مستلزم تعبئة",
          productName: ss.supply.name,
          category: ss.supply.category || "مواد تعبئة",
          lotId: ss.supply.code,
          date: new Date(ss.updatedAt || station.createdAt).toLocaleDateString("ar-EG"),
          totalQty: stock,
          availableQty: stock,
          unit: ss.supply.unit || "قطعة",
          locationName: ss.location?.name || "مخزن المستلزمات",
          status: "متاح للاستخدام",
          unitCost: Number(ss.supply.unitPrice || 0),
        });
      }
    });

    return rows;
  }, [inventory, station]);

  // Filter & search
  const filteredRows = useMemo(() => {
    return unifiedRows.filter((r) => {
      if (filterType !== "ALL" && r.itemType !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        r.productName.toLowerCase().includes(q) ||
        r.lotId.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        (r.supplierName && r.supplierName.toLowerCase().includes(q))
      );
    });
  }, [unifiedRows, filterType, searchQuery]);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
      {/* Controls Bar: Filters, Search, Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filterType === "ALL"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            الكل ({unifiedRows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("RAW")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              filterType === "RAW"
                ? "bg-amber-100 text-amber-900 shadow-2xs font-bold"
                : "text-gray-600 hover:text-amber-800"
            }`}
          >
            <Box className="w-3.5 h-3.5" /> الخامات
          </button>
          <button
            type="button"
            onClick={() => setFilterType("FINISHED")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              filterType === "FINISHED"
                ? "bg-emerald-100 text-emerald-900 shadow-2xs font-bold"
                : "text-gray-600 hover:text-emerald-800"
            }`}
          >
            <Package className="w-3.5 h-3.5" /> المنتج التام
          </button>
          <button
            type="button"
            onClick={() => setFilterType("SUPPLIES")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              filterType === "SUPPLIES"
                ? "bg-cyan-100 text-cyan-900 shadow-2xs font-bold"
                : "text-gray-600 hover:text-cyan-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> المستلزمات
          </button>
        </div>

        {/* Search & Adjustment Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
            <Input
              type="text"
              placeholder="بحث بالصنف أو رقم اللوط..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-9 text-xs"
            />
          </div>

          <Button
            type="button"
            onClick={onOpenAdjustment}
            className="bg-[#012d1d] hover:bg-[#02472e] text-white text-xs font-bold gap-1.5 h-9"
          >
            <Scale className="w-4 h-4" /> تسوية وجرد
          </Button>
        </div>
      </div>

      {/* Unified Inventory Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
              <tr>
                <th className="p-3">الصنف / المحصول</th>
                <th className="p-3">النوع</th>
                <th className="p-3">رقم اللوط / الباتش</th>
                <th className="p-3">المخزن التابع</th>
                <th className="p-3">تاريخ الوارد / الإنتاج</th>
                <th className="p-3">الرصيد الكلي</th>
                <th className="p-3">الرصيد المتاح (Available)</th>
                <th className="p-3">تكلفة الوحدة</th>
                <th className="p-3">الحالة والجودة</th>
                <th className="p-3 text-center">تتبع المسار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400 font-sans">
                    لا توجد أصناف مطابقة لبحثك في مخازن هذه المحطة.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Product Name */}
                    <td className="p-3 font-sans font-bold text-gray-900">
                      <div>{row.productName}</div>
                      {row.supplierName && (
                        <span className="text-[10px] text-gray-500 font-normal">المورد: {row.supplierName}</span>
                      )}
                    </td>

                    {/* Type Badge */}
                    <td className="p-3 font-sans">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          row.itemType === "RAW"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : row.itemType === "FINISHED"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            : "bg-cyan-100 text-cyan-900 border border-cyan-200"
                        }`}
                      >
                        {row.typeLabel}
                      </span>
                    </td>

                    {/* Lot ID */}
                    <td className="p-3 font-bold text-gray-900">
                      <span>{row.lotId}</span>
                    </td>

                    {/* Location Name */}
                    <td className="p-3 font-sans text-gray-600">
                      <span className="flex items-center gap-1">
                        <Warehouse className="w-3 h-3 text-gray-400" />
                        {row.locationName}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="p-3 font-sans text-gray-500 text-[11px]">
                      {row.date}
                    </td>

                    {/* Total Qty */}
                    <td className="p-3 font-bold text-gray-600">
                      {row.totalQty.toLocaleString()} <span className="text-[10px] font-sans">{row.unit}</span>
                    </td>

                    {/* Available Qty */}
                    <td className="p-3 font-extrabold text-[#012d1d]">
                      {row.availableQty.toLocaleString()} <span className="text-[10px] font-sans">{row.unit}</span>
                    </td>

                    {/* Unit Cost */}
                    <td className="p-3 text-gray-700">
                      {row.unitCost.toFixed(2)} <span className="text-[10px] font-sans text-gray-400">ج.م</span>
                    </td>

                    {/* Status */}
                    <td className="p-3 font-sans">
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                        {row.status}
                      </span>
                    </td>

                    {/* Trace Action */}
                    <td className="p-3 text-center">
                      {row.itemType !== "SUPPLIES" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectLotForTrace(row.lotId)}
                          className="h-7 px-2 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border-indigo-200 gap-1 font-sans"
                        >
                          <GitBranch className="w-3 h-3" />
                          تتبع
                        </Button>
                      ) : (
                        <span className="text-gray-300 text-[10px] font-sans">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
