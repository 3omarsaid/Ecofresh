export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFinishedGoodsBatchById } from "@/lib/data/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BatchDnaBadge, SupplierShare } from "@/components/modules/inventory/batch-dna-badge";
import {
  ArrowRight,
  Package,
  Building2,
  Calendar,
  Layers,
  ShoppingBag,
  Dna,
  CheckCircle2,
  FileText,
  DollarSign,
  Scale,
} from "lucide-react";

interface BatchDetailPageProps {
  params: {
    batchId: string;
  };
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { batchId } = params;
  const batch = await getFinishedGoodsBatchById(batchId);

  if (!batch) {
    notFound();
  }

  const isManufactured = batch.sourceType === "MANUFACTURED";
  const initialQty = Number(batch.initialQty || 0);
  const availableQty = Number(batch.availableQty || 0);
  const costPerKg = Number(batch.costPerKg || 0);
  const totalValue = Number(batch.totalValue || availableQty * costPerKg);

  let suppliersList: SupplierShare[] = [];
  if (Array.isArray(batch.suppliersSummary)) {
    suppliersList = batch.suppliersSummary as any;
  } else if (typeof batch.suppliersSummary === "string") {
    try {
      suppliersList = JSON.parse(batch.suppliersSummary);
    } catch {
      suppliersList = [];
    }
  }

  let rawSourcesList: Array<{ batchId: string; qty: number }> = [];
  if (Array.isArray(batch.rawSources)) {
    rawSourcesList = batch.rawSources as any;
  } else if (typeof batch.rawSources === "string") {
    try {
      rawSourcesList = JSON.parse(batch.rawSources);
    } catch {
      rawSourcesList = [];
    }
  }

  const prodDate = batch.productionDate
    ? new Date(batch.productionDate).toISOString().split("T")[0]
    : "-";
  const expDate = batch.expiryDate
    ? new Date(batch.expiryDate).toISOString().split("T")[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header with Back Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-gray-900">{batch.fgBatchId}</h1>
              {isManufactured ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                  <Layers className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  إنتاج محلي
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold">
                  <ShoppingBag className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  صفقة مباشرة
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              بطاقة الباتش وتتبع مصادر المزارعين المساهمين (DNA Traceability Card)
            </p>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Key Stats & Properties (2 cols on md) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-800">
                <Package className="h-5 w-5 text-emerald-700" />
                بيانات الباتش الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-xs text-gray-500 font-medium block">الصنف التصديري</span>
                  <span className="text-base font-bold text-gray-900 mt-1 block">
                    {batch.productName}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-medium block">المحطة الحاضنة</span>
                  <span className="text-base font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-emerald-700 shrink-0" />
                    {batch.station?.name}
                    {batch.station?.location && (
                      <span className="text-xs font-normal text-gray-500">
                        ({batch.station.location})
                      </span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-medium block">تاريخ الإنتاج</span>
                  <span className="text-base font-mono font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                    {prodDate}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-medium block">تاريخ انتهاء الصلاحية</span>
                  <span className="text-base font-mono font-bold text-gray-900 mt-1">
                    {expDate ? expDate : "غير محدد"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-medium block">حالة الجودة</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {batch.qualityStatus || "مطابق للمواصفات التصديرية"}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-medium block">مرجع العملية / الصفقة</span>
                  <span className="text-base font-mono font-bold text-cyan-800 mt-1 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-cyan-600 shrink-0" />
                    {batch.sourceOpId ? (
                      `عملية: ${batch.sourceOpId}`
                    ) : batch.dealRef ? (
                      `صفقة: ${batch.dealRef}`
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DNA Traceability Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="bg-purple-50/40 border-b border-purple-100 py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-900">
                <Dna className="h-5 w-5 text-purple-600" />
                شجرة تتبع المزارعين والموردين (DNA Traceability)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-gray-600">
                تمثيل بصري لنسب مساهمة المزارع والموردين الأوليين في هذا الباتش:
              </p>

              {suppliersList.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
                  لا توجد بيانات تفصيلية متوفرة لشجرة الموردين لهذا الباتش.
                </div>
              ) : (
                <div className="space-y-3">
                  {suppliersList.map((sup, idx) => (
                    <div key={idx} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-purple-950 text-sm">{sup.supplierName}</span>
                        <span className="font-mono font-bold text-purple-700 text-sm">
                          {Number(sup.sharePct).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, sup.sharePct))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Raw Batches inputs if available */}
              {rawSourcesList.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">لوطات الخام المستخدمة في الإنتاج:</h4>
                  <div className="flex flex-wrap gap-2">
                    {rawSourcesList.map((rs, idx) => (
                      <Badge key={idx} variant="outline" className="bg-gray-50 text-gray-800 border-gray-300 font-mono">
                        {rs.batchId}: {rs.qty} كجم
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Financial & Quantities Summary Card */}
        <div className="space-y-6">
          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-950">
                <Scale className="h-5 w-5 text-emerald-700" />
                ملخص الرصيد والتكلفة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <span className="text-xs text-gray-500 font-semibold block">الكمية الأولية للباتش</span>
                <p className="text-lg font-bold text-gray-800 font-mono mt-0.5">
                  {initialQty.toLocaleString()} كجم
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold block">الرصيد المتاح للشحن الفوري</span>
                <p className="text-2xl font-bold text-[#012d1d] font-mono mt-0.5">
                  {availableQty.toLocaleString()} كجم
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold block">تكلفة الكيلو الموزونة</span>
                <p className="text-xl font-bold text-cyan-900 font-mono mt-0.5">
                  {costPerKg.toFixed(2)} <span className="text-xs font-normal">ج.م/كجم</span>
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold block">إجمالي قيمة الباتش بالمخزن</span>
                <p className="text-2xl font-bold text-[#0054cd] font-mono mt-0.5">
                  {totalValue.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
