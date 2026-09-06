"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: PaginationControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalCount === 0) return null;

  const startRecord = Math.min((currentPage - 1) * pageSize + 1, totalCount);
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 border-t border-gray-200 text-xs rounded-b-xl">
      {/* Counts summary */}
      <div className="text-gray-500 font-medium">
        عرض السجلات من <strong className="text-gray-900 font-mono">{startRecord}</strong> إلى{" "}
        <strong className="text-gray-900 font-mono">{endRecord}</strong> من إجمالي{" "}
        <strong className="text-[#012d1d] font-mono">{totalCount}</strong> سجل
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-1.5" dir="rtl">
        {/* First Page */}
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0 border-gray-300"
          title="الصفحة الأولى"
        >
          <Link href={createPageUrl(1)}>
            <ChevronsRight className="h-4 w-4" />
          </Link>
        </Button>

        {/* Previous Page */}
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0 border-gray-300"
          title="الصفحة السابقة"
        >
          <Link href={createPageUrl(Math.max(1, currentPage - 1))}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>

        {/* Page indicator */}
        <span className="px-3 py-1 font-mono font-bold bg-gray-100 border border-gray-300 rounded text-gray-800">
          صفحة {currentPage} من {Math.max(1, totalPages)}
        </span>

        {/* Next Page */}
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0 border-gray-300"
          title="الصفحة التالية"
        >
          <Link href={createPageUrl(Math.min(totalPages, currentPage + 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>

        {/* Last Page */}
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0 border-gray-300"
          title="الصفحة الأخيرة"
        >
          <Link href={createPageUrl(Math.max(1, totalPages))}>
            <ChevronsLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
