"use client";

import { useState, useTransition } from "react";
import { SupplierCategory } from "@prisma/client";
import { Filter, MapPin, Phone, CheckCircle2, Truck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteSupplier } from "@/actions/suppliers";
import { toast } from "sonner";

interface SupplierItem {
  id: string;
  code: string;
  name: string;
  type: SupplierCategory;
  mainProduct?: string | null;
  phone?: string | null;
  location?: string | null;
  status: string;
}

interface SupplierTableProps {
  suppliers: SupplierItem[];
}

const CATEGORY_MAP: Record<SupplierCategory, { label: string; badgeStyle: string }> = {
  RAW_AGRICULTURAL: {
    label: "مورد خام زراعي",
    badgeStyle: "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-100",
  },
  FINISHED_GOODS: {
    label: "مورد بضاعة جاهزة",
    badgeStyle: "bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-100",
  },
  PACKAGING: {
    label: "مورد مستلزمات",
    badgeStyle: "bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-100",
  },
};

export function SupplierTable({ suppliers }: SupplierTableProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت تأكد من حذف المورد ${name}؟`)) {
      startTransition(async () => {
        const res = await deleteSupplier(id);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.error);
        }
      });
    }
  };

  const filteredSuppliers = suppliers.filter((item) => {
    if (selectedFilter === "ALL") return true;
    return item.type === selectedFilter;
  });

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 ml-2">
          <Filter className="h-3.5 w-3.5" /> تصفية بالمجموعات:
        </span>
        <Button
          type="button"
          variant={selectedFilter === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("ALL")}
          className={
            selectedFilter === "ALL"
              ? "bg-[#012d1d] text-white hover:bg-[#02472e]"
              : "text-gray-700 hover:bg-gray-100"
          }
        >
          الكل ({suppliers.length})
        </Button>
        <Button
          type="button"
          variant={selectedFilter === "RAW_AGRICULTURAL" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("RAW_AGRICULTURAL")}
          className={
            selectedFilter === "RAW_AGRICULTURAL"
              ? "bg-emerald-800 text-white hover:bg-emerald-900"
              : "text-emerald-800 hover:bg-emerald-50 border-emerald-200"
          }
        >
          موردو الخام فقط
        </Button>
        <Button
          type="button"
          variant={selectedFilter === "FINISHED_GOODS" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("FINISHED_GOODS")}
          className={
            selectedFilter === "FINISHED_GOODS"
              ? "bg-blue-800 text-white hover:bg-blue-900"
              : "text-blue-800 hover:bg-blue-50 border-blue-200"
          }
        >
          موردو البضاعة الجاهزة
        </Button>
        <Button
          type="button"
          variant={selectedFilter === "PACKAGING" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("PACKAGING")}
          className={
            selectedFilter === "PACKAGING"
              ? "bg-purple-800 text-white hover:bg-purple-900"
              : "text-purple-800 hover:bg-purple-50 border-purple-200"
          }
        >
          موردو المستلزمات
        </Button>
      </div>

      {/* Suppliers Data Table */}
      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-700 border-b font-semibold">
                <tr>
                  <th className="py-3.5 px-4">كود المورد</th>
                  <th className="py-3.5 px-4">اسم المورد / المزرعة</th>
                  <th className="py-3.5 px-4">التصنيف الرئيسي</th>
                  <th className="py-3.5 px-4">المحصول / المنتج الرئيسي</th>
                  <th className="py-3.5 px-4">المحافظة / الموقع</th>
                  <th className="py-3.5 px-4">هاتف التواصل</th>
                  <th className="py-3.5 px-4 text-center">الحالة الإدارية</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      لا يوجد موردون مسجلون ضمن هذا التصنيف
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((item) => {
                    const categoryInfo = CATEGORY_MAP[item.type] || {
                      label: item.type,
                      badgeStyle: "bg-gray-100 text-gray-800",
                    };

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-gray-900">
                          {item.code}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-800 flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-400 shrink-0" />
                          {item.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge className={categoryInfo.badgeStyle}>
                            {categoryInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 font-medium">
                          {item.mainProduct || "غير محدد"}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            {item.location || "غير محدد"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-700" dir="ltr">
                          {item.phone ? (
                            <span className="flex items-center gap-1 justify-end">
                              <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              {item.phone}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {item.status}
                          </Badge>
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

