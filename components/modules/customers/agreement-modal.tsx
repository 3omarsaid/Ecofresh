"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileText, Loader2, Plus } from "lucide-react";

import { AgreementSchema, type AgreementFormValues } from "@/lib/validations/customer";
import { addCustomerAgreement } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProductOption {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface AgreementModalProps {
  customerId: string;
  customerName: string;
  currency: string;
  products: ProductOption[];
}

export function AgreementModal({
  customerId,
  customerName,
  currency,
  products,
}: AgreementModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<AgreementFormValues>({
    resolver: zodResolver(AgreementSchema),
    defaultValues: {
      productId: "",
      targetPriceEur: 1.85,
      packagingSpec: "كرتونة 10 كجم تصدير",
    },
  });

  async function onSubmit(values: AgreementFormValues) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("productId", values.productId);
      formData.append("targetPriceEur", values.targetPriceEur.toString());
      formData.append("packagingSpec", values.packagingSpec);

      const res = await addCustomerAgreement(customerId, formData);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        if (res.error) {
          toast.error(res.error);
        }
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع أثناء حفظ اتفاقية السعر");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-semibold shadow-sm">
          <Plus className="h-4 w-4" /> إضافة اتفاقية سعر صنف
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md text-right" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <FileText className="h-5 w-5 text-emerald-700" /> إضافة اتفاقية أسعار تعاقدية
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            ربط صنف تصديري بسعر الكيلو التقديري المتعاقد عليه مع {customerName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* Product Select */}
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-gray-700">الصنف التصديري *</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">اختر الصنف التصديري...</option>
                      {products.map((prd) => (
                        <option key={prd.id} value={prd.id}>
                          {prd.name} ({prd.code})
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Price */}
            <FormField
              control={form.control}
              name="targetPriceEur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-gray-700">
                    السعر التعاقدي للكيلو ({currency}) *
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="1.85" {...field} />
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
                  <FormLabel className="font-semibold text-gray-700">مواصفات التعبئة *</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: كرتونة تصدير 10 كجم مع كيس داخلي" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...
                  </>
                ) : (
                  "حفظ الاتفاقية"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
