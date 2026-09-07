import * as React from "react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "@/components/ui/input";
import { CURRENCY_CONFIG } from "@/lib/currency";

export interface CurrencyInputProps extends InputProps {
  suffix?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, suffix = CURRENCY_CONFIG.symbol, type = "number", step = "0.01", ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Input
          type={type}
          step={step}
          className={cn("pl-12 font-mono dir-ltr text-left", className)}
          ref={ref}
          {...props}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none select-none font-sans">
          {suffix}
        </span>
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
