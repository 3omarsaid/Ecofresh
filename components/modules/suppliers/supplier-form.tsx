"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Truck, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SupplierCategory } from "@prisma/client";

import { SupplierSchema, type SupplierFormValues } from "@/lib/validations/supplier";
import { createSupplier } from "@/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function SupplierForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: {
      name: "",
      type: SupplierCategory.RAW_AGRICULTURAL,
      mainProduct: "",
      phone: "",
      location: "",
      status: "معتمد",
    },
  });

  async function onSubmit(values: SupplierFormValues) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, val.toString());
        }
      });

      const res = await createSupplier(formData);
      if (res.success) {
        toast.success(res.message);
        router.push("/suppliers");
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
      toast.error("حدث خطأ غير متوقع أثناء تسجيل بيانات المورد");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-sm border-gray-200">
      <CardHeader className="bg-gradient-to-r from-emerald-900 to-[#012d1d] text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">تسجيل مورد جديد بالدليل</CardTitle>
            <CardDescription className="text-emerald-100 text-xs mt-1">
              أدخل بيانات المزارع أو مصانع التجهيز والكرتون ورقم التواصل والموقع الجغرافي (يتم التكويد تلقائياً)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-semibold text-gray-700">اسم المورد / الشركة / المزرعة *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: مزارع النيل الحديثة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">تصنيف المورد الرئيسي *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value={SupplierCategory.RAW_AGRICULTURAL}>مورد خام زراعي</option>
                        <option value={SupplierCategory.FINISHED_GOODS}>مورد بضاعة جاهزة</option>
                        <option value={SupplierCategory.PACKAGING}>مورد مستلزمات</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Main Product */}
              <FormField
                control={form.control}
                name="mainProduct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">المحصول / المنتج الرئيسي</FormLabel>
                    <FormControl>
                      <>
                        <Input
                          placeholder="مثال: فراولة / مانجو / كرتون"
                          list="crops-catalog-list"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                        <datalist id="crops-catalog-list">
                          <option value="فراولة" />
                          <option value="مانجو" />
                          <option value="جوافة" />
                          <option value="خرشوف" />
                          <option value="رمان" />
                          <option value="برتقال" />
                          <option value="بامية" />
                          <option value="كرتون تصدير" />
                          <option value="أكياس بولي إيثيلين" />
                        </datalist>
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">الموقع الجغرافي / المحافظة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: البحيرة - كفر الدوار" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">رقم الهاتف التواصل</FormLabel>
                    <FormControl>
                      <Input placeholder="01012345678" dir="ltr" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button asChild type="button" variant="outline" className="gap-2">
  <Link href="/suppliers">
                  <ArrowRight className="h-4 w-4" /> إلغاء
                </Link>
</Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...
                  </>
                ) : (
                  "حفظ المورد"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
