'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Layers, 
  ArrowLeft, 
  RotateCw, 
  SlidersHorizontal, 
  Factory, 
  PlusCircle, 
  ArrowLeftRight, 
  ShieldCheck, 
  History, 
  GitBranch, 
  PackageCheck, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StationOverviewTab } from './station-overview-tab';
import { StationInventoryTab } from './station-inventory-tab';
import { StationTraceabilityTab } from './station-traceability-tab';
import { StationOperationsTab } from './station-operations-tab';
import { StationMovementsTab } from './station-movements-tab';
import { StationTransfersTab } from './station-transfers-tab';
import { StationAdjustmentsTab } from './station-adjustments-tab';
import { StationAdjustmentDialog } from './station-adjustment-dialog';

interface StationControlCenterProps {
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
    operations: any[];
    stockMovements: any[];
    transfers: any[];
    adjustments: any[];
    auditLogs: any[];
    reconciliation: {
      status: 'RECONCILED' | 'MISMATCH';
      items: any[];
      totalMismatchCount: number;
    };
    alerts: Array<{
      id: string;
      severity: 'WARNING' | 'DANGER' | 'INFO';
      title: string;
      description: string;
      link?: string;
    }>;
  };
}

export function StationControlCenter({ data }: StationControlCenterProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('OVERVIEW');
  const [selectedLotForTrace, setSelectedLotForTrace] = useState<string | null>(null);
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { station, inventory, operations, stockMovements, transfers, adjustments, auditLogs, reconciliation, alerts } = data;

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSelectLotForTrace = (lotId: string) => {
    setSelectedLotForTrace(lotId);
    setActiveTab('TRACEABILITY');
  };

  const isReconciled = reconciliation.status === 'RECONCILED';

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Station Identity & Meta */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/stations" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <Building2 className="h-3.5 w-3.5" />
                <span>المحطات والمخازن</span>
              </Link>
              <span>/</span>
              <span className="text-foreground font-semibold">مركز التحكم والعمليات</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                    {station.name}
                  </h1>
                  <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5">
                    {station.code || station.id}
                  </Badge>
                  <Badge
                    variant={station.isActive ? 'default' : 'secondary'}
                    className={`text-xs ${
                      station.isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40'
                        : ''
                    }`}
                  >
                    {station.isActive ? 'نشطة وتشغيلية' : 'متوقفة مؤقتاً'}
                  </Badge>
                  {isReconciled ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      الدفتر متطابق
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1 text-xs animate-pulse">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      عدم تطابق ({reconciliation.totalMismatchCount} بنود)
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1.5">
                  {station.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {station.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    {station.stockLocations?.length || 0} مستودعات فرعية
                  </span>
                  {station.capacityKg && (
                    <span className="flex items-center gap-1">
                      السعة الاستيعابية: {Number(station.capacityKg).toLocaleString()} كجم
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 gap-1.5 text-xs text-muted-foreground"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-blue-700 bg-blue-50/50 border-blue-200 hover:bg-blue-100/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
            >
              <Link href="/raw-materials">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>استلام خام</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-purple-700 bg-purple-50/50 border-purple-200 hover:bg-purple-100/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
            >
              <Link href={`/inventory/transfers?stationId=${station.id}`}>
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>تحويل مخزون</span>
              </Link>
            </Button>

            <Button
              onClick={() => setIsAdjustmentDialogOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-orange-700 bg-orange-50/50 border-orange-200 hover:bg-orange-100/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>تسوية وجرد</span>
            </Button>

            <Button
              asChild
              size="sm"
              className="h-9 gap-1.5 text-xs font-bold shadow-sm"
            >
              <Link href={`/processing/wizard?stationId=${station.id}`}>
                <Factory className="h-3.5 w-3.5" />
                <span>سحب وتشغيل</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b overflow-x-auto">
          <TabsList className="bg-transparent h-12 p-0 space-x-reverse space-x-2 border-b-0">
            <TabsTrigger
              value="OVERVIEW"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-xs font-bold gap-2 text-muted-foreground data-[state=active]:text-primary transition-all"
            >
              <Building2 className="h-4 w-4" />
              <span>نظرة عامة ومطابقة الدفتر</span>
            </TabsTrigger>

            <TabsTrigger
              value="INVENTORY"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-xs font-bold gap-2 text-muted-foreground data-[state=active]:text-primary transition-all"
            >
              <Layers className="h-4 w-4" />
              <span>جرد المخزون اللحظي</span>
            </TabsTrigger>

            <TabsTrigger
              value="TRACEABILITY"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-xs font-bold gap-2 text-muted-foreground data-[state=active]:text-primary transition-all"
            >
              <GitBranch className="h-4 w-4" />
              <span>شجرة التتبع والنسب</span>
            </TabsTrigger>

            <TabsTrigger
              value="OPERATIONS"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-xs font-bold gap-2 text-muted-foreground data-[state=active]:text-primary transition-all"
            >
              <Factory className="h-4 w-4" />
              <span>عمليات التشغيل ({operations.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="MOVEMENTS"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-xs font-bold gap-2 text-muted-foreground data-[state=active]:text-primary transition-all"
            >
              <History className="h-4 w-4" />
              <span>دفتر الحركات ({stockMovements.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="TRANSFERS"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-xs font-bold gap-2 text-muted-foreground data-[state=active]:text-primary transition-all"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>التحويلات ({transfers.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="ADJUSTMENTS"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-xs font-bold gap-2 text-muted-foreground data-[state=active]:text-primary transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>التسويات والتدقيق ({adjustments.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Overview & Reconciliation */}
        <TabsContent value="OVERVIEW" className="space-y-6 m-0 focus-visible:outline-none">
          <StationOverviewTab
            data={data}
            onSwitchTab={(tabKey) => setActiveTab(tabKey)}
            onSelectLotForTrace={handleSelectLotForTrace}
          />
        </TabsContent>

        {/* Tab 2: Live Inventory Grid */}
        <TabsContent value="INVENTORY" className="space-y-6 m-0 focus-visible:outline-none">
          <StationInventoryTab
            station={station}
            inventory={inventory}
            onOpenAdjustment={() => setIsAdjustmentDialogOpen(true)}
            onSelectLotForTrace={handleSelectLotForTrace}
          />
        </TabsContent>

        {/* Tab 3: Bidirectional Lot Traceability */}
        <TabsContent value="TRACEABILITY" className="space-y-6 m-0 focus-visible:outline-none">
          <StationTraceabilityTab
            initialLotId={selectedLotForTrace}
            rawBatches={inventory.rawBatches}
            finishedBatches={inventory.finishedBatches}
          />
        </TabsContent>

        {/* Tab 4: Processing Operations */}
        <TabsContent value="OPERATIONS" className="space-y-6 m-0 focus-visible:outline-none">
          <StationOperationsTab operations={operations} />
        </TabsContent>

        {/* Tab 5: Stock Movement Ledger */}
        <TabsContent value="MOVEMENTS" className="space-y-6 m-0 focus-visible:outline-none">
          <StationMovementsTab movements={stockMovements} />
        </TabsContent>

        {/* Tab 6: Inter-station Transfers */}
        <TabsContent value="TRANSFERS" className="space-y-6 m-0 focus-visible:outline-none">
          <StationTransfersTab
            transfers={transfers}
            currentStationId={station.id}
          />
        </TabsContent>

        {/* Tab 7: Stock Adjustments & Audit Logs */}
        <TabsContent value="ADJUSTMENTS" className="space-y-6 m-0 focus-visible:outline-none">
          <StationAdjustmentsTab
            adjustments={adjustments}
            auditLogs={auditLogs}
            stationId={station.id}
            stationName={station.name}
            inventory={inventory}
          />
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Dialog */}
      <StationAdjustmentDialog
        open={isAdjustmentDialogOpen}
        onOpenChange={setIsAdjustmentDialogOpen}
        stationId={station.id}
        stationName={station.name}
        inventory={inventory}
      />
    </div>
  );
}
