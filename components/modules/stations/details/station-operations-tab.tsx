'use client';

import React, { useState, useMemo } from 'react';
import { 
  Factory, 
  Search, 
  DollarSign, 
  Layers, 
  PackageCheck,
  UserCheck,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface OperationIssue {
  id: number;
  batchId: string;
  supplierName: string;
  qtyKg: number | string;
}

interface OperationSupply {
  id: number;
  supplyId: string;
  consumedQty: number | string;
  wasteQty: number | string;
  supply?: {
    name: string;
    unit: string;
  };
}

interface Operation {
  id: string;
  date: string;
  stationId: string;
  rawProduct: string;
  finishedProduct: string;
  contractorId: string;
  contractor?: {
    id: string;
    name: string;
  };
  rawInputKg: number | string;
  finishedOutputKg: number | string;
  secondaryOutputKg: number | string;
  rawWasteKg: number | string;
  yieldPercent: number | string;
  rawCost: number | string;
  suppliesConsumedCost: number | string;
  suppliesWasteCost: number | string;
  contractorCost: number | string;
  stationCost: number | string;
  grandTotalCost: number | string;
  costPerKg: number | string;
  generatedBatchId?: string;
  status: string;
  notes?: string;
  rawIssues?: OperationIssue[];
  supplyIssues?: OperationSupply[];
}

interface StationOperationsTabProps {
  operations: Operation[];
}

export function StationOperationsTab({ operations }: StationOperationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalRaw = 0;
    let totalFg = 0;
    let totalCost = 0;
    let validYieldSum = 0;
    let activeOpsCount = 0;

    for (const op of operations) {
      if (op.status === 'ACTIVE') {
        activeOpsCount++;
        totalRaw += Number(op.rawInputKg || 0);
        totalFg += Number(op.finishedOutputKg || 0);
        totalCost += Number(op.grandTotalCost || 0);
        validYieldSum += Number(op.yieldPercent || 0);
      }
    }

    const avgYield = activeOpsCount > 0 ? (validYieldSum / activeOpsCount).toFixed(1) : '0.0';

    return {
      totalOps: operations.length,
      activeOpsCount,
      totalRaw,
      totalFg,
      totalCost,
      avgYield,
    };
  }, [operations]);

  // Filtered List
  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      const matchesSearch =
        op.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.rawProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.finishedProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.contractor?.name && op.contractor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (op.generatedBatchId && op.generatedBatchId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        op.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [operations, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50/60 to-white dark:from-slate-900 dark:to-slate-950 border-blue-100 dark:border-blue-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي التشغيلات</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics.totalOps}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                {metrics.activeOpsCount} تشغيلة سارية ومغلقة
              </p>
            </div>
            <div className="p-3 bg-blue-100/80 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
              <Factory className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50/60 to-white dark:from-slate-900 dark:to-slate-950 border-amber-100 dark:border-amber-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">الخام المشغل (Input)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics.totalRaw.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">كجم</span>
              </h3>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                مسحوب من لوطات المحطة
              </p>
            </div>
            <div className="p-3 bg-amber-100/80 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50/60 to-white dark:from-slate-900 dark:to-slate-950 border-emerald-100 dark:border-emerald-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">المنتج التام (Output)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics.totalFg.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">كجم</span>
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                معدل استخراج عام: {metrics.avgYield}%
              </p>
            </div>
            <div className="p-3 bg-emerald-100/80 dark:bg-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50/60 to-white dark:from-slate-900 dark:to-slate-950 border-purple-100 dark:border-purple-900/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي تكاليف التشغيل</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                <span className="text-sm font-normal text-muted-foreground">ج.م</span>
              </h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                خام + مستلزمات + مقاول + محطة
              </p>
            </div>
            <div className="p-3 bg-purple-100/80 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Table & Filters */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                سجل عمليات التشغيل بالمحطة
              </CardTitle>
              <CardDescription>
                تاريخ التشغيل، مدخلات الخام، مخرجات التعبئة، نسب الهالك والمقاولين
              </CardDescription>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم التشغيلة، الصنف، المقاول..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 h-9 text-xs"
                />
              </div>
              <div className="flex bg-muted rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    statusFilter === 'ALL'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  الكل ({operations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  سارية
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CANCELLED')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    statusFilter === 'CANCELLED'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ملغاة
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
                  <th className="p-3">كود التشغيلة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">التحويل (خام &larr; تام)</th>
                  <th className="p-3">المقاول</th>
                  <th className="p-3">المدخلات (كجم)</th>
                  <th className="p-3">المخرجات (كجم)</th>
                  <th className="p-3">نسبة الاستخراج</th>
                  <th className="p-3">إجمالي التكلفة</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOperations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-muted-foreground">
                      لا توجد عمليات تشغيل مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredOperations.map((op) => {
                    const yieldNum = Number(op.yieldPercent || 0);
                    const isYieldGood = yieldNum >= 80;

                    return (
                      <tr key={op.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {op.id}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(op.date).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {op.rawProduct}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span>&larr;</span>
                            <span>{op.finishedProduct}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {op.contractor ? (
                            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <UserCheck className="h-3 w-3 text-muted-foreground" />
                              {op.contractor.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-medium">
                          {Number(op.rawInputKg).toLocaleString()} كجم
                        </td>
                        <td className="p-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          {Number(op.finishedOutputKg).toLocaleString()} كجم
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs ${
                              isYieldGood
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {yieldNum.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="font-mono font-semibold">
                            {Number(op.grandTotalCost).toLocaleString()} ج.م
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {Number(op.costPerKg).toFixed(2)} ج.م/كجم
                          </div>
                        </td>
                        <td className="p-3">
                          {op.status === 'ACTIVE' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40">
                              سارية
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40">
                              ملغاة
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOperation(op)}
                            className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>عرض</span>
                          </Button>
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

      {/* Operation Details Dialog */}
      <Dialog open={!!selectedOperation} onOpenChange={(open) => !open && setSelectedOperation(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
          {selectedOperation && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <Factory className="h-5 w-5 text-primary" />
                      تفاصيل أمر التشغيل {selectedOperation.id}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      بتاريخ{' '}
                      {new Date(selectedOperation.date).toLocaleDateString('ar-EG', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </DialogDescription>
                  </div>
                  <Badge
                    variant={selectedOperation.status === 'ACTIVE' ? 'default' : 'destructive'}
                    className="text-xs px-3 py-1"
                  >
                    {selectedOperation.status === 'ACTIVE' ? 'تشغيلة سارية' : 'تشغيلة ملغاة'}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-4 text-xs">
                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-4 rounded-xl border">
                  <div>
                    <span className="text-muted-foreground block mb-1">الخام المستخدم:</span>
                    <span className="text-sm font-bold font-mono">
                      {Number(selectedOperation.rawInputKg).toLocaleString()} كجم
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">المنتج التام المستخرج:</span>
                    <span className="text-sm font-bold font-mono text-emerald-600">
                      {Number(selectedOperation.finishedOutputKg).toLocaleString()} كجم
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">نسبة الاستخراج (Yield):</span>
                    <span className="text-sm font-bold font-mono text-primary">
                      {Number(selectedOperation.yieldPercent).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">الهالك الصناعي (Waste):</span>
                    <span className="text-sm font-bold font-mono text-rose-600">
                      {Number(selectedOperation.rawWasteKg).toLocaleString()} كجم
                    </span>
                  </div>
                </div>

                {/* Costs Breakdown */}
                <div>
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <DollarSign className="h-4 w-4 text-primary" />
                    هيكل التكاليف الصناعية للتشغيلة
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <p className="text-muted-foreground text-[11px]">تكلفة الخام المسحوب</p>
                      <p className="font-mono font-bold mt-1 text-sm">
                        {Number(selectedOperation.rawCost).toLocaleString()} ج.م
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <p className="text-muted-foreground text-[11px]">تكلفة مستلزمات التعبئة</p>
                      <p className="font-mono font-bold mt-1 text-sm">
                        {Number(selectedOperation.suppliesConsumedCost).toLocaleString()} ج.م
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <p className="text-muted-foreground text-[11px]">أجر المقاول والعمالة</p>
                      <p className="font-mono font-bold mt-1 text-sm">
                        {Number(selectedOperation.contractorCost).toLocaleString()} ج.م
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                      <p className="text-muted-foreground text-[11px]">تكلفة تشغيل المحطة</p>
                      <p className="font-mono font-bold mt-1 text-sm">
                        {Number(selectedOperation.stationCost).toLocaleString()} ج.م
                      </p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 col-span-2 sm:col-span-2">
                      <p className="text-primary font-semibold text-[11px]">إجمالي التكلفة الكلية / للكيلو</p>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="font-mono font-extrabold text-base text-primary">
                          {Number(selectedOperation.grandTotalCost).toLocaleString()} ج.م
                        </span>
                        <span className="font-mono text-muted-foreground font-medium">
                          ({Number(selectedOperation.costPerKg).toFixed(2)} ج.م / كجم)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw Batches Consumed */}
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <Layers className="h-4 w-4 text-amber-500" />
                    لوطات الخام المسحوبة من المحطة (Raw Issues)
                  </h4>
                  {selectedOperation.rawIssues && selectedOperation.rawIssues.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-right border-collapse">
                        <thead className="bg-muted text-muted-foreground">
                          <tr>
                            <th className="p-2">رقم اللوط</th>
                            <th className="p-2">المورد</th>
                            <th className="p-2">الكمية المسحوبة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedOperation.rawIssues.map((issue) => (
                            <tr key={issue.id}>
                              <td className="p-2 font-mono font-semibold">{issue.batchId}</td>
                              <td className="p-2">{issue.supplierName}</td>
                              <td className="p-2 font-mono font-bold">
                                {Number(issue.qtyKg).toLocaleString()} كجم
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">لا توجد بيانات مسجلة لسحب اللوطات</p>
                  )}
                </div>

                {/* Supplies Consumed */}
                <div>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                    <PackageCheck className="h-4 w-4 text-blue-500" />
                    مستلزمات التعبئة والتغليف المستهلكة (Supply Issues)
                  </h4>
                  {selectedOperation.supplyIssues && selectedOperation.supplyIssues.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-right border-collapse">
                        <thead className="bg-muted text-muted-foreground">
                          <tr>
                            <th className="p-2">المستلزم</th>
                            <th className="p-2">الكمية المستهلكة</th>
                            <th className="p-2">الهالك المسجل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedOperation.supplyIssues.map((issue) => (
                            <tr key={issue.id}>
                              <td className="p-2 font-semibold">
                                {issue.supply?.name || issue.supplyId}
                              </td>
                              <td className="p-2 font-mono font-bold">
                                {Number(issue.consumedQty).toLocaleString()}{' '}
                                {issue.supply?.unit || 'وحدة'}
                              </td>
                              <td className="p-2 font-mono text-rose-600">
                                {Number(issue.wasteQty).toLocaleString()}{' '}
                                {issue.supply?.unit || 'وحدة'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">لم يتم تسجيل استهلاك مستلزمات</p>
                  )}
                </div>

                {/* Generated Batch & Notes */}
                {selectedOperation.generatedBatchId && (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground text-xs block">تشغيلة المنتج التام المتولدة:</span>
                      <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                        {selectedOperation.generatedBatchId}
                      </span>
                    </div>
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                      جاهز للتصدير والتخصيص
                    </Badge>
                  </div>
                )}

                {selectedOperation.notes && (
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <span className="font-semibold block mb-1">ملاحظات التشغيل:</span>
                    <p className="text-muted-foreground">{selectedOperation.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
