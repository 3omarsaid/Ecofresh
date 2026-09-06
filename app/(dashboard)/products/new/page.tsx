import React from "react";
import { ProductForm } from "@/components/modules/products/product-form";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="py-6">
      <ProductForm />
    </div>
  );
}
