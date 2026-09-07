"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Filter, Trash2, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteSupply } from "@/actions/supplies";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";

interface StationSupplyRecord {
  id: string;
  stock: any;
  location?: {
    name: string;
    station?: {
      id: string;
      name: string;
    };
  };
}

interface SupplyItem {
  id: string;
  code: string;
  name: string;
  category: string;
  capacityKg: any;
  unit: string;
  stock: any;
  unitPrice: any;
  stationSupplies?: StationSupplyRecord[];
}

interface SupplyTableProps {
  supplies: SupplyItem[];
}

const CATEGORIES = ["الكل", "كرتونة", "أكياس", "بالتات", "لاصق", "تغليف"];

export function SupplyTable({ supplies }: SupplyTableProps) {
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت تأكد من حذف المستلزم ${name}؟`)) {
      startTransition(async () => {
        const res = await deleteSupply(id);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.error);
        }
      });
    }
  };

  const filteredSupplies =
    selectedCategory === "الكل"
      ? supplies
      : supplies.filter((s) => s.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 ml-2">
          <Filter className="h-3.5 w-3.5" /> تصفية بالفئة:
        </span>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            type="button"
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className={
              selectedCategory === cat
                ? "bg-[#012d1d] text-white hover:bg-[#02472e]"
                : "text-gray-700 hover:bg-gray-100"
            }
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Supplies Data Table */}
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-700 border-b font-semibold">
                <tr>
                  <th className="py-3.5 px-4">كود المستلزم</th>
                  <th className="py-3.5 px-4">اسم المستلزم</th>
                  <th className="py-3.5 px-4">الفئة</th>
                  <th className="py-3.5 px-4">توزيع الأرصدة بالوحدات (Stations)</th>
                  <th className="py-3.5 px-4">إجمالي الرصيد</th>
                  <th className="py-3.5 px-4">سعر الوحدة</th>
                  <th className="py-3.5 px-4">إجمالي قيمة التقييم</th>
                  <th className="py-3.5 px-4 text-center">حالة المخزون</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSupplies.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500">
                      لا توجد مستلزمات مسجلة ضمن هذه الفئة
                    </td>
                  </tr>
                ) : (
                  filteredSupplies.map((item) => {
                    const stationBalances = item.stationSupplies || [];
                    const calculatedStock = stationBalances.reduce(
                      (acc, ss) => acc + Number(ss.stock || 0),
                      0
                    );

                    const displayStock =
                      stationBalances.length > 0 ? calculatedStock : Number(item.stock || 0);

                    const priceNum = Number(item.unitPrice || 0);
                    const totalValuation = displayStock * priceNum;
                    const isLowStock = displayStock < 100;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isLowStock ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-800">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-800 border-emerald-200"
                          >
                            {item.category}
                          </Badge>
                        </td>

                        {/* Station Specific Breakdown */}
                        <td className="py-3.5 px-4">
                          {stationBalances.length === 0 ? (
                            <span className="text-xs text-gray-400">غير موزع</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {stationBalances.map((ss) => (
                                <Badge
                                  key={ss.id}
                                  variant="secondary"
                                  className="bg-cyan-50 text-cyan-900 border border-cyan-200 text-[11px] font-mono gap-1"
                                >
                                  <Building2 className="h-3 w-3 text-cyan-700" />
                                  <span>{ss.location?.station?.name || 'محطة'}:</span>
                                  <strong>{Number(ss.stock).toLocaleString()}</strong>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {displayStock.toLocaleString()} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-700">
                          {formatCurrency(priceNum)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#012d1d]">
                          {formatCurrency(totalValuation)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isLowStock ? (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1 border-amber-300">
                              <AlertTriangle className="h-3 w-3" /> مخزون حرج (&lt;100)
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" /> رصيد كافٍ
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleDelete(item.id, item.name)}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
