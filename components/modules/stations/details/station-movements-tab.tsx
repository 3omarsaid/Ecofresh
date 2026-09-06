'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  SlidersHorizontal, 
  Search, 
  FileText, 
  History, 
  UserCheck, 
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StockMovement {
  id: string;
  movementNo: string;
  movementType: string;
  qty: number | string;
  unit: string;
  notes?: string | null;
  createdAt: string;
  rawBatch?: {
    batchId: string;
    rawProduct: string;
  } | null;
  finishedGoodsBatch?: {
    fgBatchId: string;
    productName: string;
  } | null;
  supply?: {
    id: string;
    name: string;
    unit: string;
  } | null;
  sourceLocation?: {
    name: string;
    type: string;
  } | null;
  destinationLocation?: {
    name: string;
    type: string;
  } | null;
  createdBy?: {
    fullName: string | null;
  } | null;
}

interface StationMovementsTabProps {
  movements: StockMovement[];
}

export function StationMovementsTab({ movements }: StationMovementsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Categorize Movement Type Badge and Direction
  const getMovementTypeMeta = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return {
          label: 'استلام شراء',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300',
          icon: ArrowDownLeft,
          direction: 'IN',
        };
      case 'PRODUCTION_IN':
        return {
          label: 'مخرجات إنتاج',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300',
          icon: ArrowDownLeft,
          direction: 'IN',
        };
      case 'PRODUCTION_OUT':
        return {
          label: 'سحب للتشغيل',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300',
          icon: ArrowUpRight,
          direction: 'OUT',
        };
      case 'TRANSFER_IN':
        return {
          label: 'تحويل وارد',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300',
          icon: ArrowDownLeft,
          direction: 'IN',
        };
      case 'TRANSFER_OUT':
        return {
          label: 'تحويل صادر',
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300',
          icon: ArrowUpRight,
          direction: 'OUT',
        };
      case 'SHIPMENT':
        return {
          label: 'شحن تصدير',
          color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300',
          icon: ArrowUpRight,
          direction: 'OUT',
        };
      case 'ADJUSTMENT':
        return {
          label: 'تسوية مخزنية',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300',
          icon: SlidersHorizontal,
          direction: 'ADJ',
        };
      case 'WASTE':
        return {
          label: 'إثبات هالك',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300',
          icon: ArrowUpRight,
          direction: 'OUT',
        };
      case 'REVERSAL_IN':
      case 'REVERSAL_OUT':
        return {
          label: 'حركة عكسية',
          color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
          icon: ArrowLeftRight,
          direction: type === 'REVERSAL_IN' ? 'IN' : 'OUT',
        };
      default:
        return {
          label: type,
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: ArrowLeftRight,
          direction: 'NEUTRAL',
        };
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    let inboundCount = 0;
    let outboundCount = 0;
    let adjCount = 0;

    for (const m of movements) {
      const meta = getMovementTypeMeta(m.movementType);
      if (meta.direction === 'IN') inboundCount++;
      else if (meta.direction === 'OUT') outboundCount++;
      else if (meta.direction === 'ADJ') adjCount++;
    }

    return {
      total: movements.length,
      inboundCount,
      outboundCount,
      adjCount,
    };
  }, [movements]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const itemDesc =
        m.rawBatch?.rawProduct ||
        m.rawBatch?.batchId ||
        m.finishedGoodsBatch?.productName ||
        m.finishedGoodsBatch?.fgBatchId ||
        m.supply?.name ||
        '';

      const matchesSearch =
        m.movementNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        itemDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.sourceLocation?.name && m.sourceLocation.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.destinationLocation?.name && m.destinationLocation.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.notes && m.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesType = true;
      if (typeFilter === 'INBOUND') {
        matchesType = ['PURCHASE', 'PRODUCTION_IN', 'TRANSFER_IN', 'REVERSAL_IN'].includes(m.movementType);
      } else if (typeFilter === 'OUTBOUND') {
        matchesType = ['PRODUCTION_OUT', 'TRANSFER_OUT', 'SHIPMENT', 'WASTE', 'REVERSAL_OUT'].includes(m.movementType);
      } else if (typeFilter === 'ADJUSTMENT') {
        matchesType = m.movementType === 'ADJUSTMENT';
      } else if (typeFilter === 'PRODUCTION') {
        matchesType = ['PRODUCTION_IN', 'PRODUCTION_OUT'].includes(m.movementType);
      }

      return matchesSearch && matchesType;
    });
  }, [movements, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي الحركات</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.total}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">مسجلة بالدفتر المخزني</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">حركات الوارد / الإضافة</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.inboundCount}</h3>
              <p className="text-xs text-emerald-600/80 mt-0.5">استلامات وتحويلات وإنتاج</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">حركات المنصرف / الصادر</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics.outboundCount}</h3>
              <p className="text-xs text-amber-600/80 mt-0.5">تشغيل وشحن وتحويل وهالك</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">حركات التسوية والجرد</p>
              <h3 className="text-2xl font-bold text-orange-600 mt-1">{metrics.adjCount}</h3>
              <p className="text-xs text-orange-600/80 mt-0.5">تعديلات معتمدة وموثقة</p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/50 rounded-xl text-orange-600">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                دفتر حركات المخزون (Stock Movements Ledger)
              </CardTitle>
              <CardDescription>
                السجل المحاسبي غير القابل للتعديل لجميع الحركات الفيزيائية بالمحطة
              </CardDescription>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الحركة، الصنف، الموقع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 h-9 text-xs"
                />
              </div>
              <div className="flex bg-muted rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                    typeFilter === 'ALL'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('INBOUND')}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                    typeFilter === 'INBOUND'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  وارد
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('OUTBOUND')}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                    typeFilter === 'OUTBOUND'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  صادر
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('PRODUCTION')}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                    typeFilter === 'PRODUCTION'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  تشغيل
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('ADJUSTMENT')}
                  className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                    typeFilter === 'ADJUSTMENT'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  تسويات
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b text-muted-foreground font-semibold">
                  <th className="p-3">رقم القيد / الحركة</th>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">الصنف / اللوط</th>
                  <th className="p-3">من &larr; إلى</th>
                  <th className="p-3">الكمية المقيدة</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">البيان والملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-muted-foreground">
                      لا توجد حركات مخزنية مسجلة تطابق معايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => {
                    const meta = getMovementTypeMeta(m.movementType);
                    const isPositive = meta.direction === 'IN';
                    const isNegative = meta.direction === 'OUT';

                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {m.movementNo}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div className="font-medium">
                            {new Date(m.createdAt).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {new Date(m.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[11px] gap-1 px-2 py-0.5 ${meta.color}`}>
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {m.rawBatch ? (
                            <div>
                              <span className="font-semibold text-amber-700 dark:text-amber-300 block">
                                {m.rawBatch.rawProduct}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                وط خام: {m.rawBatch.batchId}
                              </span>
                            </div>
                          ) : m.finishedGoodsBatch ? (
                            <div>
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300 block">
                                {m.finishedGoodsBatch.productName}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                تشغيلة تام: {m.finishedGoodsBatch.fgBatchId}
                              </span>
                            </div>
                          ) : m.supply ? (
                            <div>
                              <span className="font-semibold text-blue-700 dark:text-blue-300 block">
                                {m.supply.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">مستلزم تعبئة</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-muted-foreground flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300">
                              {m.sourceLocation?.name || 'خارجي'}
                            </span>
                            <span className="text-primary font-bold">&larr;</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {m.destinationLocation?.name || 'خارجي'}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isNegative
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isPositive ? '+' : isNegative ? '-' : ''}
                            {Number(m.qty).toLocaleString()} {m.unit}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {m.createdBy?.fullName ? (
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-muted-foreground" />
                              {m.createdBy.fullName}
                            </span>
                          ) : (
                            <span>نظامي</span>
                          )}
                        </td>
                        <td className="p-3 max-w-[200px] truncate text-muted-foreground">
                          {m.notes || '-'}
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
    </div>
  );
}
