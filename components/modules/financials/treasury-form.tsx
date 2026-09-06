"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Landmark, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

import { TreasuryAccountSchema, type TreasuryAccountInput } from "@/lib/validations/treasury";
import { createTreasuryAccount } from "@/actions/treasury";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface StationOption {
  id: string;
  name: string;
}

interface TreasuryFormProps {
  stations?: StationOption[];
}

export function TreasuryForm({ stations = [] }: TreasuryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TreasuryAccountInput>({
    resolver: zodResolver(TreasuryAccountSchema),
    defaultValues: {
      id: "ACC-05",
      name: "",
      bankName: "",
      accountNumber: "",
      currency: "EGP",
      balance: 0,
      type: "حساب بنكي جاري",
      stationId: "",
    },
  });

  const watchType = form.watch("type");

  async function onSubmit(values: TreasuryAccountInput) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, val.toString());
        }
      });

      const res = await createTreasuryAccount(formData);
      if (res.success) {
        toast.success(res.message);
        router.push("/financials/treasury");
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
      toast.error("حدث خطأ غير متوقع أثناء إضافة الحساب المالي");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-sm border-gray-200">
      <CardHeader className="bg-gradient-to-r from-emerald-900 to-[#012d1d] text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white">إضافة حساب بنكي / خزينة جديد</CardTitle>
            <CardDescription className="text-emerald-100 text-xs mt-1">
              أدخل بيانات الحساب البنكي أو الخزينة النقدية والرصيد الافتتاحي بالعملة المحددة
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account ID */}
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">كود الحساب *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: ACC-05" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">نوع الحساب *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="حساب بنكي جاري">حساب بنكي جاري</option>
                        <option value="خزينة نقدية">خزينة نقدية</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-semibold text-gray-700">اسم الحساب أو الخزينة *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: بنك QNB الجاري / الخزينة الرئيسية" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bank Name (If Bank) */}
              {watchType === "حساب بنكي جاري" && (
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">اسم البنك</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: بنك QNB الأهلي" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Account Number (If Bank) */}
              {watchType === "حساب بنكي جاري" && (
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">رقم الحساب البنكي</FormLabel>
                      <FormControl>
                        <Input placeholder="100200300400" dir="ltr" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">عملة الحساب *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="EGP">EGP - جنيه مصري</option>
                        <option value="EUR">EUR - يورو</option>
                        <option value="USD">USD - دولار أمريكي</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Initial Balance */}
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-gray-700">الرصيد الافتتاحي *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Station Link */}
              <FormField
                control={form.control}
                name="stationId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-semibold text-gray-700">المحطة المرتبطة (اختياري)</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value ?? ""}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">بدون محطة (حساب رئيسي)</option>
                        {stations.map((stn) => (
                          <option key={stn.id} value={stn.id}>
                            {stn.name} ({stn.id})
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button asChild type="button" variant="outline" className="gap-2">
  <Link href="/financials/treasury">
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
                  "حفظ الحساب"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
