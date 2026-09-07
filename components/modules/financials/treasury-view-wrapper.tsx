"use client";

import React, { useState } from "react";
import { TreasuryCard } from "./treasury-card";
import { TreasuryAdjustmentModal } from "./treasury-adjustment-modal";
import { Building2, Landmark, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TreasuryAccountItem {
  id: string;
  name: string;
  accountNumber?: string | null;
  bankName?: string | null;
  currency: string;
  balance: number | string | { toString(): string };
  type: string;
  stationId?: string | null;
  stationName?: string | null;
  isActive: boolean;
  reconciliationStatus?: "BALANCED" | "MISMATCH";
  calculatedBalance?: number;
  difference?: number;
  totalInflows?: number;
  totalOutflows?: number;
  activeTxnCount?: number;
}

interface TreasuryViewWrapperProps {
  accounts: TreasuryAccountItem[];
}

export function TreasuryViewWrapper({ accounts }: TreasuryViewWrapperProps) {
  const [selectedForAdjustment, setSelectedForAdjustment] = useState<any | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gray-600" />
          قائمة حسابات الخزائن والبنوك ({accounts.length})
        </h2>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm space-y-4">
          <Landmark className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-gray-700">لا توجد حسابات مالية مسجلة</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            قم بإضافة حساب خزينة أو بنك جديد لبدء تسجيل العمليات المالية.
          </p>
          <Button asChild className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 mt-2">
            <Link href="/financials/treasury/new">
              <Plus className="h-4 w-4" /> إضافة حساب مالي جديد
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <TreasuryCard
              key={account.id}
              account={account}
              onAdjustClick={(acc) =>
                setSelectedForAdjustment({
                  id: acc.id,
                  name: acc.name,
                  currency: acc.currency,
                  balance: Number(acc.balance),
                  type: acc.type,
                })
              }
            />
          ))}
        </div>
      )}

      {selectedForAdjustment && (
        <TreasuryAdjustmentModal
          isOpen={!!selectedForAdjustment}
          onClose={() => setSelectedForAdjustment(null)}
          account={selectedForAdjustment}
        />
      )}
    </div>
  );
}