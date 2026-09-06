export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFinancialDashboardMetrics } from "@/actions/financials";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ship,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Building2,
  Plus,
  ArrowLeft,
  ShieldAlert,
  Clock,
  Factory,
  Scale,
  CreditCard,
  PackagePlus,
  Wallet,
  Landmark,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Dynamic Prisma Queries for live KPIs & Dashboard Metrics
  const [
    stationsCount,
    stationsList,
    activeShipmentsCount,
    totalFgStockAgg,
    rawWasteAgg,
    processingOpsAgg,
    shipmentsProfitAgg,
    pendingQcBatches,
    readyOrders,
    financialMetrics,
  ] = await Promise.all([
    prisma.station.count({ where: { isActive: true } }),
    prisma.station.findMany({ select: { name: true }, take: 3 }),
    prisma.shipment.count(),
    prisma.finishedGoodsBatch.aggregate({
      _sum: { availableQty: true },
    }),
    prisma.processingOperation.aggregate({
      _sum: { rawWasteKg: true, rawInputKg: true },
    }),
    prisma.processingOperation.count(),
    prisma.shipment.aggregate({
      _avg: { marginPercent: true, sellingPriceEur: true },
      _sum: { grossRevenueEgp: true, netProfitEgp: true },
    }),
    prisma.rawBatch.findMany({
      where: { qcStatus: "PENDING" },
      select: {
        batchId: true,
        initialQty: true,
        supplier: { select: { name: true } },
        station: { select: { name: true } },
      },
      take: 2,
    }),
    prisma.clientOrder.findMany({
      where: { unfulfilledQtyKg: { gt: 0 } },
      select: {
        orderId: true,
        productName: true,
        unfulfilledQtyKg: true,
        customer: { select: { name: true } },
      },
      take: 2,
    }),
    getFinancialDashboardMetrics(),
  ]);

  const totalFgStockKg = Number(totalFgStockAgg._sum.availableQty || 0);
  const totalFgStockTons = (totalFgStockKg / 1000).toFixed(1);

  const rawInputTotal = Number(rawWasteAgg._sum.rawInputKg || 0);
  const rawWasteTotal = Number(rawWasteAgg._sum.rawWasteKg || 0);
  const wasteRatePct = rawInputTotal > 0 ? ((rawWasteTotal / rawInputTotal) * 100).toFixed(1) : "0.0";

  const avgMarginPct = Number(shipmentsProfitAgg._avg.marginPercent || 0).toFixed(1);
  const avgEurPrice = Number(shipmentsProfitAgg._avg.sellingPriceEur || 0).toFixed(2);

  const totalAlertsCount = pendingQcBatches.length + readyOrders.length;
  const mainStationName = stationsList.length > 0 ? stationsList[0].name : "المحطة الرئيسية";

  return (
    <div className="space-y-4">
      {/* 4. HERO / PAGE HEADER */}
      <div className="flex flex-col justify-between gap-2 rounded-md bg-gradient-to-r from-[#012d1d] to-[#02472e] px-5 py-3 text-white shadow-sm md:flex-row md:items-center min-h-[70px]">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-[22px] font-bold text-white tracking-normal">
            مركز القيادة والمراقبة التشغيلية
          </h1>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-400/30">
            مباشر (LIVE)
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-1.5 font-medium text-emerald-100">
            <Building2 className="h-4 w-4 text-[#0054cd]" />
            <span>المحطة: {mainStationName} ({stationsCount} محطات نشطة)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 border-r border-emerald-800 pr-4 text-emerald-200">
            <span>المستخدم: <strong className="text-white">{user?.fullName || "المشرف العام"}</strong></span>
          </div>
        </div>
      </div>

      {/* 5. COMPACT KPI CARDS (Live Database Powered) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Shipments */}
        <Card className="rounded-md border border-[#c1c8c2] bg-white p-3 shadow-none border-r-4 border-r-[#012d1d] flex flex-col justify-between min-h-[85px]">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-[13px] font-bold text-gray-600">الشحنات والتصدير النشط</span>
            <Ship className="h-4 w-4 text-[#012d1d]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl md:text-[26px] font-bold text-gray-900 font-tabular-nums leading-none">
              {activeShipmentsCount} <span className="text-xs font-medium text-gray-500">شحنة</span>
            </div>
            <span className="text-xs font-bold text-emerald-700">قاعدة البيانات الفعلية</span>
          </div>
        </Card>

        {/* KPI 2: Finished Goods Inventory */}
        <Card className="rounded-md border border-[#c1c8c2] bg-white p-3 shadow-none border-r-4 border-r-[#0054cd] flex flex-col justify-between min-h-[85px]">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-[13px] font-bold text-gray-600">رصيد المنتج الجاهز (FG)</span>
            <Boxes className="h-4 w-4 text-[#0054cd]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl md:text-[26px] font-bold text-gray-900 font-tabular-nums leading-none">
              {totalFgStockTons} <span className="text-xs font-medium text-gray-500">طن</span>
            </div>
            <span className="text-xs font-bold text-emerald-700">{stationsCount} محطات فرز</span>
          </div>
        </Card>

        {/* KPI 3: Industrial Waste Rate */}
        <Card className="rounded-md border border-[#c1c8c2] bg-white p-3 shadow-none border-r-4 border-r-[#ba1a1a] flex flex-col justify-between min-h-[85px]">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-[13px] font-bold text-gray-600">معدل الهالك الصناعي</span>
            <AlertTriangle className="h-4 w-4 text-[#ba1a1a]" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl md:text-[26px] font-bold text-[#ba1a1a] font-tabular-nums leading-none">
              {wasteRatePct}%
            </div>
            <span className="text-xs font-bold text-emerald-700">المعياري &lt; 5.0%</span>
          </div>
        </Card>

        {/* KPI 4: Profit Margin */}
        <Card className="rounded-md border border-[#c1c8c2] bg-white p-3 shadow-none border-r-4 border-r-emerald-700 flex flex-col justify-between min-h-[85px]">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-[13px] font-bold text-gray-600">هامش الربح الإجمالي</span>
            <TrendingUp className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-2xl md:text-[26px] font-bold text-[#0054cd] font-tabular-nums leading-none">
              {avgMarginPct}% <span className="text-xs font-medium text-gray-500">(EUR)</span>
            </div>
            <span className="text-xs font-bold text-emerald-700">€{avgEurPrice} / وحدة</span>
          </div>
        </Card>
      </div>

      {/* 16. PROMINENT QUICK ACTIONS BAR */}
      <Card className="rounded-md border border-[#c1c8c2] bg-white p-3 shadow-none">
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#012d1d]" />
            <h3 className="text-sm font-bold text-[#012d1d]">إجراءات سريعة (بدء تشغيل فورياً)</h3>
          </div>
          <span className="text-xs text-gray-500 font-normal">نقرة واحدة لبدء أي عملية تدوير، شحن، أو استلام</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <Link
            href="/processing-operations/new"
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-md bg-[#012d1d] text-white text-xs md:text-sm font-bold shadow-sm hover:bg-[#02472e] transition-all"
          >
            <Factory className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate">+ عملية تدوير جديدة</span>
          </Link>

          <Link
            href="/shipments/new"
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-md bg-[#0054cd] text-white text-xs md:text-sm font-bold shadow-sm hover:bg-blue-700 transition-all"
          >
            <Ship className="h-4 w-4 text-cyan-300 shrink-0" />
            <span className="truncate">+ إنشاء شحنة</span>
          </Link>

          <Link
            href="/client-orders/new"
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-md border-2 border-[#012d1d] bg-white text-[#012d1d] text-xs md:text-sm font-bold hover:bg-emerald-50 transition-all"
          >
            <PackagePlus className="h-4 w-4 text-[#012d1d] shrink-0" />
            <span className="truncate">+ طلب تصدير</span>
          </Link>

          <Link
            href="/raw-purchases/new"
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-md border border-[#c1c8c2] bg-gray-50 text-gray-800 text-xs md:text-sm font-bold hover:bg-white hover:border-[#012d1d] transition-all"
          >
            <Scale className="h-4 w-4 text-emerald-800 shrink-0" />
            <span className="truncate">+ استلام خامات</span>
          </Link>

          <Link
            href="/financials/transactions/new"
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-md border border-[#c1c8c2] bg-gray-50 text-gray-800 text-xs md:text-sm font-bold hover:bg-white hover:border-[#012d1d] transition-all"
          >
            <CreditCard className="h-4 w-4 text-amber-700 shrink-0" />
            <span className="truncate">+ تسجيل مصروف</span>
          </Link>
        </div>
      </Card>

      {/* FINANCIAL HEALTH & LIQUIDITY STRIP */}
      <Card className="rounded-md border border-[#c1c8c2] bg-white p-4 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#012d1d]" />
            <h3 className="text-sm font-bold text-[#012d1d]">
              المركز المالي وموقف السيولة (Financial Clarity)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/financials"
              className="text-xs text-[#0054cd] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>دفتر الأستاذ العام</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/financials/treasury"
              className="text-xs text-[#0054cd] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>إدارة الخزائن والبنوك</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/reports/aging"
              className="text-xs text-[#0054cd] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>أعمار الديون (AR/AP)</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Customer AR Due */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
              <span>مستحقات على العملاء (AR)</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-800">
              {financialMetrics.totalArDue.toLocaleString("ar-EG", { minimumFractionDigits: 2 })}{" "}
              <span className="text-xs font-normal font-sans">ج.م</span>
            </div>
            <span className="text-[10px] text-emerald-700 block">ديون قائمة مطلوب تحصيلها</span>
          </div>

          {/* Supplier/Contractor AP Due */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
              <span>مستحقات للموردين والمقاولين (AP)</span>
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-800">
              {financialMetrics.totalApDue.toLocaleString("ar-EG", { minimumFractionDigits: 2 })}{" "}
              <span className="text-xs font-normal font-sans">ج.م</span>
            </div>
            <span className="text-[10px] text-amber-700 block">التزامات شراء وتشغيل مسددة جزئياً</span>
          </div>

          {/* Liquidity Total */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between text-blue-900 text-xs font-semibold">
              <span>السيولة المتاحة (خزائن وبنوك)</span>
              <Landmark className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-900">
              {(financialMetrics.treasuryCashBalance + financialMetrics.bankBalance).toLocaleString("ar-EG", {
                minimumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-normal font-sans">ج.م</span>
            </div>
            <span className="text-[10px] text-blue-700 block">
              نقدية: {financialMetrics.treasuryCashBalance.toLocaleString()} | بنك: {financialMetrics.bankBalance.toLocaleString()}
            </span>
          </div>

          {/* Today Flow */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between text-gray-700 text-xs font-semibold">
              <span>صافي حركة السيولة اليوم</span>
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <div
              className={`text-xl font-bold font-mono ${
                financialMetrics.todayInflow >= financialMetrics.todayOutflow
                  ? "text-emerald-700"
                  : "text-rose-700"
              }`}
            >
              {financialMetrics.todayInflow >= financialMetrics.todayOutflow ? "+" : ""}
              {(financialMetrics.todayInflow - financialMetrics.todayOutflow).toLocaleString("ar-EG", {
                minimumFractionDigits: 2,
              })}{" "}
              <span className="text-xs font-normal font-sans">ج.م</span>
            </div>
            <span className="text-[10px] text-gray-500 block">
              وارد: +{financialMetrics.todayInflow.toLocaleString()} | منصرف: -{financialMetrics.todayOutflow.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* 6. MAIN DASHBOARD GRID */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* OPERATIONAL ALERTS (Live Database Alerts) */}
        <Card className="rounded-md border border-[#c1c8c2] bg-white shadow-none lg:col-span-2">
          <CardHeader className="border-b border-[#c1c8c2] bg-gray-50/80 py-2.5 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm md:text-base font-bold text-[#012d1d]">
                تنبيهات وتدخلات تشغيلية عاجلة
              </CardTitle>
            </div>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
              {totalAlertsCount} إشعارات قائمة
            </span>
          </CardHeader>
          <CardContent className="p-3 space-y-2.5">
            {pendingQcBatches.map((batch) => (
              <div key={batch.batchId} className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/50 p-2.5">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-700 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs md:text-sm font-bold text-gray-900">
                        لوط خام يتطلب فحص جودة عاجل
                      </h4>
                      <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200 px-1.5 py-0.2 rounded">
                        {batch.batchId}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      الكمية: {Number(batch.initialQty).toLocaleString()} كجم — المورد: {batch.supplier.name} — المحطة: {batch.station?.name || "المحطة الرئيسية"}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/inventory/raw/${batch.batchId}`}
                  className="flex items-center gap-1 rounded bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800 shrink-0 transition-all"
                >
                  <span>بدء الفحص</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}

            {readyOrders.map((order) => (
              <div key={order.orderId} className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/50 p-2.5">
                <div className="flex items-center gap-3">
                  <Ship className="h-5 w-5 text-blue-700 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs md:text-sm font-bold text-gray-900">
                        طلبية تصدير جاهزة للتخصيص والشحن
                      </h4>
                      <span className="text-xs font-mono font-bold text-blue-900 bg-blue-200 px-1.5 py-0.2 rounded">
                        {order.orderId}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      العميل: {order.customer.name} — المتبقي للشحن: {Number(order.unfulfilledQtyKg).toLocaleString()} كجم ({order.productName})
                    </p>
                  </div>
                </div>
                <Link
                  href="/shipments/new"
                  className="flex items-center gap-1 rounded bg-[#012d1d] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#02472e] shrink-0 transition-all"
                >
                  <span>تخصيص اللوطات</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}

            {totalAlertsCount === 0 && (
              <div className="p-4 text-center text-xs text-gray-500">
                لا توجد تنبيهات عاجلة قائمة حالياً — جميع العمليات تسير بشكل منتظم.
              </div>
            )}
          </CardContent>
        </Card>

        {/* WORKBENCHES / OPERATIONAL MAP */}
        <Card className="rounded-md border border-[#c1c8c2] bg-white shadow-none">
          <CardHeader className="border-b border-[#c1c8c2] bg-gray-50/80 py-2.5 px-4">
            <CardTitle className="text-sm md:text-base font-bold text-[#012d1d]">
              مساحات العمليات (Workbenches)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <Link
              href="/processing-operations"
              className="flex items-center justify-between rounded-md border border-gray-200 p-2.5 text-xs md:text-sm font-bold text-gray-800 hover:border-[#0054cd] hover:bg-blue-50/40 transition-all h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4 text-[#012d1d]" />
                <span>مساحة خطوط الإنتاج والتدوير</span>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              href="/shipments"
              className="flex items-center justify-between rounded-md border border-gray-200 p-2.5 text-xs md:text-sm font-bold text-gray-800 hover:border-[#0054cd] hover:bg-blue-50/40 transition-all h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-[#012d1d]" />
                <span>مركز الشحنات والحاويات التصديرية</span>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              href="/inventory"
              className="flex items-center justify-between rounded-md border border-gray-200 p-2.5 text-xs md:text-sm font-bold text-gray-800 hover:border-[#0054cd] hover:bg-blue-50/40 transition-all h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-[#012d1d]" />
                <span>جدول أرصدة المنتج الجاهز (FG)</span>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-400" />
            </Link>

            <Link
              href="/financials"
              className="flex items-center justify-between rounded-md border border-gray-200 p-2.5 text-xs md:text-sm font-bold text-gray-800 hover:border-[#0054cd] hover:bg-blue-50/40 transition-all h-[44px]"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#012d1d]" />
                <span>كشف الحسابات العامة ودفتر الأستاذ</span>
              </div>
              <ArrowLeft className="h-4 w-4 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
