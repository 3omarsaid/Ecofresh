# معايير الكود — Nilotic Frost ERP

## ملاحظة عامة

البروتوتايب لا يعتمد على style guide رسمي. هذا الملف يوثّق الأنماط **الملاحَظة فعلاً** في الكود، وليس قواعد معلنة.

---

## تسمية الملفات (File Naming)

| النوع | الصيغة | مثال |
|------|-------|-----|
| صفحات HTML | `kebab-case.html` | `shipment-create.html`, `raw-purchases.html` |
| ملفات JS | `camelCase.js` | `navigation.js`, `state.js` |
| ملفات CSS | `kebab-case.css` | `global.css`, `custom.css` |

---

## تسمية معرّفات الكيانات (Entity IDs)

```
العميل:    CUST-{NNN}        → CUST-001
المورد:    SUPP-{NNN}        → SUPP-001
المقاول:  CONT-{NNN}        → CONT-001
المحطة:   STN-{NN}          → STN-01
المنتج:   PRD-{NN}          → PRD-01
المستلزم: SUP-{NN}          → SUP-01

لوط الخام:  LOT-RAW-{YYYYMMDD}-{NN}  → LOT-RAW-20260815-01
باتش جاهز (إنتاج):  FG-PR-{YYYY}-{NNN}  → FG-PR-2026-001
باتش جاهز (صفقة):   FG-DIR-{YYYYMMDD}-{NN} → FG-DIR-20260823-01
عملية إنتاج: PR-{YYYY}-{NNN}         → PR-2026-001
طلبية:      ORD-{YYYY}-{NNN}         → ORD-2026-001
شحنة:       SHP-{YYYY}-{NNN}         → SHP-2026-001
قيد مالي:   TXN-{YYYY}-{NNN}         → TXN-2026-001
صفقة:       DEAL-{YYYY}-{NNN}        → DEAL-2026-001
تحويل:      TRF-{YYYY}-{NNN}         → TRF-2026-001
حساب:       ACC-{NN}                 → ACC-01
مستخدم:    usr-{NN}                  → usr-01
```

---

## تسمية الدوال (Function Naming)

```javascript
// دوال إضافة/إنشاء: add/create + اسم الكيان
addCustomer()
addSupplier()
addRawMaterialArrival()
createProcessingOperation()
createShipment()

// دوال الحصول على بيانات: get + الوصف
getCurrentUser()
getCustomerBalance()
getSupplierBalance()
getFinancialStatementsTotals()

// دوال إجراءات: فعل + الموضوع
setCurrentUser()
can(action)
save(state)
load()
reset()
```

---

## تسمية المتغيرات في الكود

```javascript
// الجمع للقوائم:
customers, suppliers, operations, shipments

// الفرد للعناصر:
const customer = state.customers.find(...)
const batch = state.rawBatches.find(...)

// المبالغ تنتهي بـ Egp أو Eur:
amountEgp, grossRevenueEgp, netProfitEgp
targetPriceEur, unitPriceEur

// النسب المئوية تنتهي بـ Pct أو Percent:
wastePct, marginPercent, yieldPercent, sharePct

// الكميات تنتهي بـ Kg:
shippedQtyKg, rawInputKg, finishedOutputKg, availableQtyKg

// المعرّفات تنتهي بـ Id:
customerId, supplierId, operationId, batchId
```

---

## هيكل كل صفحة HTML

كل صفحة تتبع هذا الترتيب:
```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <!-- 1. Meta -->
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>عنوان الصفحة</title>

  <!-- 2. Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

  <!-- 3. Fonts -->
  <link href="Google Fonts IBM Plex + Material Symbols"/>

  <!-- 4. Tailwind Config (inline) -->
  <script id="tailwind-config">tailwind.config = { ... }</script>

  <!-- 5. CSS -->
  <link rel="stylesheet" href="../css/global.css"/>
  <link rel="stylesheet" href="../css/custom.css"/>

  <!-- 6. State (NO defer — must load synchronously) -->
  <script src="../js/state.js"></script>

  <!-- 7. Navigation + Interactions (with defer) -->
  <script src="../js/navigation.js" defer></script>
  <script src="../js/interactions.js" defer></script>
  <script src="../js/app.js" defer></script>
</head>
<body class="bg-background text-on-surface min-h-screen w-full flex flex-col font-['IBM_Plex_Sans_Arabic'] antialiased overflow-x-hidden">

  <!-- Sidebar (empty — filled by navigation.js) -->
  <aside id="app-sidebar" class="..."></aside>

  <!-- Main Content -->
  <main class="flex-1 w-full md:w-[calc(100%-260px)] md:mr-[260px] pt-16 ...">
    <!-- Page content -->
  </main>

</body>
</html>
```

---

## الـ Tailwind CSS Conventions

### الفئات المستخدمة لكل نوع عنصر

**البطاقات:**
```
bg-surface border border-outline-variant rounded-xl p-4 shadow-sm
```

**الأزرار الرئيسية:**
```
bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-container transition-all
```

**الأزرار الثانوية:**
```
bg-surface border border-outline-variant hover:bg-surface-variant text-on-surface
```

**الجداول:**
```
w-full text-xs border border-outline-variant rounded-xl overflow-hidden
thead: bg-surface-container text-on-surface-variant
tbody tr: hover:bg-surface-variant
```

