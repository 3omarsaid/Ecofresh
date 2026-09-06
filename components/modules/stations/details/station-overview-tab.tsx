"use client";

import React from "react";
import {
  Box,
  Package,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  History,
  Building2,
  ArrowRight,
  ArrowLeft,
  Warehouse,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StationOverviewTabProps {
  data: {
    station: any;
    inventory: {
      totalRawKg: number;
      totalFgKg: number;
      totalSuppliesUnits: number;
      rawBatches: any[];
      finishedBatches: any[];
      stationSupplies: any[];
    };
    reconciliation: {
      status: "RECONCILED" | "MISMATCH";
      items: Array<{
        itemType: "RAW" | "FINISHED" | "SUPPLY";
        id: string;
        name: string;
        unit: string;
        recordedBalance: number;
        ledgerInbound: number;
        ledgerOutbound: number;
        expectedLedgerBalance: number;
        difference: number;
        isReconciled: boolean;
      }>;
      totalMismatchCount: number;
    };
    alerts: Array<{
      id: string;
      severity: "WARNING" | "DANGER" | "INFO";
      title: string;
      description: string;
      link?: string;
    }>;
    operations: any[];
    stockMovements: any[];
  };
  onSwitchTab: (tabKey: string) => void;
  onSelectLotForTrace: (lotId: string) => void;
}

export function StationOverviewTab({
  data,
  onSwitchTab,
  onSelectLotForTrace,
}: StationOverviewTabProps) {
  const { station, inventory, reconciliation, alerts, operations, stockMovements } = data;

  const rawKg = inventory.totalRawKg;
  const fgKg = inventory.totalFgKg;
  const suppliesQty = inventory.totalSuppliesUnits;
  const totalPhysicalKg = rawKg + fgKg;
  const capacityKg = Number(station.coldStorageCapacityKg) || 500000;
  const capacityUsagePct = Math.min(100, Math.round((totalPhysicalKg / capacityKg) * 100));

  return (
    <div className="space-y-6">
      {/* 1. Main Current Inventory Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RAW CARD */}
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-amber-600" />
                مخزون الخامات (RAW)
              </span>
              <div className="text-2xl font-black font-mono text-amber-950">
                {rawKg.toLocaleString()} <span className="text-xs font-normal font-sans text-amber-800">كجم</span>
              </div>
              <span className="text-[11px] text-amber-700 block font-sans">
                {inventory.rawBatches.length} لوطات خام متاحة
              </span>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-800 font-bold">
              <Box className="w-6 h-6 text-amber-700" />
            </div>
          </CardContent>
        </Card>

        {/* FINISHED GOODS CARD */}
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                المنتج التام الجاهز (FG)
              </span>
              <div className="text-2xl font-black font-mono text-emerald-950">
                {fgKg.toLocaleString()} <span className="text-xs font-normal font-sans text-emerald-800">كجم</span>
              </div>
              <span className="text-[11px] text-emerald-700 block font-sans">
                {inventory.finishedBatches.length} باتشات تامة جاهزة للتصدير
              </span>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-800 font-bold">
              <Package className="w-6 h-6 text-emerald-700" />
            </div>
          </CardContent>
        </Card>

        {/* SUPPLIES CARD */}
        <Card className="border-cyan-200 bg-cyan-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyan-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-600" />
                مواد التعبئة والتغليف
              </span>
              <div className="text-2xl font-black font-mono text-cyan-950">
                {suppliesQty.toLocaleString()} <span className="text-xs font-normal font-sans text-cyan-800">قطعة</span>
              </div>
              <span className="text-[11px] text-cyan-700 block font-sans">
                {inventory.stationSupplies.length} أصناف مستلزمات
              </span>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-800 font-bold">
              <Layers className="w-6 h-6 text-cyan-700" />
            </div>
          </CardContent>
        </Card>

        {/* CAPACITY USAGE CARD */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1 w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">إشغال السعة التخزينية</span>
                <span className="text-xs font-bold font-mono text-gray-900">{capacityUsagePct}%</span>
              </div>
              <div className="text-xl font-bold font-mono text-gray-900">
                {totalPhysicalKg.toLocaleString()} / {capacityKg.toLocaleString()}{" "}
                <span className="text-[10px] font-normal font-sans text-gray-500">كجم</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-2">
                <div
                  className={`h-full transition-all ${
                    capacityUsagePct > 90 ? "bg-rose-600" : capacityUsagePct > 70 ? "bg-amber-600" : "bg-emerald-600"
                  }`}
                  style={{ width: `${capacityUsagePct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Ledger Reconciliation & Integrity Audit Widget */}
      <Card className={`border-2 ${reconciliation.status === "RECONCILED" ? "border-emerald-300 bg-emerald-50/20" : "border-rose-300 bg-rose-50/20"}`}>
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${reconciliation.status === "RECONCILED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>مطابقة الدفتر المخزني اللحظي (Stock Movement Ledger vs Live Balances)</span>
                  <Badge
                    variant="outline"
                    className={
                      reconciliation.status === "RECONCILED"
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                        : "bg-rose-100 text-rose-900 border-rose-300 font-bold"
                    }
                  >
                    {reconciliation.status === "RECONCILED" ? "متطابق دفترياً ولحظياً 100% ✓" : `يوجد ${reconciliation.totalMismatchCount} انحرافات ⚠`}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  فحص تكاملي فوري يقارن صافي جميع حركات المخزون المسجلة (الوارد - المنصرف) بالرصيد اللحظي الحالي لكل لوط.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onSwitchTab("movements")}
              className="text-xs font-bold gap-1 text-[#012d1d] hover:bg-emerald-50 shrink-0"
            >
              عرض سجل الأستاذ الكامل
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {reconciliation.items.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">لا توجد أرصدة خامات أو منتج تام بالمحطة حالياً للفحص.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-50 font-bold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="p-2.5">رقم اللوط / الباتش</th>
                    <th className="p-2.5">الصنف</th>
                    <th className="p-2.5">إجمالي الوارد (Inbound)</th>
                    <th className="p-2.5">إجمالي المنصرف (Outbound)</th>
                    <th className="p-2.5">الرصيد الدفتري المتوقع</th>
                    <th className="p-2.5">الرصيد الفعلي المسجل</th>
                    <th className="p-2.5">الفارق (Variance)</th>
                    <th className="p-2.5 text-center">حالة التكامل</th>
                    <th className="p-2.5 text-center">تتبع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {reconciliation.items.slice(0, 6).map((item) => (
                    <tr key={item.id} className={item.isReconciled ? "hover:bg-gray-50" : "bg-rose-50/40"}>
                      <td className="p-2.5 font-bold text-gray-900">{item.id}</td>
                      <td className="p-2.5 font-sans text-gray-700">{item.name}</td>
                      <td className="p-2.5 text-emerald-700">+{item.ledgerInbound.toLocaleString()} {item.unit}</td>
                      <td className="p-2.5 text-rose-700">-{item.ledgerOutbound.toLocaleString()} {item.unit}</td>
                      <td className="p-2.5 font-bold text-gray-900">{item.expectedLedgerBalance.toLocaleString()} {item.unit}</td>
                      <td className="p-2.5 font-bold text-indigo-900">{item.recordedBalance.toLocaleString()} {item.unit}</td>
                      <td className={`p-2.5 font-bold ${item.difference === 0 ? "text-gray-400" : "text-rose-700"}`}>
                        {item.difference === 0 ? "0" : `${item.difference > 0 ? "+" : ""}${item.difference.toLocaleString()} ${item.unit}`}
                      </td>
                      <td className="p-2.5 text-center">
                        {item.isReconciled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> متطابق
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" /> فارق دفتري
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectLotForTrace(item.id)}
                          className="h-6 px-2 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 font-sans"
                        >
                          تتبع المسار
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Operational Alerts & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMART ALERTS */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>التنبيهات التشغيلية الذكية للمحطة</span>
              <Badge variant="secondary" className="text-xs font-mono">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <span>لا توجد أي تنبيهات أو مخالفات تشغيلية حالياً. جميع المعدلات والمخزون في الحدود الآمنة.</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    alert.severity === "DANGER"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.severity === "DANGER" ? "text-rose-600" : "text-amber-600"}`} />
                  <div className="space-y-0.5 flex-1">
                    <strong className="font-bold block">{alert.title}</strong>
                    <p className="text-[11px] opacity-90">{alert.description}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* STATION LIVE ACTIVITY TIMELINE */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>سجل النشاط والعمليات اللحظي للمحطة</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSwitchTab("operations")}
              className="text-xs text-blue-700 font-bold hover:bg-blue-50"
            >
              عرض العمليات
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {stockMovements.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">لا توجد حركات مخزنية مسجلة بالمحطة بعد.</p>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {stockMovements.slice(0, 6).map((m: any) => {
                  const itemLabel = m.rawBatch?.rawProduct || m.finishedGoodsBatch?.productName || m.supply?.name || "صنف مخزني";
                  const lotLabel = m.rawBatch?.batchId || m.finishedGoodsBatch?.fgBatchId || m.supply?.name || "";
                  return (
                    <div key={m.id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-white font-sans font-bold">
                            {m.movementType}
                          </Badge>
                          <strong className="text-gray-900 font-sans">{itemLabel}</strong>
                          {lotLabel && <span className="text-gray-500 text-[10px]">({lotLabel})</span>}
                        </div>
                        <p className="text-[10px] text-gray-500 font-sans">
                          {new Date(m.createdAt).toLocaleDateString("ar-EG")} • {m.notes || m.movementNo}
                        </p>
                      </div>

                      <div className="text-left font-bold text-gray-900">
                        {Number(m.qty).toLocaleString()} {m.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
