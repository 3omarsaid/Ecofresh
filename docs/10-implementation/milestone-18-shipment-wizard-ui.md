# Milestone 18: معالج استخراج شحنة تصدير (Shipment Wizard UI)

> **المرحلة 18 من 26** — ضمن المرحلة الكبرى السادسة: الشحن والتصدير والربحية
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 4**

---

## 1. الهدف الاستراتيجي
بناء واجهة معالج إنشاء واعتماد شحنات التصدير البحرية (Shipment 3-Step Wizard)، وربط الشحنة بطلبيات التصدير المفتوحة، وتخصيص الباتشات التامة المتاحة من المخزن، وإدخال بيانات الحاويات المبردة ومصروفات الشحن والتخليص الجمركي.

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - معالج إنشاء شحنة جديد: [`base_prototype/pages/shipment-create.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipment-create.html)
  - سجل الشحنات: [`base_prototype/pages/shipments.html`](file:///e:/web/exporting_erp/base_prototype/pages/shipments.html)
- **منطق الكود في البروتوتايب:**
  - خطوات معالج الشحن: [`base_prototype/js/interactions.js`](file:///e:/web/exporting_erp/base_prototype/js/interactions.js)
  - تصفية الطلبيات المتاحة للشحن: [`base_prototype/js/state.js` Lines 930-980](file:///e:/web/exporting_erp/base_prototype/js/state.js#L930-L980).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 11** (طلبيات التصدير) و **Milestone 14** (باتشات الجاهز بالمخزن).

---

## 4. نطاق الواجهة والخطوات الثلاث (UI Scope)

### هيكل المكونات:
```
nilotic-frost-erp/
├── app/(dashboard)/shipments/
│   ├── page.tsx                           # جدول شحنات التصدير وحالات الإبحار
│   └── new/page.tsx                       # معالج التصدير بـ 3 خطوات
├── components/modules/shipments/
│   ├── wizard/
│   │   ├── step-1-order-picker.tsx        # الخطوة 1: اختيار طلبية العميل المفتوحة
│   │   ├── step-2-batch-allocation.tsx    # الخطوة 2: تخصيص الباتشات من المخزن
│   │   └── step-3-logistics-costs.tsx     # الخطوة 3: الحاوية والمصاريف والربحية
│   └── shipments-table.tsx                # جدول الشحنات المعتمدة
└── lib/validations/shipment.ts            # Zod Schema للشحنة
```

---

## 5. تفصيل خطوات معالج التصدير (Wizard Steps Contract)

### الخطوة 1: اختيار الطلبية المفتوحة (Order Selection)
- قائمة منسدلة بالطلبيات التي لها رصيد متبقي (`unfulfilled_qty_kg > 0`).
- عند اختيار الطلبية:
  - يُعرض كارت تفصيلي: اسم العميل، الدولة، ميناء الوصول، الصنف، السعر باليورو (`unitPriceEur`)، وسعر الصرف (`fxRate`).
  - عرض شريط الرصيد المتبقي (مثل: *"المتبقي 10,000 كجم من إجمالي 10,000 كجم"*).

### الخطوة 2: تخصيص الباتشات من المخزن (Batch Allocation)
- جدول يعرض فقط الباتشات الجاهزة التي تطابق صنف الطلبية ولها رصيد متاح:
  - إدخال الكمية المخصصة لكل باتش بالكيلوجرام.
  - فحص التحقق في الواجهة:
    - $\text{allocatedQty} \le \text{batch.availableQty}$
    - $\sum \text{allocatedQty} \le \text{order.unfulfilledQtyKg}$
  - عرض إجمالي وزن الشحنة المخصصة حتى اللحظة.

### الخطوة 3: بيانات الحاوية والمصروفات اللوجستية (Logistics & Costs)
- **بيانات الشحن البحري:**
  - رقم الحاوية المبردة (Container No) — مثل `MSKU-987654-2`.
  - رقم الختم الملاحي (Seal No) — مثل `EG-CUS-88210`.
  - الخط الملاحي (Shipping Line) — مثل `Maersk Line`.
  - رقم الحجز (Booking No).
- **مصروفات الشحن والتصدير (بالجنيه):**
  - نولون النقل البري للميناء (Inland Trucking).
  - النولون البحري (Ocean Freight).
  - التخليص الجمركي والتثمين (Customs Clearance).
  - شهادات الفحص وسحب العينات (Inspection & Phyto).
  - رسوم الميناء والتفريغ (Terminal Port Charges).
- **صندوق المعاينة الفورية للأرباح والهامش (Live Margin Preview).**

---

## 6. كود الـ Validation بـ Zod (`lib/validations/shipment.ts`)

```ts
import { z } from 'zod';

export const ShipmentSchema = z.object({
  orderId: z.string().min(1, 'يجب اختيار طلبية التصدير'),
  dispatchDate: z.string().optional(),
  containerNo: z.string().min(4, 'رقم الحاوية مطلوب'),
  sealNo: z.string().min(3, 'رقم الختم الجمركي مطلوب'),
  shippingLine: z.string().min(2, 'الخط الملاحي مطلوب'),
  bookingNo: z.string().min(3, 'رقم الحجز الملاحي مطلوب'),
  allocatedBatches: z.array(z.object({
    fgBatchId: z.string().min(1, 'معرف الباتش مطلوب'),
    qty: z.coerce.number().positive('الكمية المخصصة يجب أن تكون أكبر من 0'),
  })).min(1, 'يجب تخصيص باتش واحد على الأقل'),
  costs: z.object({
    inlandTrucking: z.coerce.number().min(0).default(6500),
    oceanFreight: z.coerce.number().min(0).default(22000),
    customsClearance: z.coerce.number().min(0).default(4500),
    inspectionCertificates: z.coerce.number().min(0).default(2500),
    portTerminalCharges: z.coerce.number().min(0).default(3500),
  }),
  notes: z.string().optional(),
});
```

---

## 7. نقطة التفتيش والاختبار (Check Point 18)
1. **اختبار اختيار الطلبية وتوارث البيانات:**
   - اختيار طلبية شركة سما `ORD-2026-001` وتأكيد قراءة سعر 1.85 EUR وميناء روتردام تلقائياً.
2. **اختبار حدود التخصيص في الواجهة:**
   - محاولة تخصيص 12,000 كجم لطلبية رصيدها المتبقي 10,000 كجم فقط.
   - **النتيجة المتوقعة:** ظهور خطأ يمنع التقدم للخطوة الثالثة.
3. **اختبار حساب المصروفات:**
   - التأكد من جمع المصروفات اللوجستية الخمسة لحظياً في الخطوة 3 وإظهار الإجمالي (39,000 ج.م).

---

## 8. شروط الاكتمال (Definition of Done)
- [ ] معالج الشحنات بـ 3 خطوات يعمل دون أخطاء برمجية.
- [ ] التحقق يمنع تجاوز رصيد الباتشات ورصيد الطلبية.
- [ ] صندوق الأرباح اللحظي جاهز لاستقبال دالة الاعتماد في المايلستون 19.
