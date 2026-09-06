"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ShoppingBag, Loader2, ArrowRight, Calculator } from "lucide-react";
import Link from "next/link";

import { PackagingPurchaseSchema, type PackagingPurchaseFormValues } from "@/lib/validations/purchases";
import { addPackagingPurchase } from "@/actions/packaging-purchases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

interface SupplyOption {
  id: string;
  code: string;
  name: string;
  unit: string;
  unitPrice: any;
}

interface SupplierOption {
  id: string;
  code: string;
  name: string;
}

interface PackagingPurchaseFormProps {
  supplies: SupplyOption[];
  suppliers: SupplierOption[];
}

export function PackagingPurchaseForm({ supplies, suppliers }: PackagingPurchaseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultSupply = supplies[0];

  const form = useForm<PackagingPurchaseFormValues>({
    resolver: zodResolver(PackagingPurchaseSchema),
    defaultValues: {
      supplyId: defaultSupply?.id || "",
      supplierId: suppliers[0]?.id || "",
      qty: 1000,
      unitPrice: Number(defaultSupply?.unitPrice || 18.0),
      invoiceNo: "INV-CTN-001",
    },
  });

  const selectedSupplyId = form.watch("supplyId");
  const currentSupply = supplies.find((s) => s.id === selectedSupplyId) || defaultSupply;

  const qty = form.watch("qty") || 0;
  const unitPrice = form.watch("unitPrice") || 0;
  const totalCost = qty * unitPrice;

  async function onSubmit(values: PackagingPurchaseFormValues) {
    setIsSubmitting(true);
    try {
      const res = await addPackagingPurchase(values);
      if (res.success) {
        toast.success(res.message);
        router.push("/packaging-purchases");
        router.refresh();
      } else {
        if (res.errors) {
          Object.entries(res.errors).forEach(([key, errs]) => {
            if (errs && errs[0]) {
              form.setError(key as any, { message: errs[0] });
            }
          });
        }
        if (res.error) {
          toast.error(res.error);
        }
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع أثناء حفظ فاتورة المشتريات");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Live Total Cost Banner */}
      <Card className="bg-gradient-to-r from-[#012d1d] to-emerald-900 text-white shadow-md border-none">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-200 block font-semibold">إجمالي قيمة الفاتورة (EGP)</span>
            <span className="text-3xl font-bold text-amber-300 mt-1 block">
              {totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ج.م
            </span>
            <span className="text-xs text-emerald-300 mt-1 block">
              شراء {qty.toLocaleString()} {currentSupply?.unit || "وحدة"} بسعر {unitPrice.toFixed(2)} ج.م/وحدة
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
            <Calculator className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#012d1d] text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">فاتورة شراء مستلزمات وتعبئة</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                إضافة رصيد جديد للمستلزم في المخزن وتوليد قيد استحقاق للمورد
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supply Select */}
                <FormField
                  control={form.control}
                  name="supplyId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">مستلزم التعبئة المطلوب *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const sup = supplies.find((s) => s.id === e.target.value);
                            if (sup) {
                              form.setValue("unitPrice", Number(sup.unitPrice));
                            }
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {supplies.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Supplier Select */}
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">مورد المستلزمات *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {suppliers.map((sup) => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name} ({sup.code})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">
                        الكمية المشتراة ({currentSupply?.unit || "وحدة"}) *
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="10" placeholder="1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Price */}
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">سعر شراء الوحدة (ج.م) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="18.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Invoice No */}
                <FormField
                  control={form.control}
                  name="invoiceNo"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">رقم فاتورة الشراء</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: INV-CTN-2026-001" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button asChild type="button" variant="outline" className="gap-2">
  <Link href="/packaging-purchases">
                    <ArrowRight className="h-4 w-4" /> إلغاء
                  </Link>
</Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 min-w-[150px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> جاري قيد الشراء...
                    </>
                  ) : (
                    "قيد الشراء وزيادة المخزون"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
