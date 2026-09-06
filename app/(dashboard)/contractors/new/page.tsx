import React from "react";
import { getStationsForSelect } from "@/actions/contractors";
import { ContractorForm } from "@/components/modules/contractors/contractor-form";

export const dynamic = "force-dynamic";

export default async function NewContractorPage() {
  const stations = await getStationsForSelect();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">إضافة مقاول جديد</h1>
        <p className="text-sm text-gray-500 mt-1">
          تسجيل بيانات مقاول الفرز والتجهيز، وتحديد محطة التشغيل المرتبطة وتعريفة الأتعاب لكل كجم.
        </p>
      </div>

      <ContractorForm stations={stations} />
    </div>
  );
}
