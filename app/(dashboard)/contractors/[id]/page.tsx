export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPartyFinancialSummary } from "@/lib/data/ledger";
import { getTreasuryAccounts } from "@/actions/treasury";
import { PartyFinancialSummary } from "@/components/modules/financials/party-financial-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Cpu,
  Factory,
  FileText,
  Hammer,
  Phone,
  Receipt,
  Scale,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "تفاصيل وحساب مقاول التشغيل — Nilotic Frost ERP",
};

interface ContractorDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function ContractorDetailsPage({ params }: ContractorDetailsPageProps) {
  const [contractor, summary, accounts] = await Promise.all([
    prisma.contractor.findUnique({
      where: { id: params.id },
      include: {
        station: true,
        operations: {
          take: 15,
          orderBy: { date: "desc" },
        },
      },
    }),
    getPartyFinancialSummary(params.id, "مقاول تشغيل وعمالة"),
    getTreasuryAccounts(),
  ]);

  if (!contractor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm" className="gap-2 text-gray-700">
  <Link href="/contractors">
            <ArrowRight className="h-4 w-4" /> العودة لقائمة المقاولين
          </Link>
</Button>
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
          حالة المقاول: {contractor.isActive ? "نشط معتمد" : "غير نشط"}
        </Badge>
      </div>

      {/* Unified Financial Summary Component */}
      <PartyFinancialSummary summary={summary} treasuryAccounts={accounts} />

      {/* Contractor Master Info Card */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#012d1d] to-[#02472e] text-white p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
                <Hammer className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl font-bold text-white">{contractor.name}</CardTitle>
                  <Badge className="bg-cyan-900 text-cyan-200 border-cyan-700 font-mono text-xs">
                    {contractor.id}
                  </Badge>
                </div>
                <p className="text-emerald-100 text-xs mt-0.5 flex items-center gap-2">
                  <span>المحطة التابع لها: {contractor.station?.name || "عام لكافة المحطات"}</span>
                  {contractor.specialization && (
                    <>
                      <span>•</span>
                      <span>التخصص: {contractor.specialization}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
              <Scale className="h-4 w-4 text-cyan-300" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-emerald-200">تعريفة التشغيل والفرز</span>
                <span className="text-sm font-bold text-white font-mono">
                  {Number(contractor.tariffRatePerKg).toFixed(2)} ج.م / كجم
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Operations History */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Factory className="h-4 w-4 text-emerald-700" />
            سجل عمليات التشغيل المنفذة ({contractor.operations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {contractor.operations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              لا توجد عمليات تشغيل مسجلة لهذا المقاول حتى الآن.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">رقم العملية</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الخام المدخل</th>
                    <th className="p-3">المنتج التام الناتج</th>
                    <th className="p-3 font-mono">الكمية الناتجة (كجم)</th>
                    <th className="p-3 font-mono">نسبة التصافي</th>
                    <th className="p-3 font-mono">أتعاب المقاول المستحقة</th>
                    <th className="p-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {contractor.operations.map((op) => (
                    <tr key={op.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3 font-bold text-primary font-mono">{op.id}</td>
                      <td className="p-3 text-gray-500">
                        {new Date(op.date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-3 font-sans text-gray-800">{op.rawProduct}</td>
                      <td className="p-3 font-sans font-bold text-gray-900">{op.finishedProduct}</td>
                      <td className="p-3 font-bold text-emerald-700">
                        {Number(op.finishedOutputKg).toLocaleString()} كجم
                      </td>
                      <td className="p-3 text-gray-700">{Number(op.yieldPercent).toFixed(1)}%</td>
                      <td className="p-3 font-bold text-gray-900">
                        {Number(op.contractorCost).toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-center font-sans">
                        <Badge
                          variant="outline"
                          className={
                            op.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }
                        >
                          {op.status === "CANCELLED" ? "ملغاة" : "معتمدة"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
