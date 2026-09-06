export const dynamic = "force-dynamic";
import { SupplyForm } from "@/components/modules/supplies/supply-form";

export const metadata = {
  title: "إضافة مستلزم جديد — Nilotic Frost ERP",
};

export default function NewSupplyPage() {
  return (
    <div className="space-y-6">
      <SupplyForm />
    </div>
  );
}
