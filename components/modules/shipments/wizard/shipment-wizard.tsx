"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientOrder, Customer, FinishedGoodsBatch, Station } from "@prisma/client";
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Ship, Receipt, Package, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Step1OrderPicker } from "./step-1-order-picker";
import { Step2BatchAllocation, AllocatedBatchItem } from "./step-2-batch-allocation";
import { Step3LogisticsCosts } from "./step-3-logistics-costs";
import { ShipmentSchema, ShipmentFormValues } from "@/lib/validations/shipment";
import { createShipment } from "@/actions/shipments";
import { toast } from "sonner";

type ExtendedClientOrder = ClientOrder & {
  customer: Customer;
};

type ExtendedFinishedGoodsBatch = FinishedGoodsBatch & {
  station: Station;
};

interface ShipmentWizardProps {
  clientOrders: ExtendedClientOrder[];
  finishedGoodsBatches: ExtendedFinishedGoodsBatch[];
}

export function ShipmentWizard({
  clientOrders,
  finishedGoodsBatches,
}: ShipmentWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<ShipmentFormValues>({
    orderId: clientOrders.length > 0 ? clientOrders[0].orderId : "",
    dispatchDate: new Date().toISOString().substring(0, 10),
    containerNo: "",
    sealNo: "",
    shippingLine: "",
    bookingNo: "",
    allocatedBatches: [],
    costs: {
      inlandTrucking: 0,
      oceanFreight: 0,
      customsClearance: 0,
      inspectionCertificates: 0,
      portTerminalCharges: 0,
    },
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [stepError, setStepError] = useState<string | null>(null);

  const selectedOrder = clientOrders.find((o) => o.orderId === formData.orderId);

  // Step Validation Logic
  const validateCurrentStep = (step: number): boolean => {
    setStepError(null);
    setErrors({});

    if (step === 1) {
      if (!formData.orderId) {
        setStepError("يرجى اختيار طلبية التصدير للمتابعة");
        setErrors({ orderId: ["يجب اختيار طلبية التصدير"] });
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (formData.allocatedBatches.length === 0) {
        setStepError("يجب تخصيص باتش واحد على الأقل من مخزن الجاهز");
        setErrors({ allocatedBatches: ["يجب تخصيص باتش واحد على الأقل"] });
        return false;
      }

      const unfulfilledQty = selectedOrder ? Number(selectedOrder.unfulfilledQtyKg) : 0;
      const totalAllocated = formData.allocatedBatches.reduce((sum, item) => sum + item.qty, 0);

      if (totalAllocated > unfulfilledQty) {
        setStepError(
          `إجمالي الكمية المخصصة (${totalAllocated.toLocaleString()} كجم) تتجاوز رصيد الطلبية المتبقي (${unfulfilledQty.toLocaleString()} كجم)`
        );
        return false;
      }

      for (const item of formData.allocatedBatches) {
        const batch = finishedGoodsBatches.find((b) => b.fgBatchId === item.fgBatchId);
        if (!batch) {
          setStepError(`الباتش (${item.fgBatchId}) غير موجود بمخزن المنتج التام`);
          return false;
        }
        if (
          selectedOrder &&
          batch.productName.trim().toLowerCase() !== selectedOrder.productName.trim().toLowerCase()
        ) {
          setStepError(
            `الباتش (${item.fgBatchId} - ${batch.productName}) لا يطابق منتج الطلبية المحدد (${selectedOrder.productName})`
          );
          return false;
        }
        const maxAvail = Number(batch.availableQty);
        if (item.qty > maxAvail) {
          setStepError(
            `الكمية المخصصة بالباتش (${item.fgBatchId}) تتجاوز رصيد المخزن المتاح (${maxAvail.toLocaleString()} كجم)`
          );
          return false;
        }
      }
      return true;
    }

    if (step === 3) {
      if (!formData.containerNo || formData.containerNo.trim().length < 4) {
        setStepError("رقم الحاوية المبردة مطلوب ويجب ألا يقل عن 4 أحرف");
        setErrors({ containerNo: ["رقم الحاوية مطلوب"] });
        return false;
      }
      if (!formData.sealNo || formData.sealNo.trim().length < 3) {
        setStepError("رقم الختم الجمركي مطلوب ويجب ألا يقل عن 3 أحرف");
        setErrors({ sealNo: ["رقم الختم الجمركي مطلوب"] });
        return false;
      }
      if (!formData.shippingLine || formData.shippingLine.trim().length < 2) {
        setStepError("اسم الخط الملاحي مطلوب");
        setErrors({ shippingLine: ["الخط الملاحي مطلوب"] });
        return false;
      }
      if (!formData.bookingNo || formData.bookingNo.trim().length < 3) {
        setStepError("رقم الحجز الملاحي مطلوب");
        setErrors({ bookingNo: ["رقم الحجز الملاحي مطلوب"] });
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep(3)) return;

    // Validate complete Zod schema
    const validated = ShipmentSchema.safeParse(formData);
    if (!validated.success) {
      setErrors(validated.error.flatten().fieldErrors);
      setStepError("يرجى مراجعة وتصحيح البيانات المدخلة قبل الاعتماد");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createShipment(formData);
      if (res.success) {
        toast.success(res.message || "تم اعتماد الشحنة بنجاح");
        router.push("/shipments");
      } else {
        setStepError(res.error || "حدث خطأ أثناء اعتماد الشحنة");
        if (res.errors) setErrors(res.errors);
      }
    } catch (err: any) {
      setStepError(err.message || "حدث خطأ أثناء اعتماد الشحنة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "1. اختيار الطلبية", icon: Receipt },
    { number: 2, title: "2. تخصيص الباتشات", icon: Ship },
    { number: 3, title: "3. بيانات الحاوية والمصروفات", icon: Calculator },
  ];

  return (
    <div className="space-y-6">
      {/* Step Indicator Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isDone = currentStep > step.number;

          return (
            <div
              key={step.number}
              onClick={() => {
                if (step.number < currentStep) setCurrentStep(step.number);
              }}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                isActive
                  ? "bg-[#012d1d] text-white border-[#012d1d] shadow-md"
                  : isDone
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 cursor-pointer hover:bg-emerald-100"
                  : "bg-white text-gray-400 border-gray-200"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                  isActive
                    ? "bg-white text-[#012d1d]"
                    : isDone
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {isDone ? "✓" : step.number}
              </div>
              <div>
                <strong className="text-xs block font-bold">{step.title}</strong>
                <span className="text-[11px] opacity-80 block">
                  {step.number === 1
                    ? "استدعاء العميل والتعاقد"
                    : step.number === 2
                    ? "سحب الباتشات من المخزن"
                    : "الحاوية والنولون والربحية"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* General Step Error Alert */}
      {stepError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Wizard Step Content */}
      <div>
        {currentStep === 1 && (
          <Step1OrderPicker
            clientOrders={clientOrders}
            selectedOrderId={formData.orderId}
            dispatchDate={formData.dispatchDate}
            notes={formData.notes}
            onOrderSelect={(orderId) =>
              setFormData((prev) => {
                if (prev.orderId === orderId) return prev;
                return {
                  ...prev,
                  orderId,
                  allocatedBatches: [], // Clear child allocations when order changes!
                };
              })
            }
            onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <Step2BatchAllocation
            selectedOrder={selectedOrder}
            availableBatches={finishedGoodsBatches}
            allocatedBatches={formData.allocatedBatches as AllocatedBatchItem[]}
            onChange={(allocatedBatches) =>
              setFormData((prev) => ({ ...prev, allocatedBatches }))
            }
            errors={errors}
          />
        )}

        {currentStep === 3 && (
          <Step3LogisticsCosts
            selectedOrder={selectedOrder}
            allocatedBatches={formData.allocatedBatches as AllocatedBatchItem[]}
            containerNo={formData.containerNo}
            sealNo={formData.sealNo}
            shippingLine={formData.shippingLine}
            bookingNo={formData.bookingNo}
            costs={
              formData.costs || {
                inlandTrucking: 6500,
                oceanFreight: 22000,
                customsClearance: 4500,
                inspectionCertificates: 2500,
                portTerminalCharges: 3500,
              }
            }
            notes={formData.notes}
            onChange={(fields) => setFormData((prev) => ({ ...prev, ...fields }))}
            errors={errors}
          />
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              className="gap-2 font-semibold text-xs text-gray-700"
            >
              <ArrowRight className="h-4 w-4" /> الخطوة السابقة
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/shipments")}
            className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
          >
            إلغاء
          </Button>

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-semibold text-xs shadow-sm"
            >
              التالي <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-semibold text-xs shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />{" "}
              {isSubmitting ? "جاري الاعتماد..." : "حفظ مسودة المعالج والمتابعة"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
