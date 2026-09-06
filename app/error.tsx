"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Route Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 text-red-700 border border-red-200 mb-6 shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-600" />
      </div>
      <span className="text-sm font-mono font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200 mb-3">
        خطأ غير متوقع في معالجة الصفحة
      </span>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        حدث خطأ أثناء تحميل البيانات
      </h1>
      <p className="max-w-md text-sm text-gray-600 mb-8 leading-relaxed">
        واجه النظام مشكلة مؤقتة في عرض هذا المكون. يمكنك محاولة إعادة المحاولة أو العودة للوحة التحكم الرئيسية.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          variant="outline"
          className="border-gray-300 gap-2 font-bold"
        >
          <RotateCcw className="h-4 w-4" />
          <span>إعادة المحاولة</span>
        </Button>
        <Button asChild className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-bold shadow-sm">
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            <span>لوحة التحكم الرئيسية</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
