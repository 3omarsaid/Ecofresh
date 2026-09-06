'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Truck, 
  UserCheck, 
  Layers, 
  CheckCircle2, 
  XCircle,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface StockTransfer {
  transferId: string;
  date: string;
  fromStationId: string;
  toStationId: string;
  itemType?: string | null;
  batchId?: string | null;
  rawBatchId?: string | null;
  fgBatchId?: string | null;
  supplyId?: string | null;
  productName: string;
  qtyKg: number | string;
  truckPlate?: string | null;
  driverName?: string | null;
  status: string;
  notes?: string | null;
  fromStation?: {
    name: string;
  } | null;
  toStation?: {
    name: string;
  } | null;
  createdBy?: {
    fullName: string | null;
  } | null;
}

interface StationTransfersTabProps {
  transfers: StockTransfer[];
  currentStationId: string;
}

export function StationTransfersTab({ transfers, currentStationId }: StationTransfersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');

  // Summary Metrics
  const metrics = useMemo(() => {
    let inboundQty = 0;
    let outboundQty = 0;
    let inboundCount = 0;
    let outboundCount = 0;

    for (const t of transfers) {
      if (t.status === 'ACTIVE') {
        const qty = Number(t.qtyKg || 0);
        if (t.toStationId === currentStationId) {
          inboundCount++;
          inboundQty += qty;
        } else if (t.fromStationId === currentStationId) {
          outboundCount++;
          outboundQty += qty;
        }
      }
    }

    return {
      totalCount: transfers.length,
      inboundCount,
      outboundCount,
      inboundQty,
      outboundQty,
    };
  }, [transfers, currentStationId]);

  // Filtered List
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const isInbound = t.toStationId === currentStationId;
      const isOutbound = t.fromStationId === currentStationId;

      const matchesSearch =
        t.transferId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.batchId && t.batchId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.driverName && t.driverName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.truckPlate && t.truckPlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.fromStation?.name && t.fromStation.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.toStation?.name && t.toStation.name.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesDirection = true;
      if (directionFilter === 'INBOUND') matchesDirection = isInbound;
      if (directionFilter === 'OUTBOUND') matchesDirection = isOutbound;

      return matchesSearch && matchesDirection;
    });
  }, [transfers, searchTerm, directionFilter, currentStationId]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50/60 to-white dark:from-slate-900 dark:to-slate-950 border-indigo-100 dark:border-indigo-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي التحويلات</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.totalCount}</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                حركات بين المحطات والمستودعات
              </p>
            </div>
            <div className="p-3 bg-indigo-100/80 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/60 to-white dark:from-slate-900 dark:to-slate-950 border-emerald-100 dark:border-emerald-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">الوارد للمحطة (Inbound)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {metrics.inboundQty.toLocaleString()}{' '}
                <span className="text-sm font-normal text-muted-foreground">كجم/وحدة</span>
              </h3>
              <p className="text-xs text-emerald-600/80 mt-0.5">
                {metrics.inboundCount} إذن تحويل وارد ومستلم
              </p>
            </div>
            <div className="p-3 bg-emerald-100/80 dark:bg-emerald-900/50 rounded-xl text-emerald-600">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50/60 to-white dark:from-slate-900 dark:to-slate-950 border-amber-100 dark:border-amber-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">المنصرف من المحطة (Outbound)</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                {metrics.outboundQty.toLocaleString()}{' '}
                <span className="text-sm font-normal text-muted-foreground">كجم/وحدة</span>
              </h3>
              <p className="text-xs text-amber-600/80 mt-0.5">
                {metrics.outboundCount} إذن تحويل صادر لمحطة أخرى
              </p>
            </div>
            <div className="p-3 bg-amber-100/80 dark:bg-amber-900/50 rounded-xl text-amber-600">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfers Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                سجل التحويلات التبادلية بين المحطات
              </CardTitle>
              <CardDescription>
                أذونات التحويل الصادرة والواردة، بيانات السائقين، والكميات المنقولة
              </CardDescription>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الإذن، الصنف، السائق..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 h-9 text-xs"
                />
              </div>
              <div className="flex bg-muted rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDirectionFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    directionFilter === 'ALL'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter('INBOUND')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    directionFilter === 'INBOUND'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  وارد للمحطة
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter('OUTBOUND')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    directionFilter === 'OUTBOUND'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  صادر من المحطة
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
                  <th className="p-3">رقم الإذن</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">اتجاه النقل</th>
                  <th className="p-3">الصنف / اللوط</th>
                  <th className="p-3">الكمية المنقولة</th>
                  <th className="p-3">وسيلة النقل / السائق</th>
                  <th className="p-3">المسؤول</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-muted-foreground">
                      لا توجد أذونات تحويل مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((t) => {
                    const isInbound = t.toStationId === currentStationId;

                    return (
                      <tr key={t.transferId} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {t.transferId}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(t.date).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {isInbound ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1">
                                <ArrowDownLeft className="h-3 w-3" />
                                وارد من: {t.fromStation?.name || 'محطة أخرى'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1">
                                <ArrowUpRight className="h-3 w-3" />
                                صادر إلى: {t.toStation?.name || 'محطة أخرى'}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {t.productName}
                          </div>
                          {t.batchId && (
                            <div className="text-[10px] font-mono text-muted-foreground">
                              لوط: {t.batchId}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-sm">
                          {Number(t.qtyKg).toLocaleString()} كجم
                        </td>
                        <td className="p-3">
                          {t.driverName || t.truckPlate ? (
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <Truck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div>
                                <span className="font-medium block">{t.driverName || '-'}</span>
                                {t.truckPlate && (
                                  <span className="text-[10px] font-mono text-muted-foreground block">
                                    لوحة: {t.truckPlate}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {t.createdBy?.fullName ? (
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-muted-foreground" />
                              {t.createdBy.fullName}
                            </span>
                          ) : (
                            <span>نظامي</span>
                          )}
                        </td>
                        <td className="p-3">
                          {t.status === 'ACTIVE' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40">
                              منفذ
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40">
                              ملغي
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 max-w-[180px] truncate text-muted-foreground">
                          {t.notes || '-'}
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
