'use client';

import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Search, 
  UserCheck, 
  Clock, 
  FileText,
  Activity,
  CheckCircle2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StationAdjustmentDialog } from './station-adjustment-dialog';

interface StockAdjustment {
  adjustmentId: string;
  date: string;
  stationId: string;
  targetType: string;
  targetId: string;
  systemQty: number | string;
  actualQty: number | string;
  differenceQty: number | string;
  reason: string;
  createdAt: string;
  approvedBy?: {
    fullName: string | null;
  } | null;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  performedAt: string;
  user?: {
    fullName: string | null;
  } | null;
}

interface StationAdjustmentsTabProps {
  adjustments: StockAdjustment[];
  auditLogs: AuditLog[];
  stationId: string;
  stationName: string;
  inventory: {
    rawBatches: Array<{ batchId: string; rawProduct: string; availableQty: number }>;
    finishedBatches: Array<{ fgBatchId: string; productName: string; availableQty: number }>;
    stationSupplies: Array<{ supplyId: string; stock: number; supply: { name: string; unit: string } }>;
  };
}

export function StationAdjustmentsTab({
  adjustments,
  auditLogs,
  stationId,
  stationName,
  inventory,
}: StationAdjustmentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'ADJUSTMENTS' | 'AUDIT'>('ADJUSTMENTS');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filtered adjustments
  const filteredAdjustments = adjustments.filter((adj) => {
    return (
      adj.adjustmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adj.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (adj.approvedBy?.fullName && adj.approvedBy.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    return (
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user?.fullName && log.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getTargetTypeLabel = (targetType: string) => {
    switch (targetType) {
      case 'RAW_LOT':
        return { label: 'لوط خام', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'FINISHED_BATCH':
        return { label: 'منتج تام', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' };
      case 'SUPPLY':
        return { label: 'مستلزم تعبئة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' };
      default:
        return { label: targetType, color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Subtab switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex bg-muted rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('ADJUSTMENTS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
              activeSubTab === 'ADJUSTMENTS'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4 text-orange-500" />
            <span>سجل التسويات المخزنية ({adjustments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('AUDIT')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all ${
              activeSubTab === 'AUDIT'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>سجل الرقابة والتتبع الأمني ({auditLogs.length})</span>
          </button>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2 text-xs font-bold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          إجراء تسوية / جرد مخزني معتمد
        </Button>
      </div>

      {activeSubTab === 'ADJUSTMENTS' ? (
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-orange-500" />
                  أذونات التسوية والجرد الدوري بالمحطة
                </CardTitle>
                <CardDescription>
                  جميع التعديلات تتم عبر معاملة برمجية موثقة (StockMovement + StockAdjustment + AuditLog)
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الإذن، اللوط، السبب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 h-9 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <th className="p-3">رقم الإذن</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">نوع البند</th>
                    <th className="p-3">المعرف / اللوط</th>
                    <th className="p-3">رصيد النظام (السابق)</th>
                    <th className="p-3">الرصيد الفعلي (المعتمد)</th>
                    <th className="p-3">الفارق (العجز / الزيادة)</th>
                    <th className="p-3">سبب التسوية المعتمد</th>
                    <th className="p-3">المعتمد</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-muted-foreground">
                        لا توجد تسويات مخزنية مسجلة
                      </td>
                    </tr>
                  ) : (
                    filteredAdjustments.map((adj) => {
                      const typeMeta = getTargetTypeLabel(adj.targetType);
                      const diff = Number(adj.differenceQty);
                      const isPositive = diff > 0;
                      const isNegative = diff < 0;

                      return (
                        <tr key={adj.adjustmentId} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {adj.adjustmentId}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(adj.date).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${typeMeta.color}`}>
                              {typeMeta.label}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono font-semibold">{adj.targetId}</td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {Number(adj.systemQty).toLocaleString()}
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                            {Number(adj.actualQty).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-mono font-bold inline-flex items-center gap-1 ${
                                isPositive
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : isNegative
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {isPositive && <TrendingUp className="h-3 w-3" />}
                              {isNegative && <TrendingDown className="h-3 w-3" />}
                              {isPositive ? '+' : ''}
                              {diff.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3 max-w-[200px] truncate text-slate-700 dark:text-slate-300">
                            {adj.reason}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {adj.approvedBy?.fullName ? (
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3 text-muted-foreground" />
                                {adj.approvedBy.fullName}
                              </span>
                            ) : (
                              <span>مسؤول الجرد</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  سجل الرقابة والتدقيق الأمني (Audit Log)
                </CardTitle>
                <CardDescription>
                  رصد شامل ومفصل لجميع العمليات الحساسة التي تمت على مستوى المحطة ومخزونها
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في سجل التدقيق..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 h-9 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <th className="p-3">الإجراء المنفذ</th>
                    <th className="p-3">الكيان / المعرف</th>
                    <th className="p-3">التوقيت</th>
                    <th className="p-3">المستخدم المنفذ</th>
                    <th className="p-3">تفاصيل المعاملة (Payload / Changes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-muted-foreground">
                        لا توجد سجلات تدقيق مسجلة
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      let detailsStr = '';
                      if (typeof log.details === 'object') {
                        detailsStr = JSON.stringify(log.details);
                      } else {
                        detailsStr = String(log.details || '');
                      }

                      return (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {log.action}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-slate-900 dark:text-white block">
                              {log.entityType}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground block">
                              {log.entityId}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            <div>
                              {new Date(log.performedAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-[10px] font-mono">
                              {new Date(log.performedAt).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <UserCheck className="h-3 w-3 text-muted-foreground" />
                              {log.user?.fullName || 'مستخدم النظام'}
                            </span>
                          </td>
                          <td className="p-3 max-w-[350px]">
                            <p className="font-mono text-[11px] text-muted-foreground bg-muted/50 p-2 rounded truncate">
                              {detailsStr || 'لا توجد تفاصيل إضافية'}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustment Dialog Modal */}
      <StationAdjustmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        stationId={stationId}
        stationName={stationName}
        inventory={inventory}
      />
    </div>
  );
}
