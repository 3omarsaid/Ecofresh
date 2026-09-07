"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";

interface ProfitabilityChartProps {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
}

export function ProfitabilityChart({
  totalRevenue,
  totalCost,
  totalProfit,
  averageMargin,
}: ProfitabilityChartProps) {
  const maxVal = Math.max(totalRevenue, totalCost, totalProfit, 1);
  const revWidth = `${Math.min(100, (totalRevenue / maxVal) * 100)}%`;
  const costWidth = `${Math.min(100, (totalCost / maxVal) * 100)}%`;
  const profitWidth = `${Math.min(100, (totalProfit / maxVal) * 100)}%`;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            مقارنة الإيرادات والتكاليف والأرباح التجميعية
          </h3>
          <p className="text-xs text-muted-foreground">
            نسبة متوسط هامش الربح المحقق:{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {averageMargin.toFixed(2)}%
            </span>
          </p>
        </div>

        <div className="space-y-4">
          {/* Total Revenue Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-muted-foreground">إجمالي الإيرادات (Gross Revenue)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: revWidth }}
              />
            </div>
          </div>

          {/* Total Cost Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-muted-foreground">إجمالي التكاليف (Total Shipment Costs)</span>
              <span className="text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(totalCost)}
              </span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: costWidth }}
              />
            </div>
          </div>

          {/* Net Profit Bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-muted-foreground">صافي الربح التجميعي (Net Profit)</span>
              <span className="text-primary font-mono">
                {formatCurrency(totalProfit)}
              </span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: profitWidth }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
