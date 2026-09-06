"use client";

import React, { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Percent, Scale, Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/products";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultUnit: string;
  standardWastePct: any;
  standardYieldPct: any;
  createdAt: Date;
}

interface ProductTableProps {
  products: ProductItem[];
}

export function ProductTable({ products }: ProductTableProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت تأكد من حذف المنتج ${name}؟`)) {
      startTransition(async () => {
        const res = await deleteProduct(id);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.error);
        }
      });
    }
  };

  if (products.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">لا يوجد منتجات مسجلة في الكتالوج</h3>
          <p className="text-sm text-gray-500 max-w-sm mt-1">
            قم بإضافة الأصناف التصديرية الزراعية المعتمدة وتحديد نسب الهالك والتصافي المعيارية لكل صنف.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">معرف الصنف</th>
              <th className="px-6 py-4">كود الصنف التصديري</th>
              <th className="px-6 py-4">اسم المنتج</th>
              <th className="px-6 py-4">التصنيف</th>
              <th className="px-6 py-4">الوحدة الافتراضية</th>
              <th className="px-6 py-4">نسبة الهالك المعيارية</th>
              <th className="px-6 py-4">نسبة التصافي المعيارية</th>
              <th className="px-6 py-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-gray-900">
                  {product.id}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                  {product.code}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                      <Package className="h-4 w-4" />
                    </div>
                    <span>{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {product.category === 'فواكه مجمدة' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      🍇 {product.category}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      🥦 {product.category}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono font-semibold text-gray-700">
                  {product.defaultUnit}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md text-xs">
                    <Percent className="h-3.5 w-3.5" />
                    {Number(product.standardWastePct).toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs">
                    <Scale className="h-3.5 w-3.5" />
                    {Number(product.standardYieldPct).toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(product.id, product.name)}
                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

