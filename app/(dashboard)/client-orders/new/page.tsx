import { getCustomersForOrderSelect } from "@/actions/client-orders";
import { ClientOrderForm } from "@/components/modules/orders/client-order-form";

export const dynamic = "force-dynamic";

export default async function NewClientOrderPage() {
  const customers = await getCustomersForOrderSelect();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">تسجيل طلبية تصدير جديدة</h1>
        <p className="text-sm text-gray-500 mt-1">
          تسجيل طلبات الشراء الدولية واستيراد الأسعار والمواصفات المعتمدة آلياً
        </p>
      </div>

      <ClientOrderForm customers={customers} />
    </div>
  );
}
