"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  ExternalLink,
  Users,
  Truck,
  HardHat,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AgingReportViewProps {
  buckets: {
    bucket0to30: number;
    bucket31to60: number;
    bucket60plus: number;
    totalArOutstanding: number;
    totalApOutstanding: number;
  };
  customers: Array<{
    customerId: string;
    customerName: string;
    country: string;
    creditLimit: number;
    totalDue: number;
    totalCollected: number;
    outstandingBalance: number;
    bucket: "0-30" | "31-60" | "60+";
    lastMovementDate: Date | null;
    lastMovementRelative: string;
    hasBalance: boolean;
  }>;
  payables: Array<{
    partyId: string;
    partyName: string;
    partyType: string;
    category: "SUPPLIER" | "CONTRACTOR";
    totalDue: number;
    totalPaid: number;
    outstandingBalance: number;
    lastMovementDate: Date | null;
    lastMovementRelative: string;
    hasBalance: boolean;
  }>;
}

export function AgingReportView({
  buckets,
  customers,
  payables,
}: AgingReportViewProps) {
  const [activeTab, setActiveTab] = useState<"CUSTOMERS" | "PAYABLES">("CUSTOMERS");
  const [arBalanceOnly, setArBalanceOnly] = useState(true);
  const [arBucketFilter, setArBucketFilter] = useState<string>("ALL");
  const [arSearch, setArSearch] = useState("");

  const [apBalanceOnly, setApBalanceOnly] = useState(true);
  const [apCategoryFilter, setApCategoryFilter] = useState<string>("ALL");
  const [apSearch, setApSearch] = useState("");

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    if (arBalanceOnly && c.outstandingBalance <= 0) return false;
    if (arBucketFilter !== "ALL" && c.bucket !== arBucketFilter) return false;
    if (arSearch) {
      const q = arSearch.toLowerCase();
      const match =
        c.customerName.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Filtered Payables
  const filteredPayables = payables.filter((p) => {
    if (apBalanceOnly && p.outstandingBalance <= 0) return false;
    if (apCategoryFilter !== "ALL" && p.category !== apCategoryFilter) return false;
    if (apSearch) {
      const q = apSearch.toLowerCase();
      const match =
        p.partyName.toLowerCase().includes(q) ||
        p.partyId.toLowerCase().includes(q) ||
        p.partyType.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* High Level Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total AR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">مستحقات على العملاء (AR)</span>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {Math.round(buckets.totalArOutstanding).toLocaleString()}{" "}
            <span className="text-xs font-normal font-sans">ج.م</span>
          </div>
          <span className="text-[11px] text-emerald-600 block">إجمالي ديون العملاء المطلوب تحصيلها</span>
        </div>

        {/* Total AP */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">مستحقات للموردين والمقاولين (AP)</span>
            <Truck className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono">
            {Math.round(buckets.totalApOutstanding).toLocaleString()}{" "}
            <span className="text-xs font-normal font-sans">ج.م</span>
          </div>
          <span className="text-[11px] text-amber-600 block">إجمالي التزامات واجبة السداد</span>
        </div>

        {/* 0-30 Days Bucket */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">شريحة 0-30 يوماً</span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-2xl font-bold text-gray-800 font-mono">
            {Math.round(buckets.bucket0to30).toLocaleString()}{" "}
            <span className="text-xs font-normal font-sans">ج.م</span>
          </div>
          <span className="text-[11px] text-gray-500 block">ضمن فترة الائتمان العادية</span>
        </div>

        {/* 31+ Days Buckets (Critical) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-semibold">متأخرات أكثر من 30 يوماً</span>
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono">
            {Math.round(buckets.bucket31to60 + buckets.bucket60plus).toLocaleString()}{" "}
            <span className="text-xs font-normal font-sans">ج.م</span>
          </div>
          <span className="text-[11px] text-rose-600 block">
            (+60 يوماً: {Math.round(buckets.bucket60plus).toLocaleString()} ج.م)
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "CUSTOMERS" ? "default" : "outline"}
            onClick={() => setActiveTab("CUSTOMERS")}
            className={`gap-2 text-xs font-bold ${
              activeTab === "CUSTOMERS"
                ? "bg-[#012d1d] hover:bg-[#02472e] text-white"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            ديون ومستحقات العملاء (AR) ({customers.filter((c) => c.outstandingBalance > 0).length})
          </Button>

          <Button
            variant={activeTab === "PAYABLES" ? "default" : "outline"}
            onClick={() => setActiveTab("PAYABLES")}
            className={`gap-2 text-xs font-bold ${
              activeTab === "PAYABLES"
                ? "bg-[#012d1d] hover:bg-[#02472e] text-white"
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <Truck className="w-4 h-4" />
            مستحقات الموردين ومقاولي العمالة (AP) ({payables.filter((p) => p.outstandingBalance > 0).length})
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="text-xs gap-1.5 print:hidden"
        >
          <Printer className="w-3.5 h-3.5" />
          طباعة التقرير
        </Button>
      </div>

      {/* Tab 1: Customers (AR) */}
      {activeTab === "CUSTOMERS" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <Input
                  type="text"
                  placeholder="بحث باسم العميل أو الكود أو الدولة..."
                  value={arSearch}
                  onChange={(e) => setArSearch(e.target.value)}
                  className="h-8 text-xs pr-8"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={arBucketFilter}
                onChange={(e) => setArBucketFilter(e.target.value)}
                className="h-8 px-2.5 rounded-md border border-gray-300 text-xs bg-white font-medium"
              >
                <option value="ALL">جميع الشرائح الزمنية</option>
                <option value="0-30">0-30 يوماً</option>
                <option value="31-60">31-60 يوماً</option>
                <option value="60+">+60 يوماً (حرجة)</option>
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer select-none text-gray-700 font-medium mr-2">
                <input
                  type="checkbox"
                  checked={arBalanceOnly}
                  onChange={(e) => setArBalanceOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[#012d1d] focus:ring-0"
                />
                <span>إظهار من عليهم متبقي فقط ({customers.filter((c) => c.outstandingBalance > 0).length})</span>
              </label>
            </div>

            <div className="text-xs text-gray-500 font-mono">
              معروض: <strong className="text-gray-900">{filteredCustomers.length}</strong> عميل
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-xs text-right">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3.5">العميل</th>
                  <th className="p-3.5">الدولة</th>
                  <th className="p-3.5 text-center font-mono">المطلوب (+)</th>
                  <th className="p-3.5 text-center font-mono">المحصل (-)</th>
                  <th className="p-3.5 text-center font-mono">المتبقي المستحق (عليه)</th>
                  <th className="p-3.5 text-center">شريحة التأخير</th>
                  <th className="p-3.5 text-center">آخر حركة</th>
                  <th className="p-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400 font-sans">
                      لا توجد بيانات عملاء مطابقة للفلاتر المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.customerId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3.5 font-sans">
                        <strong className="text-gray-900 block">{cust.customerName}</strong>
                        <span className="text-[10px] text-gray-500 font-mono">{cust.customerId}</span>
                      </td>
                      <td className="p-3.5 text-gray-600 font-sans">{cust.country}</td>
                      <td className="p-3.5 text-center font-bold text-gray-800">
                        {cust.totalDue.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-700">
                        {cust.totalCollected.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-bold text-sm ${
                            cust.outstandingBalance > 0 ? "text-rose-700" : "text-gray-400"
                          }`}
                        >
                          {cust.outstandingBalance.toLocaleString("ar-EG", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ج.م
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            cust.bucket === "0-30"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : cust.bucket === "31-60"
                              ? "bg-amber-50 text-amber-700 border-amber-300"
                              : "bg-rose-50 text-rose-700 border-rose-300 font-bold"
                          }`}
                        >
                          {cust.bucket === "0-30"
                            ? "0-30 يوماً"
                            : cust.bucket === "31-60"
                            ? "31-60 يوماً"
                            : "+60 يوماً"}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-center text-gray-500 font-sans text-[11px]">
                        {cust.lastMovementRelative}
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
  <Link href={`/financials/parties/${cust.customerId}`}>
                            <ExternalLink className="w-3 h-3" />
                            كشف الحساب
                          </Link>
</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payables (Suppliers & Contractors) */}
      {activeTab === "PAYABLES" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <Input
                  type="text"
                  placeholder="بحث باسم الطرف أو الكود أو التصنيف..."
                  value={apSearch}
                  onChange={(e) => setApSearch(e.target.value)}
                  className="h-8 text-xs pr-8"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <select
                value={apCategoryFilter}
                onChange={(e) => setApCategoryFilter(e.target.value)}
                className="h-8 px-2.5 rounded-md border border-gray-300 text-xs bg-white font-medium"
              >
                <option value="ALL">جميع الأطراف (موردون ومقاولون)</option>
                <option value="SUPPLIER">موردو الخام والمستلزمات فقط</option>
                <option value="CONTRACTOR">مقاولو العمالة والتشغيل فقط</option>
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer select-none text-gray-700 font-medium mr-2">
                <input
                  type="checkbox"
                  checked={apBalanceOnly}
                  onChange={(e) => setApBalanceOnly(e.target.checked)}
                  className="rounded border-gray-300 text-[#012d1d] focus:ring-0"
                />
                <span>إظهار من لهم مستحقات فقط ({payables.filter((p) => p.outstandingBalance > 0).length})</span>
              </label>
            </div>

            <div className="text-xs text-gray-500 font-mono">
              معروض: <strong className="text-gray-900">{filteredPayables.length}</strong> طرف
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-xs text-right">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3.5">الجهة المتعاملة</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5 text-center font-mono">المطلوب لهم (+)</th>
                  <th className="p-3.5 text-center font-mono">المسدد لهم (-)</th>
                  <th className="p-3.5 text-center font-mono">المتبقي المستحق (لهم)</th>
                  <th className="p-3.5 text-center">آخر حركة</th>
                  <th className="p-3.5 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filteredPayables.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 font-sans">
                      لا توجد التزامات مطابقة للفلاتر المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredPayables.map((item) => (
                    <tr key={item.partyId} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-3.5 font-sans">
                        <strong className="text-gray-900 block">{item.partyName}</strong>
                        <span className="text-[10px] text-gray-500 font-mono">{item.partyId}</span>
                      </td>
                      <td className="p-3.5 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700">
                          {item.category === "CONTRACTOR" ? (
                            <HardHat className="w-3.5 h-3.5 text-orange-600" />
                          ) : (
                            <Truck className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          {item.partyType}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold text-gray-800">
                        {item.totalDue.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-700">
                        {item.totalPaid.toLocaleString("ar-EG", { minimumFractionDigits: 2 })} ج.م
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-bold text-sm ${
                            item.outstandingBalance > 0 ? "text-amber-700" : "text-gray-400"
                          }`}
                        >
                          {item.outstandingBalance.toLocaleString("ar-EG", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ج.م
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-gray-500 font-sans text-[11px]">
                        {item.lastMovementRelative}
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
  <Link href={`/financials/parties/${item.partyId}`}>
                            <ExternalLink className="w-3 h-3" />
                            كشف الحساب
                          </Link>
</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
