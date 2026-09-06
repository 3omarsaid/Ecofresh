import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QcStatusBadgeProps {
  status: string;
  className?: string;
}

export function QcStatusBadge({ status, className }: QcStatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  if (normalized === "APPROVED") {
    return (
      <Badge
        className={cn(
          "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 gap-1.5 font-bold",
          className
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        مقبول (APPROVED)
      </Badge>
    );
  }

  if (normalized === "REJECTED") {
    return (
      <Badge
        className={cn(
          "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-100 gap-1.5 font-bold",
          className
        )}
      >
        <XCircle className="h-3.5 w-3.5 text-rose-600" />
        مرفوض (REJECTED)
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 gap-1.5 font-bold",
        className
      )}
    >
      <Clock className="h-3.5 w-3.5 text-amber-600" />
      قيد الفحص ({status || "PENDING"})
    </Badge>
  );
}
