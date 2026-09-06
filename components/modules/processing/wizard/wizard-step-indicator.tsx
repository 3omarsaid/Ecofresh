import React from "react";

interface WizardStepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { number: 1, title: "البيانات العامة", description: "المحطة، المقاول والأصناف" },
  { number: 2, title: "سحب اللوطات", description: "اختيار الخام المتاح بالمخزن" },
  { number: 3, title: "استهلاك المستلزمات", description: "الكراتين والأكياس وهالك التعبئة" },
  { number: 4, title: "الناتج والمعاينة", description: "الإنتاج الفعلي والتكلفة والإقفال" },
];

export function WizardStepIndicator({ currentStep, onStepClick }: WizardStepIndicatorProps) {
  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div
              key={step.number}
              onClick={() => {
                if (step.number < currentStep && onStepClick) {
                  onStepClick(step.number);
                }
              }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                step.number < currentStep ? "cursor-pointer hover:bg-gray-50" : ""
              } ${
                isCurrent
                  ? "border-[#012d1d] bg-[#012d1d]/5 font-bold"
                  : isCompleted
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-gray-100 bg-gray-50/50 text-gray-400"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isCurrent
                    ? "bg-[#012d1d] text-white"
                    : isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {isCompleted ? "✓" : step.number}
              </div>
              <div className="min-w-0">
                <p
                  className={`text-xs font-bold leading-tight ${
                    isCurrent
                      ? "text-[#012d1d]"
                      : isCompleted
                      ? "text-emerald-900"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
