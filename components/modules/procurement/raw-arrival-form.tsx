"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Scale, Loader2, ArrowRight, Calculator, Truck, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { RawArrivalSchema, type RawArrivalFormValues } from "@/lib/validations/raw-arrival";
import { addRawMaterialArrival } from "@/actions/raw-batches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

interface SelectOption {
  id: string;
  name: string;
  location?: string;
  mainProduct?: string | null;
  code?: string;
}

interface RawArrivalFormProps {
  stations: SelectOption[];
  suppliers: SelectOption[];
}

export function RawArrivalForm({ stations, suppliers }: RawArrivalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RawArrivalFormValues>({
    resolver: zodResolver(RawArrivalSchema),
    defaultValues: {
      stationId: stations[0]?.id || "",
      supplierId: suppliers[0]?.id || "",
      rawProduct: "فراولة خام",
      grossQtyKg: 5200,
      tareQtyKg: 200,
      unitPriceEgp: 19.5,
      transportCostEgp: 1000,
      brixDegree: 8.5,
      truckPlate: "أ ب ج 1234",
      driverName: "عمرو أحمد",
      notes: "استلام تبريد أولي بالمحطة",
    },
  });

  // Watch fields for live calculations
  const gross = form.watch("grossQtyKg") || 0;
  const tare = form.watch("tareQtyKg") || 0;
  const price = form.watch("unitPriceEgp") || 0;
  const transport = form.watch("transportCostEgp") || 0;

  // Live Math Calculations
  const netQty = Math.max(0, gross - tare);
  const totalPayable = netQty > 0 ? netQty * price + transport : 0;
  const weightedUnitCost = netQty > 0 ? totalPayable / netQty : 0;

  async function onSubmit(values: RawArrivalFormValues) {
    setIsSubmitting(true);
    try {
      const res = await addRawMaterialArrival(values);
      if (res.success) {
        toast.success(res.message);
        router.push("/raw-purchases");
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
      toast.error("حدث خطأ غير متوقع أثناء تسجيل ميزان البسكول");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Live Calculation KPI Banner */}
      <Card className="bg-gradient-to-r from-[#012d1d] to-emerald-900 text-white shadow-md border-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 border-b border-emerald-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-lg text-white">الحسابات المباشرة لميزان البسكول</h3>
            </div>
            <Badge className="bg-cyan-900 text-cyan-200 border-cyan-700">تحديث لحظي</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
            <div className="bg-white/10 p-3.5 rounded-lg border border-white/10">
              <span className="text-xs text-emerald-200 block font-semibold">الوزن الصافي (كجم)</span>
              <span className="text-2xl font-bold text-white mt-1 block">
                {netQty.toLocaleString()} كجم
              </span>
              <span className="text-[11px] text-emerald-300 font-mono">
                ({gross.toLocaleString()} قائم - {tare.toLocaleString()} فارغ)
              </span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-lg border border-white/10">
              <span className="text-xs text-emerald-200 block font-semibold">إجمالي المستحق للمورد (ج.م)</span>
              <span className="text-2xl font-bold text-amber-300 mt-1 block">
                {totalPayable.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ج.م
              </span>
              <span className="text-[11px] text-amber-200 font-mono">
                شامل النولون ({transport.toLocaleString()} ج.م)
              </span>
            </div>

            <div className="bg-white/10 p-3.5 rounded-lg border border-white/10">
              <span className="text-xs text-emerald-200 block font-semibold">التكلفة الموزونة (ج.م/كجم)</span>
              <span className="text-2xl font-bold text-cyan-300 mt-1 block">
                {weightedUnitCost.toFixed(2)} ج.م / كجم
              </span>
              <span className="text-[11px] text-cyan-200 font-mono">
                (تكلفة الكيلو الحقيقية شاملة النولون)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Entry Form */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#012d1d] text-white">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">نموذج استلام سيارة بالميزان</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                تسجيل الأوزان القائمة والفارغة، تكلفة الكيلو والنولون، وبيانات الجودة وسائق السيارة
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Station Select */}
                <FormField
                  control={form.control}
                  name="stationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">المحطة المستلمة *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {stations.map((stn) => (
                            <option key={stn.id} value={stn.id}>
                              {stn.name} ({stn.location})
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
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">المورد / المزرعة *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {suppliers.map((sup) => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name} ({sup.mainProduct || sup.code})
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Raw Product Name */}
                <FormField
                  control={form.control}
                  name="rawProduct"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">اسم الخام الزراعي المورد *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: فراولة خام / مانجو خام" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gross Qty */}
                <FormField
                  control={form.control}
                  name="grossQtyKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">الوزن القائم للسيارة (كجم) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="10" placeholder="5200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tare Qty */}
                <FormField
                  control={form.control}
                  name="tareQtyKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">وزن السيارة فارغة (كجم) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="10" placeholder="200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Price */}
                <FormField
                  control={form.control}
                  name="unitPriceEgp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">سعر شراء الكيلو (ج.م) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="19.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Transport Cost */}
                <FormField
                  control={form.control}
                  name="transportCostEgp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">مصاريف النولون / النقل (ج.م)</FormLabel>
                      <FormControl>
                        <Input type="number" step="50" placeholder="1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Brix Degree */}
                <FormField
                  control={form.control}
                  name="brixDegree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">درجة السكر (Brix °) اختياري</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="8.5"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Truck Plate */}
                <FormField
                  control={form.control}
                  name="truckPlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">رقم لوحة السيارة</FormLabel>
                      <FormControl>
                        <Input placeholder="أ ب ج 1234" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Driver Name */}
                <FormField
                  control={form.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">اسم سائق السيارة</FormLabel>
                      <FormControl>
                        <Input placeholder="عمرو أحمد" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">ملاحظات الاستلام والفحص</FormLabel>
                      <FormControl>
                        <Input placeholder="ملاحظات الجودة أو حالة المحصول عند الوصول..." value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button asChild type="button" variant="outline" className="gap-2">
  <Link href="/raw-purchases">
                    <ArrowRight className="h-4 w-4" /> إلغاء
                  </Link>
</Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> جاري تسجيل اللوط...
                    </>
                  ) : (
                    "توليد اللوط وقيد الاستحقاق"
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
