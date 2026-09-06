"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ClipboardList, Loader2, ArrowRight, Calculator } from "lucide-react";
import Link from "next/link";

import { ClientOrderSchema, type ClientOrderFormValues } from "@/lib/validations/client-order";
import { addClientOrder } from "@/actions/client-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CustomerOption {
  id: string;
  code: string;
  name: string;
  country: string;
  destinationPort: string;
  currency: string;
  agreements: Array<{
    id: number;
    productId: string;
    targetPriceEur: any;
    packagingSpec: string;
    product: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

interface ClientOrderFormProps {
  customers: CustomerOption[];
}

export function ClientOrderForm({ customers }: ClientOrderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultCustomer = customers[0];
  const defaultAgreement = defaultCustomer?.agreements[0];

  const form = useForm<ClientOrderFormValues>({
    resolver: zodResolver(ClientOrderSchema),
    defaultValues: {
      customerId: defaultCustomer?.id || "",
      productName: defaultAgreement?.product.name || "فراولة مجمدة IQF",
      packagingSpec: defaultAgreement?.packagingSpec || "كرتونة تصدير 10 كجم",
      orderedQtyKg: 10000,
      unitPriceEur: Number(defaultAgreement?.targetPriceEur || 1.85),
      fxRate: 53.20,
      deliveryTerms: "FOB - ميناء الإسكندرية",
      destinationPort: defaultCustomer?.destinationPort || "ميناء روتردام",
      notes: "طلبية تصدير تعاقدية موسمية",
    },
  });

  const selectedCustomerId = form.watch("customerId");
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || defaultCustomer;

  const orderedQtyKg = form.watch("orderedQtyKg") || 0;
  const unitPriceEur = form.watch("unitPriceEur") || 0;
  const fxRate = form.watch("fxRate") || 53.20;

  const totalValueEur = orderedQtyKg * unitPriceEur;
  const totalValueEgp = totalValueEur * fxRate;

  // Auto-fill details when customer changes
  const handleCustomerChange = (cust: CustomerOption) => {
    form.setValue("destinationPort", cust.destinationPort);
    if (cust.agreements && cust.agreements.length > 0) {
      const firstAgr = cust.agreements[0];
      form.setValue("productName", firstAgr.product.name);
      form.setValue("packagingSpec", firstAgr.packagingSpec);
      form.setValue("unitPriceEur", Number(firstAgr.targetPriceEur));
    }
  };

  async function onSubmit(values: ClientOrderFormValues) {
    setIsSubmitting(true);
    try {
      const res = await addClientOrder(values);
      if (res.success) {
        toast.success(res.message);
        router.push("/client-orders");
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
      toast.error("حدث خطأ غير متوقع أثناء تسجيل طلبية التصدير");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Live Financial Value Banner */}
      <Card className="bg-gradient-to-r from-[#012d1d] to-emerald-900 text-white shadow-md border-none">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <span className="text-xs text-emerald-200 block font-semibold">إجمالي قيمة الطلبية بالعملة الأجنبية</span>
            <span className="text-3xl font-bold text-amber-300 mt-1 block">
              {totalValueEur.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {selectedCustomer?.currency || "EUR"}
            </span>
            <span className="text-xs text-emerald-300 mt-1 block">
              طلب {orderedQtyKg.toLocaleString()} كجم بسعر {unitPriceEur.toFixed(3)} {selectedCustomer?.currency || "EUR"}/كجم
            </span>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 md:border-r border-emerald-700/50 pt-3 md:pt-0 md:pr-6">
            <div className="text-right">
              <span className="text-xs text-emerald-200 block font-semibold">القيمة التقديرية بالجنيه (EGP)</span>
              <span className="text-2xl font-bold text-cyan-300 mt-1 block">
                {totalValueEgp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
              </span>
              <span className="text-xs text-emerald-300">سعر الصرف المحسوب: {fxRate} ج.م</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
              <Calculator className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#012d1d] text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">تسجيل طلبية تصدير جديدة (Export Order)</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                تسجيل طلبية العميل ورصد كميات الإيفاء والمواصفات التعاقدية
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Select */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">عميل التصدير *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const cust = customers.find((c) => c.id === e.target.value);
                            if (cust) handleCustomerChange(cust);
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.country} — {c.destinationPort}) [{c.currency}]
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Agreement Preset Select */}
                {selectedCustomer?.agreements && selectedCustomer.agreements.length > 0 && (
                  <div className="md:col-span-2 p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      اختيار من الاتفاقيات السعرية المعتمدة للعميل:
                    </label>
                    <select
                      onChange={(e) => {
                        const agr = selectedCustomer.agreements.find((a) => a.id.toString() === e.target.value);
                        if (agr) {
                          form.setValue("productName", agr.product.name);
                          form.setValue("packagingSpec", agr.packagingSpec);
                          form.setValue("unitPriceEur", Number(agr.targetPriceEur));
                        }
                      }}
                      className="flex h-9 w-full rounded-md border border-emerald-300 bg-white px-3 py-1 text-xs"
                    >
                      {selectedCustomer.agreements.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.product.name} — بسعر {Number(a.targetPriceEur)} {selectedCustomer.currency} — ({a.packagingSpec})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="productName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">المنتج التصديري المطلوب *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: فراولة مجمدة IQF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Packaging Spec */}
                <FormField
                  control={form.control}
                  name="packagingSpec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">مواصفة التعبئة والتغليف *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: كرتونة تصدير 10 كجم" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ordered Quantity Kg */}
                <FormField
                  control={form.control}
                  name="orderedQtyKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">الكمية المطلوبة (كجم) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="500" placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Price EUR / Foreign Currency */}
                <FormField
                  control={form.control}
                  name="unitPriceEur"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">
                        سعر البيع للوحدة ({selectedCustomer?.currency || "EUR"}) *
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.05" placeholder="1.85" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* FX Rate */}
                <FormField
                  control={form.control}
                  name="fxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">سعر الصرف المعياري (ج.م) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="53.20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Destination Port */}
                <FormField
                  control={form.control}
                  name="destinationPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">ميناء الوصول النهائي *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: ميناء روتردام" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delivery Terms */}
                <FormField
                  control={form.control}
                  name="deliveryTerms"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="font-semibold text-gray-700">شروط التسليم الشحن (Incoterms)</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: FOB - ميناء الإسكندرية" {...field} />
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
                      <FormLabel className="font-semibold text-gray-700">ملاحظات وشروط خاصة بالطلبية</FormLabel>
                      <FormControl>
                        <Input placeholder="تعليمات الشحن والتلغيم أو مواصفات الجودة الخاصة" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button asChild type="button" variant="outline" className="gap-2">
  <Link href="/client-orders">
                    <ArrowRight className="h-4 w-4" /> إلغاء
                  </Link>
</Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 min-w-[170px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> جاري تسجيل الطلبية...
                    </>
                  ) : (
                    "تسجيل طلبية التصدير"
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
