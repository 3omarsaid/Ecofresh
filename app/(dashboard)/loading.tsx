import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      {/* Header Banner Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-72 bg-gray-100 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-7 w-20 bg-gray-300 rounded font-mono" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Table Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-4 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="h-8 w-44 bg-gray-200 rounded-lg" />
          <div className="h-8 w-24 bg-gray-100 rounded-lg" />
        </div>
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 w-full bg-gray-50 rounded-lg border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
