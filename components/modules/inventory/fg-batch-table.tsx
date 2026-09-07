"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Package,
  Search,
  Filter,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BatchDnaBadge } from "./batch-dna-badge";
import { formatCurrency } from "@/lib/currency";

export interface FgBatchWithRelations {
  fgBatchId: string;
  sourceType: string;
  sourceOpId?: string | null;
  dealRef?: string | null;
  stationId: string;
  productName: string;
  productionDate: Date | string;
  expiryDate?: Date | string | null;
  initialQty: any;
  availableQty: any;
  costPerKg: any;
  totalValue: any;
  qualityStatus?: string;
  rawSources?: any;
  suppliersSummary?: any;
  createdAt?: Date | string;
  station: {
    id: string;
    name: string;
    location?: string;
  };
}

interface FgBatchTableProps {
  batches: FgBatchWithRelations[];
}

export function FgBatchTable({ batches }: FgBatchTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSourceType, setSelectedSourceType] = useState<string>("ALL");
  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<string>("ALL");

  // Extract unique stations & products for dropdown filters
  const stationsList = useMemo(() => {
    const map = new Map<string, string>();
    batches.forEach((b) => {
      if (b.station?.name) {
        map.set(b.station.name, b.station.name);
      }
    });
    return Array.from(map.values()).sort();
  }, [batches]);

  const productsList = useMemo(() => {
    const map = new Map<string, string>();
    batches.forEach((b) => {
      if (b.productName) {
        map.set(b.productName, b.productName);
      }
    });
    return Array.from(map.values()).sort();
  }, [batches]);

  // Filtered batches calculation
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        b.fgBatchId.toLowerCase().includes(searchLower) ||
        b.productName.toLowerCase().includes(searchLower) ||
        b.station?.name.toLowerCase().includes(searchLower) ||
        (b.dealRef && b.dealRef.toLowerCase().includes(searchLower)) ||
        (b.sourceOpId && b.sourceOpId.toLowerCase().includes(searchLower));

      const matchesSource =
        selectedSourceType === "ALL" || b.sourceType === selectedSourceType;

      const matchesStation =
        selectedStation === "ALL" || b.station?.name === selectedStation;

      const matchesProduct =
        selectedProduct === "ALL" || b.productName === selectedProduct;

      return matchesSearch && matchesSource && matchesStation && matchesProduct;
    });
  }, [batches, searchTerm, selectedSourceType, selectedStation, selectedProduct]);

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <Card className="border-gray-200 shadow-sm p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث برقم الباتش، المنتج، المحطة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-3 text-sm"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Source Type Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <span className="font-semibold text-gray-600">نوع المصدر:</span>
              <select
                value={selectedSourceType}
                onChange={(e) => setSelectedSourceType(e.target.value)}
                className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">كل المصادر</option>
                <option value="MANUFACTURED">إنتاج محلي</option>
                <option value="DIRECT_PURCHASE">صفقة مباشرة</option>
              </select>
            </div>

            {/* Station Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700">
              <span className="font-semibold text-gray-600">المحطة:</span>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">كل المحطات</option>
                {stationsList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700">
              <span className="font-semibold text-gray-600">الصنف:</span>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">كل الأصناف</option>
                {productsList.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters button if any filter is active */}
            {(selectedSourceType !== "ALL" ||
              selectedStation !== "ALL" ||
              selectedProduct !== "ALL" ||
              searchTerm) && (
              <button
                onClick={() => {
                  setSelectedSourceType("ALL");
                  setSelectedStation("ALL");
                  setSelectedProduct("ALL");
                  setSearchTerm("");
                }}
                className="text-xs text-rose-600 hover:underline px-2 py-1 font-semibold"
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-700 border-b font-semibold">
                <tr>
                  <th className="py-3.5 px-4">كود الباتش</th>
                  <th className="py-3.5 px-4 text-center">نوع المصدر</th>
                  <th className="py-3.5 px-4">المحطة والموقع</th>
                  <th className="py-3.5 px-4">الصنف التصديري</th>
                  <th className="py-3.5 px-4">تاريخ الإنتاج والصلاحية</th>
                  <th className="py-3.5 px-4">الرصيد المتاح (كجم)</th>
                  <th className="py-3.5 px-4">تكلفة الكيلو الموزونة</th>
                  <th className="py-3.5 px-4">إجمالي قيمة الباتش</th>
                  <th className="py-3.5 px-4">شجرة الموردين (DNA)</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-500">
                      لا توجد باتشات جاهزة تطابق الفلاتر المحددة حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => {
                    const available = Number(batch.availableQty || 0);
                    const costPerKgNum = Number(batch.costPerKg || 0);
                    const totalValNum = Number(batch.totalValue || available * costPerKgNum);

                    const prodDate = batch.productionDate
                      ? new Date(batch.productionDate).toISOString().split("T")[0]
                      : "-";
                    const expDate = batch.expiryDate
                      ? new Date(batch.expiryDate).toISOString().split("T")[0]
                      : null;

                    const isManufactured = batch.sourceType === "MANUFACTURED";

                    return (
                      <tr key={batch.fgBatchId} className="hover:bg-gray-50/80 transition-colors">
                        {/* 1. Batch Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[#012d1d]">
                          <Link
                            href={`/inventory/${batch.fgBatchId}`}
                            className="hover:underline flex items-center gap-1.5 text-[#012d1d]"
                          >
                            <Package className="h-4 w-4 text-emerald-700 shrink-0" />
                            {batch.fgBatchId}
                          </Link>
                        </td>

                        {/* 2. Source Type */}
                        <td className="py-3.5 px-4 text-center">
                          {isManufactured ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 gap-1 font-bold">
                              <Layers className="h-3 w-3 text-emerald-600" />
                              إنتاج محلي
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100 gap-1 font-bold">
                              <ShoppingBag className="h-3 w-3 text-blue-600" />
                              صفقة مباشرة
                            </Badge>
                          )}
                        </td>

                        {/* 3. Station & Location */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                              {batch.station?.name}
                            </span>
                            {batch.station?.location && (
                              <span className="text-xs text-gray-500">
                                {batch.station.location}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Export Product */}
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-200">
                            {batch.productName}
                          </Badge>
                        </td>

                        {/* 5. Production & Expiry Date */}
                        <td className="py-3.5 px-4 text-xs font-mono text-gray-700">
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1 text-gray-800 font-semibold">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {prodDate}
                            </span>
                            {expDate && (
                              <span className="text-gray-500">
                                انتهاء: {expDate}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 6. Available Balance (Kg) */}
                        <td className="py-3.5 px-4 font-bold text-[#012d1d] text-base">
                          <span className={available === 0 ? "text-rose-600" : "text-emerald-800"}>
                            {available.toLocaleString()} كجم
                          </span>
                        </td>

                        {/* 7. Weighted Unit Cost */}
                        <td className="py-3.5 px-4 font-bold text-cyan-900">
                          {formatCurrency(costPerKgNum)} / كجم
                        </td>

                        {/* 8. Total Batch Value */}
                        <td className="py-3.5 px-4 font-bold text-[#0054cd]">
                          {formatCurrency(totalValNum)}
                        </td>

                        {/* 9. DNA Supplier Tree */}
                        <td className="py-3.5 px-4">
                          <BatchDnaBadge suppliersSummary={batch.suppliersSummary} />
                        </td>

                        {/* 10. Action Link */}
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/inventory/${batch.fgBatchId}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-800 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> التفاصيل
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
