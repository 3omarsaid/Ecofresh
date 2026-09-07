import {
  getSuppliesForPurchaseSelect,
  getPackagingSuppliersSelect,
  getStationsForPackagingSelect,
} from "@/actions/packaging-purchases";
import { PackagingPurchaseForm } from "@/components/modules/procurement/packaging-purchase-form";

export const dynamic = "force-dynamic";

export default async function NewPackagingPurchasePage() {
  const [supplies, suppliers, stations] = await Promise.all([
    getSuppliesForPurchaseSelect(),
    getPackagingSuppliersSelect(),
    getStationsForPackagingSelect(),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تسجيل فاتورة شراء مستلزمات تعبئة وتغليف</h1>
        <p className="text-sm text-gray-500 mt-1">
          تسجيل المشتريات من الموردين وتحديث الأرصدة بالمخزن آلياً
        </p>
      </div>

      <PackagingPurchaseForm supplies={supplies} suppliers={suppliers} stations={stations} />
    </div>
  );
}
