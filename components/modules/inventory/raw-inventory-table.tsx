"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Truck,
  Phone,
  Search,
  Filter,
  Eye,
  Scale,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QcStatusBadge } from "./qc-status-badge";
import { Badge } from "@/components/ui/badge";

export interface RawBatchWithRelations {
  batchId: string;
  stationId: string;
  rawProduct: string;
  supplierId: string;
  grossQtyKg: any;
  tareQtyKg: any;
  initialQty: any;
  availableQty: any;
  unitPriceEgp: any;
  transportCostEgp: any;
  unitCost: any;
  totalPayableEgp: any;
  receivedDate: Date | string;
  qcStatus: string;
  brixDegree?: any;
  truckPlate?: string | null;
  driverName?: string | null;
  notes?: string | null;
  station: {
    id: string;
    name: string;
    location?: string;
  };
  supplier: {
    id: string;
    name: string;
    phone?: string | null;
  };
}

interface RawInventoryTableProps {
  lots: RawBatchWithRelations[];
}

export function RawInventoryTable({ lots }: RawInventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<string>("ALL");
  const [selectedQcStatus, setSelectedQcStatus] = useState<string>("ALL");

  // Extract unique stations & products for dropdown filters
  const stationsList = useMemo(() => {
    const map = new Map<string, string>();
    lots.forEach((lot) => {
      if (lot.station?.name) {
        map.set(lot.station.name, lot.station.name);
      }
    });
    return Array.from(map.values()).sort();
  }, [lots]);

  const productsList = useMemo(() => {
    const map = new Map<string, string>();
    lots.forEach((lot) => {
      if (lot.rawProduct) {
        map.set(lot.rawProduct, lot.rawProduct);
      }
    });
    return Array.from(map.values()).sort();
  }, [lots]);

  // Filtered lots calculation
  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        lot.batchId.toLowerCase().includes(searchLower) ||
        lot.rawProduct.toLowerCase().includes(searchLower) ||
        lot.station?.name.toLowerCase().includes(searchLower) ||
        lot.supplier?.name.toLowerCase().includes(searchLower) ||
        (lot.truckPlate && lot.truckPlate.toLowerCase().includes(searchLower)) ||
        (lot.driverName && lot.driverName.toLowerCase().includes(searchLower));

      // Station filter
      const matchesStation =
        selectedStation === "ALL" || lot.station?.name === selectedStation;

      // Product filter
      const matchesProduct =
        selectedProduct === "ALL" || lot.rawProduct === selectedProduct;

      // QC Status filter
      const matchesQc =
        selectedQcStatus === "ALL" ||
        lot.qcStatus?.toUpperCase() === selectedQcStatus;

      return matchesSearch && matchesStation && matchesProduct && matchesQc;
    });
  }, [lots, searchTerm, selectedStation, selectedProduct, selectedQcStatus]);

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <Card className="border-gray-200 shadow-sm p-4 bg-white">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث برقم اللوط، المحصول، المورد أو السيارة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 pl-3 text-sm"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Station Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
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
              <span className="font-semibold text-gray-600">المحصول:</span>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">كل المحاصيل</option>
                {productsList.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
            </div>

            {/* QC Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700">
              <span className="font-semibold text-gray-600">حالة الجودة:</span>
              <select
                value={selectedQcStatus}
                onChange={(e) => setSelectedQcStatus(e.target.value)}
                className="bg-transparent font-bold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">كل الحالات</option>
                <option value="APPROVED">مقبول APPROVED</option>
                <option value="REJECTED">مرفوض REJECTED</option>
                <option value="PENDING">قيد الفحص PENDING</option>
              </select>
            </div>

            {/* Reset Filters button if any filter is active */}
            {(selectedStation !== "ALL" ||
              selectedProduct !== "ALL" ||
              selectedQcStatus !== "ALL" ||
              searchTerm) && (
              <button
                onClick={() => {
                  setSelectedStation("ALL");
                  setSelectedProduct("ALL");
                  setSelectedQcStatus("ALL");
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
                  <th className="py-3.5 px-4">رقم اللوط</th>
                  <th className="py-3.5 px-4">المحطة الحاضنة</th>
                  <th className="py-3.5 px-4">المحصول الزراعي</th>
                  <th className="py-3.5 px-4">المورد / المزرعة</th>
                  <th className="py-3.5 px-4">الكمية المستلمة (كجم)</th>
                  <th className="py-3.5 px-4">الرصيد المتاح (كجم)</th>
                  <th className="py-3.5 px-4">تكلفة الكيلو الموزونة</th>
                  <th className="py-3.5 px-4 text-center">درجة البريكس</th>
                  <th className="py-3.5 px-4 text-center">حالة الجودة (QC)</th>
                  <th className="py-3.5 px-4">لوحة السيارة والناقل</th>
                  <th className="py-3.5 px-4 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLots.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500">
                      لا توجد لوطات خام تطابق الفلاتر المحددة حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredLots.map((lot) => {
                    const initialNet = Number(lot.initialQty || 0);
                    const available = Number(lot.availableQty || 0);
                    const unitCostNum = Number(lot.unitCost || 0);
                    const brixNum = lot.brixDegree != null ? Number(lot.brixDegree) : null;

                    return (
                      <tr key={lot.batchId} className="hover:bg-gray-50/80 transition-colors">
                        {/* 1. Batch ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-[#012d1d]">
                          <Link
                            href={`/inventory/raw/${lot.batchId}`}
                            className="hover:underline flex items-center gap-1 text-[#012d1d]"
                          >
                            <Scale className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                            {lot.batchId}
                          </Link>
                        </td>

                        {/* 2. Station */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-800 flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                            {lot.station?.name}
                          </span>
                        </td>

                        {/* 3. Crop / Product */}
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-200">
                            {lot.rawProduct}
                          </Badge>
                        </td>

                        {/* 4. Supplier / Farm */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 flex items-center gap-1">
                              <Truck className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                              {lot.supplier?.name}
                            </span>
                            {lot.supplier?.phone && (
                              <span className="text-xs text-gray-500 font-mono dir-ltr flex items-center gap-1">
                                <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                {lot.supplier.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 5. Initial Net Qty */}
                        <td className="py-3.5 px-4 font-semibold text-gray-700">
                          {initialNet.toLocaleString()} كجم
                        </td>

                        {/* 6. Current Available Qty */}
                        <td className="py-3.5 px-4 font-bold text-[#012d1d] text-base">
                          <span className={available === 0 ? "text-rose-600" : "text-emerald-800"}>
                            {available.toLocaleString()} كجم
                          </span>
                        </td>

                        {/* 7. Weighted Unit Cost */}
                        <td className="py-3.5 px-4 font-bold text-cyan-900">
                          {unitCostNum.toFixed(2)} ج.م / كجم
                        </td>

                        {/* 8. Brix Degree */}
                        <td className="py-3.5 px-4 text-center">
                          {brixNum !== null ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                              <Sparkles className="h-3 w-3 text-amber-600" />
                              {brixNum}° Brix
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>

                        {/* 9. QC Status */}
                        <td className="py-3.5 px-4 text-center">
                          <QcStatusBadge status={lot.qcStatus} />
                        </td>

                        {/* 10. Truck Plate */}
                        <td className="py-3.5 px-4">
                          {lot.truckPlate ? (
                            <div className="flex flex-col text-xs text-gray-700">
                              <span className="font-mono font-bold text-gray-800">
                                🚗 {lot.truckPlate}
                              </span>
                              {lot.driverName && (
                                <span className="text-gray-500">السائق: {lot.driverName}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>

                        {/* Action Details Link */}
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/inventory/raw/${lot.batchId}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-cyan-800 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> بطاقة اللوط
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
