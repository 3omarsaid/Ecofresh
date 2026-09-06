import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Scale, CreditCard } from "lucide-react";

interface PartySummaryCardsProps {
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
  partyType?: string;
}

export function PartySummaryCards({
  totalDebit,
  totalCredit,
  finalBalance,
  partyType = "",
}: PartySummaryCardsProps) {
  const isCustomer = partyType.includes("عميل");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {isCustomer ? "إجمالي الفواتير والمطلوب" : "إجمالي المدفوع للطرف"}
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {totalDebit.toLocaleString("ar-EG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ج.م
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isCustomer ? "إجمالي المبيعات والاستحقاقات" : "إجمالي السندات المنصرفة"}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {isCustomer ? "إجمالي المحصل من العميل" : "إجمالي المستحق للطرف"}
              </p>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {totalCredit.toLocaleString("ar-EG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ج.م
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isCustomer ? "إجمالي سندات التحصيل الواردة" : "إجمالي فواتير ومطالبات التوريد والتشغيل"}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                صافي الرصيد المتبقي (Net Balance)
              </p>
              <h3 className={`text-2xl font-bold mt-1 ${
                finalBalance > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : finalBalance < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-muted-foreground"
              }`}>
                {finalBalance.toLocaleString("ar-EG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ج.م
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isCustomer
                  ? finalBalance > 0
                    ? "متبقي مستحق التحصيل من العميل"
                    : finalBalance < 0
                    ? "رصيد دائن لصالح العميل (مدفوع مقدماً)"
                    : "الحساب خالص ومسدد بالكامل"
                  : finalBalance > 0
                  ? "متبقي مستحق السداد للطرف"
                  : finalBalance < 0
                  ? "رصيد مدين على الطرف (مدفوع زيادة)"
                  : "الحساب خالص ومسدد بالكامل"}
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <Scale className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