**Badges/Tags:**
```
text-xs px-2.5 py-0.5 rounded-full font-bold border
الأخضر (نشط):    bg-emerald-100 text-emerald-900 border-emerald-300
الأزرق (معلّق):  bg-blue-100 text-blue-900 border-blue-300
الأحمر (خطأ):   bg-rose-100 text-rose-900 border-rose-300
الأصفر (تحذير): bg-amber-100 text-amber-900 border-amber-300
```

---

## نمط استهلاك البيانات في الصفحات

```javascript
// النمط القياسي لكل صفحة تعرض بيانات:
document.addEventListener('DOMContentLoaded', () => {
  const state = ERPState.load();
  renderData(state);
});

function renderData(state) {
  const container = document.getElementById('data-container');
  
  if (!state.items || state.items.length === 0) {
    container.innerHTML = '<p class="text-center text-on-surface-variant">لا توجد بيانات</p>';
    return;
  }
  
  container.innerHTML = state.items.map(item => `
    <div class="bg-surface border ...">
      ${item.name}
    </div>
  `).join('');
}
```

---

---

## معايير مكونات shadcn/ui والواجهة في Next.js (Next.js & shadcn/ui Standards)

> **تنبيه:** عند بناء تطبيق Next.js الجديد، يتم استبدال أكواد الـ HTML/Vanilla JS بمكونات **shadcn/ui** المعيارية.

### 1. تثبيت واستدعاء المكونات (Component Installation & Imports)
- **أمر التثبيت القياسي:**
  ```bash
  npx shadcn@latest add button input card dialog sheet dropdown-menu table badge form label select tabs avatar scroll-area separator tooltip popover
  ```
- **مسار الاستيراد الموحد:**
  ```tsx
  import { Button } from "@/components/ui/button";
  import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
  import { Input } from "@/components/ui/input";
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
  import { cn } from "@/lib/utils";
  ```
- **قاعدة فصل المكونات:**
  - `components/ui/`: مكونات shadcn الأولية النقية (Primitive components).
  - `components/shared/`: مكونات عامة مركبة (مثل `kpi-card.tsx`, `data-table.tsx`).
  - `components/modules/`: مكونات الأعمال التخصصية التابعة للموديولات (مثل شاشات المعالج ونماذج الباتشات).

### 2. قواعد الاتجاه العربي (RTL Best Practices with shadcn/ui)
- **اتجاه المستند:** يتم ضبط `dir="rtl"` و `lang="ar"` في جذر التطبيق (`app/layout.tsx`).
- **مكون السايدبار والأدراج (`Sheet`):**
  - استخدام `side="right"` دائماً لقائمة الموبايل حتى تنزلق من اليمين:
    ```tsx
    <SheetContent side="right" className="w-[280px]"> ... </SheetContent>
    ```
- **القوائم المنسدلة ومربعات التلميح (`DropdownMenu` & `Tooltip`):**
  - استخدام `align="start"` للتوافق مع نقطة ارتكاز الزر جهة اليمين.
- **هوامش الأيقونات مع النصوص:**
  - أيقونة قبل النص العربي: استخدام `ml-2` (تباعد يسار الأيقونة ليفصلها عن النص التالي لها يساراً).
  - أيقونة بعد النص العربي: استخدام `mr-2`.

### 3. نمط دمج الفئات الشرطية (`cn` Utility)
يتم استخدام دالة `cn` في كل مكون لتمرير فئات Tailwind بأمان ومنع تضارب الفئات:
```tsx
<Button className={cn("bg-[#012d1d] hover:bg-[#02472e] text-white font-medium", className)}>
  <Plus className="ml-2 h-4 w-4" />
  إضافة شحنة جديدة
</Button>
```

### 4. معيار بناء النماذج (Forms with shadcn + Zod)
تعتمد جميع نماذج الإدخال على تكامل `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` مع `react-hook-form` و `zod`:
```tsx
<FormField
  control={form.control}
  name="weightKg"
  render={({ field }) => (
    <FormItem>
      <FormLabel>الوزن الصافي (كجم)</FormLabel>
      <FormControl>
        <Input type="number" placeholder="أدخل الوزن بالكيلوجرام" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## الـ RTL-specific Conventions (Legacy Prototype)

- كل مسافات `margin` و`padding` تستخدم `mr` و`ml` وليس `ms` و`me`
- الـ sidebar موضعه `right-0` بدلاً من `left-0`
- `md:mr-[260px]` للمحتوى الرئيسي بدلاً من `ml`
- الاتجاه: كل شيء من اليمين للشمال

---

## جدول مقارنة جودة المعايير بين البروتوتايب والنظام الجديد:

| المعيار | البروتوتايب الحالي | نظام Next.js 14 + shadcn/ui الجديد |
|:---|:---|:---|
| **مكتبة المكونات** | Vanilla HTML + Inline CSS | **shadcn/ui (Radix UI Primitives)** |
| **إمكانية الوصول** | ضعيفة (WAI-ARIA مفقود) | **قياسية بالكامل (Full Keyboard & Screen Reader Navigation)** |
| **التحقق من المدخلات** | شروط JS بسيطة يدوية | **Zod Schemas + shadcn FormField Type-Safe** |
| **التنبيهات** | `window.showToast()` مخصصة | **Sonner Toast المتوافقة مع shadcn** |
| **TypeScript** | ❌ غير مفعل | ✅ صارم بنسبة 100% |
| **Unit / Linting** | ❌ غير متوفر | ✅ Next Lint + ESLint + Prettier |
