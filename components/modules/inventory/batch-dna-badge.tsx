import { Dna } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SupplierShare {
  supplierName: string;
  sharePct: number;
}

interface BatchDnaBadgeProps {
  suppliersSummary?: any;
  className?: string;
}

export function BatchDnaBadge({ suppliersSummary, className }: BatchDnaBadgeProps) {
  let items: SupplierShare[] = [];

  if (Array.isArray(suppliersSummary)) {
    items = suppliersSummary;
  } else if (typeof suppliersSummary === "string") {
    try {
      items = JSON.parse(suppliersSummary);
    } catch {
      items = [];
    }
  }

  if (!items || items.length === 0) {
    return (
      <Badge
        variant="outline"
        className={cn("bg-gray-50 text-gray-600 border-gray-200 gap-1 text-xs font-medium", className)}
      >
        <Dna className="h-3 w-3 text-gray-400" />
        مورد غير معروف
      </Badge>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5 items-center", className)}>
      <Dna className="h-3.5 w-3.5 text-purple-600 shrink-0" />
      {items.map((item, idx) => (
        <Badge
          key={idx}
          className="bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100 font-medium text-xs py-0.5 px-2"
        >
          {item.supplierName}: <span className="font-bold mr-1">{Number(item.sharePct).toFixed(1)}%</span>
        </Badge>
      ))}
    </div>
  );
}
