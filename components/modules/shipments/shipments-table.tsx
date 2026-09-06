"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientOrder, Customer, FinishedGoodsBatch, Station, UserRole } from "@prisma/client";
import { Search, Filter, Eye, Ship, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CancelOperationModal } from "@/components/modules/common/cancel-operation-modal";
import { can } from "@/lib/permissions";

type ExtendedClientOrder = ClientOrder & {
  customer: Customer;
};

type ExtendedFinishedGoodsBatch = FinishedGoodsBatch & {
  station: Station;
};

interface ShipmentsTableProps {
  clientOrders: ExtendedClientOrder[];
  finishedGoodsBatches: ExtendedFinishedGoodsBatch[];
  userRole?: UserRole;
}

export function ShipmentsTable({
  clientOrders,
  finishedGoodsBatches,
  userRole = UserRole.ADMIN,
}: ShipmentsTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const canCancel = can(userRole, 'DELETE_OPERATION');

  const filteredOrders = clientOrders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase());

    const isFulfilled = Number(order.unfulfilledQtyKg) === 0;
    const isNew = Number(order.unfulfilledQtyKg) === Number(order.orderedQtyKg);

    let matchesStatus = true;
    if (statusFilter === "OPEN") matchesStatus = !isFulfilled;
    else if (statusFilter === "SHIPPED") matchesStatus = isFulfilled;
    else if (statusFilter === "NEW") matchesStatus = isNew;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5 space-y-4">
      {/* Quick Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
        <div className="flex items-center gap-1.5 shrink-0 font-bold text-[#012d1d]">
          <Filter className="h-4 w-4" />
          تصفية التشغيل:
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#012d1d]"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="OPEN">طلبيات مفتوحة</option>
          <option value="NEW">جديدة لم تشحن</option>
          <option value="SHIPPED">تم شحنها بالكامل</option>
        </select>

        {/* Search Input */}
        <div className="flex-1 min-w-[220px] relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الشحنة/الطلبية، اسم العميل، أو المنتج..."
            className="w-full bg-white border border-gray-300 rounded-lg pr-8 text-xs"
          />
          <Search className="h-4 w-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
            <tr>
              <th className="p-3">رقم الطلبية / الشحنة</th>
              <th className="p-3">العميل المستورد</th>
              <th className="p-3">المنتج المتعاقد عليه</th>
              <th className="p-3 font-mono">إجمالي الطلبية</th>
              <th className="p-3 font-mono">المتبقي للشحن</th>
              <th className="p-3 text-center">الحالة</th>
              <th className="p-3 font-mono">تاريخ الإنشاء</th>
              <th className="p-3 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const orderedQty = Number(order.orderedQtyKg);
                const unfulfilledQty = Number(order.unfulfilledQtyKg);
                const isFullyShipped = unfulfilledQty === 0;

                return (
                  <tr key={order.orderId} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#012d1d] text-sm">
                      {order.orderId}
                    </td>
                    <td className="p-3 font-bold text-gray-800 font-sans">
                      {order.customer.name} ({order.customer.country})
                    </td>
                    <td className="p-3 font-sans">
                      <span className="font-bold text-gray-900 block">{order.productName}</span>
                      <span className="text-[10px] text-gray-500 block font-normal">
                        تعبئة: {order.packagingSpec}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#012d1d]">
                      {orderedQty.toLocaleString()} كجم
                    </td>
                    <td className="p-3 font-bold text-amber-700">
                      {unfulfilledQty.toLocaleString()} كجم
                    </td>
                    <td className="p-3 text-center font-sans">
                      {isFullyShipped ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                          🚢 تم الشحن بالكامل
                        </span>
                      ) : unfulfilledQty < orderedQty ? (
                        <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                          📦 شحن جزئي
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                          ⚙️ جديدة / مفتوحة
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 font-mono text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="p-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-2">
                        {!isFullyShipped && (
                          <Button asChild size="sm"
                              className="bg-[#012d1d] hover:bg-[#02472e] text-white text-[11px] h-7 px-2.5 font-semibold gap-1">
  <Link href={`/shipments/new?orderId=${order.orderId}`}>
                              <Ship className="h-3.5 w-3.5" />
                              تجهيز شحنة
                            </Link>
</Button>
                        )}

                        {canCancel && isFullyShipped && (
                          <CancelOperationModal
                            operationType="shipment"
                            operationId={order.orderId}
                            operationLabel={`شحنة الطلبية ${order.orderId} للعميل ${order.customer.name}`}
                            isDisabled={true}
                            disabledReason="لا يمكن الإلغاء بعد الخروج"
                          />
                        )}

                        <Button asChild variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2 text-gray-600 gap-1">
  <Link href="/client-orders">
                            <ExternalLink className="h-3 w-3" />
                            الطلبية
                          </Link>
</Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500 font-sans">
                  لا توجد طلبيات تصدير مطابقة لفلاتر البحث الحالية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
