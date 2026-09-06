"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, ArrowRightLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseModal } from "./expense-modal";
import { TreasuryTransferModal } from "./treasury-transfer-modal";

interface TreasuryActionBarProps {
  accounts: any[];
}

export function TreasuryActionBar({ accounts }: TreasuryActionBarProps) {
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        <Button
          onClick={() => setIsExpenseOpen(true)}
          variant="outline"
          className="border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 font-semibold gap-2 text-xs h-9"
        >
          <Receipt className="h-4 w-4 text-amber-700" />
          + تسجيل مصروف مباشر
        </Button>

        <Button
          onClick={() => setIsTransferOpen(true)}
          variant="outline"
          className="border-blue-300 text-blue-900 bg-blue-50 hover:bg-blue-100 font-semibold gap-2 text-xs h-9"
        >
          <ArrowRightLeft className="h-4 w-4 text-blue-700" />
          ↔ تحويل بين الحسابات
        </Button>

        <Button asChild className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-semibold shadow-sm text-xs h-9">
  <Link href="/financials/treasury/new">
            <Plus className="h-4 w-4" /> إضافة حساب جديد
          </Link>
</Button>
      </div>

      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        treasuryAccounts={accounts}
      />

      <TreasuryTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        treasuryAccounts={accounts}
      />
    </>
  );
}
