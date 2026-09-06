import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center" dir="rtl">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-[#012d1d] border border-emerald-200 mb-6 shadow-sm">
        <FileQuestion className="h-10 w-10 text-[#012d1d]" />
      </div>
      <span className="text-sm font-mono font-bold text-[#0054cd] bg-blue-50 px-3 py-1 rounded-full border border-blue-200 mb-3">
        خطأ 404 — الصفحة غير موجودة
      </span>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        عذراً، الصفحة المطلوبة غير متاحة
      </h1>
      <p className="max-w-md text-sm text-gray-600 mb-8 leading-relaxed">
        قد يكون الرابط الذي اتبعته غير صحيح، أو ربما تم نقل الصفحة أو تعديل مسارها داخل النظام.
      </p>
      <Button asChild className="bg-[#012d1d] hover:bg-[#02472e] text-white gap-2 font-bold px-6 py-2.5 shadow-sm">
        <Link href="/dashboard">
          <Home className="h-4 w-4" />
          <span>العودة للوحة التحكم الرئيسية</span>
        </Link>
      </Button>
    </div>
  );
}
