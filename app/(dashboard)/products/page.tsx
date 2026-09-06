import React from "react";
import Link from "next/link";
import { getProducts } from "@/actions/products";
import { ProductTable } from "@/components/modules/products/product-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, Percent, Scale } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();

  const totalProducts = products.length;
  const fruitProducts = products.filter((p) => p.category === 'فواكه مجمدة').length;
  const vegProducts = products.filter((p) => p.category === 'خضار مجمد').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">كتالوج المنتجات التصديرية</h1>
          <p className="text-sm text-gray-500 mt-1">
            دليل الأصناف التصديرية الزراعية المعتمدة للتجميد السريع (IQF)، وتثبيت نسب الهالك والتصافي المعيارية.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
  <Link href="/products/new">
            <Plus className="h-4 w-4" />
            إضافة صنف جديد
          </Link>
</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              إجمالي الأصناف المسجلة
            </CardTitle>
            <Package className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalProducts} أصناف</div>
            <p className="mt-1 text-xs text-gray-500">
              {fruitProducts} فواكه مجمدة / {vegProducts} خضار مجمد
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              فواكه مجمدة
            </CardTitle>
            <span className="text-lg">🍇</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{fruitProducts} أصناف</div>
            <p className="mt-1 text-xs text-gray-500">
              مثل الفراولة والمانجو
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              خضار مجمد
            </CardTitle>
            <span className="text-lg">🥦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{vegProducts} أصناف</div>
            <p className="mt-1 text-xs text-gray-500">
              مثل البامية والفرز المتخصص
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Table */}
      <ProductTable products={products} />
    </div>
  );
}
