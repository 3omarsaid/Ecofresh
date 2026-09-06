import React from "react";

interface StationBenchmark {
  id: string;
  name: string;
  location: string;
  coldStorageCapacityKg: number;
  electricityRatePerKg: number;
  operationsCount: number;
  totalRawInputKg: number;
  totalFinishedOutputKg: number;
  totalRawWasteKg: number;
  averageYieldPct: number;
  averageWastePct: number;
  averageCostPerKg: number;
}

interface StationsBenchmarkTableProps {
  stations: StationBenchmark[];
}

export function StationsBenchmarkTable({ stations }: StationsBenchmarkTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm text-right">
        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
          <tr>
            <th className="p-3 text-right">المحطة</th>
            <th className="p-3 text-right">الموقع</th>
            <th className="p-3 text-center">السعة التخزينية (كجم)</th>
            <th className="p-3 text-center">تعريفة الكهرباء (ج.م/كجم)</th>
            <th className="p-3 text-center">عدد التشغيلات</th>
            <th className="p-3 text-center">متوسط نسبة التصافي (%)</th>
            <th className="p-3 text-center">متوسط نسبة الهالك (%)</th>
            <th className="p-3 text-center">متوسط تكلفة الكيلو (ج.م)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {stations.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-muted-foreground">
                لا توجد محطات تجميد مسجلة حتى الآن.
              </td>
            </tr>
          ) : (
            stations.map((st) => (
              <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                <td className="p-3 font-semibold text-foreground">
                  {st.name}
                  <span className="block text-xs text-muted-foreground font-mono">
                    ({st.id})
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{st.location}</td>
                <td className="p-3 text-center font-mono font-medium">
                  {st.coldStorageCapacityKg.toLocaleString("ar-EG")}
                </td>
                <td className="p-3 text-center font-mono font-medium text-amber-600 dark:text-amber-400">
                  {st.electricityRatePerKg.toFixed(2)}
                </td>
                <td className="p-3 text-center font-mono font-bold text-primary">
                  {st.operationsCount}
                </td>
                <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {st.averageYieldPct.toFixed(2)}%
                </td>
                <td className="p-3 text-center font-mono font-semibold text-rose-600 dark:text-rose-400">
                  {st.averageWastePct.toFixed(2)}%
                </td>
                <td className="p-3 text-center font-mono font-bold text-foreground">
                  {st.averageCostPerKg.toLocaleString("ar-EG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ج.م
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
