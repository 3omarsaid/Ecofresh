import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

interface AgingBucketsCardProps {
  bucket0to30: number;
  bucket31to60: number;
  bucket60plus: number;
  totalArOutstanding: number;
}

export function AgingBucketsCard({
  bucket0to30,
  bucket31to60,
  bucket60plus,
  totalArOutstanding,
}: AgingBucketsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Outstanding Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                إجمالي مديونيات العملاء القائمة (AR)
              </p>
              <h3 className="text-2xl font-bold text-primary mt-1 font-mono">
                {totalArOutstanding.toLocaleString("ar-EG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ج.م
              </h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 0 - 30 Days Bucket */}
      <Card className="bg-card border-border border-r-4 border-r-emerald-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                من 0 إلى 30 يوماً (حديثة)
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {bucket0to30.toLocaleString("ar-EG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ج.م
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totalArOutstanding > 0
                  ? `${((bucket0to30 / totalArOutstanding) * 100).toFixed(1)}% من الإجمالي`
                  : "0%"}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 31 - 60 Days Bucket */}
      <Card className="bg-card border-border border-r-4 border-r-amber-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                من 31 إلى 60 يوماً (متوسطة)
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                {bucket31to60.toLocaleString("ar-EG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ج.م
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totalArOutstanding > 0
                  ? `${((bucket31to60 / totalArOutstanding) * 100).toFixed(1)}% من الإجمالي`
                  : "0%"}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Over 60 Days Bucket */}
      <Card className="bg-card border-border border-r-4 border-r-rose-500">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                أكثر من 60 يوماً (متأخرة)
              </p>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                {bucket60plus.toLocaleString("ar-EG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ج.م
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                {totalArOutstanding > 0
                  ? `${((bucket60plus / totalArOutstanding) * 100).toFixed(1)}% من الإجمالي`
                  : "0%"}
              </p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
