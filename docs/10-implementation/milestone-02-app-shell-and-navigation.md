# Milestone 02: هيكل التطبيق والسايدبار والهيدر الموحد (App Shell & Navigation)

> **المرحلة 02 من 26** — ضمن المرحلة الكبرى الأولى: التأسيس والبنية التحتية
> **بوابة الفحص المرتبطة:** جزء من **🛑 Major Checkpoint 1**

---

## 1. الهدف الاستراتيجي
بناء الهيكل الإداري الكامل للتطبيق (App Shell) الداعم للغة العربية واتجاه اليمين إلى اليسار (`dir="rtl"`) مع السايدبار الموحد الحاوي للأقسام التشغيلية الستة، والهيدر العلوي، والمسار التفصيلي (Breadcrumbs)، والقائمة المتنقلة للأجهزة الذكية، وتطبيق هوية ألوان Nilotic Frost (`#012d1d`).

---

## 2. الربط المرجعي بالبروتوتايب الحالي
- **الشاشات المرجعية:**
  - هيكل التنقل العام: [`base_prototype/index.html`](file:///e:/web/exporting_erp/base_prototype/index.html)
- **منطق الكود في البروتوتايب:**
  - محرك توليد القوائم: [`base_prototype/js/navigation.js` Lines 1-250](file:///e:/web/exporting_erp/base_prototype/js/navigation.js#L1-L250) (`menuConfig`, `renderSidebar`, `pageTitleMap`).
  - هوية الألوان وخط الطباعة: [`base_prototype/index.html` Lines 15-30](file:///e:/web/exporting_erp/base_prototype/index.html#L15-L30) (لون الـ primary `#012d1d` وخط `IBM Plex Sans Arabic`).

---

## 3. المتطلبات المسبقة (Prerequisites)
- اكتمال **Milestone 01** (المصادقة والمستخدم المسجل متوفر).

---

## 4. نطاق الواجهة والمكونات (UI Scope & shadcn/ui)

### أ. تثبيت مكونات shadcn/ui للـ App Shell:
```bash
npx shadcn@latest add sheet avatar dropdown-menu scroll-area separator breadcrumb tooltip
```

### ب. الملفات المطلوبة:
```
nilotic-frost-erp/
├── app/
│   ├── layout.tsx                    # إعداد lang="ar" و dir="rtl" وخط IBM Plex Sans
│   └── (dashboard)/
│       ├── layout.tsx                # App Shell: السايدبار + الهيدر + محتوى الصفحة
│       └── dashboard/
│           └── page.tsx              # الصفحة الافتراضية
├── components/
│   ├── ui/                           # مكونات shadcn: sheet, avatar, dropdown-menu, scroll-area, separator, breadcrumb
│   └── layout/
│       ├── sidebar.tsx               # القائمة الجانبية الموحدة (260px) باستخدام ScrollArea و Separator
│       ├── header.tsx                # الشريط العلوي باستخدام DropdownMenu و Avatar
│       ├── mobile-nav.tsx            # درج القائمة للموبايل باستخدام Sheet (side="right")
│       └── breadcrumbs.tsx           # المسار التفصيلي التلقائي باستخدام Breadcrumb
└── config/
    └── navigation.ts                 # مصفوفة الروابط الـ 6 المستخرجة من navigation.js
```

### ج. توزيع أدوار مكونات shadcn في الهيكل الإداري:
- **`Sheet (side="right")`:** قائمة الموبايل تنزلق بنعومة من اليمين مع تظليل الخلفية عند النقر على زر القائمة في الشاشات الصغيرة.
- **`ScrollArea`:** تغليف قائمة السايدبار لمنح تجربة تمرير أنيقة للروابط الـ 20 دون ظهور أشرطة تمرير المتصفح الافتراضية المشوهة.
- **`DropdownMenu` & `Avatar`:** قائمة حساب المستخدم في الهيدر لعرض بيانات الدور والمحطة وزر تسجيل الخروج.
- **`Breadcrumb`:** شريط مسار التنقل الديناميكي أعلى كل صفحة لسهولة العودة للمستويات السابقة.

### الأقسام الستة بالقائمة الجانبية (من `navigation.js`):
1. **الرئيسية واللوحات:**
   - لوحة القيادة التنفيذية (`/dashboard`)
   - لوحة قيادة المخزون (`/dashboard/inventory`)
2. **البيانات الأساسية:**
   - دليل العملاء (`/customers`)
   - دليل الموردين (`/suppliers`)
   - المحطات والمخازن (`/stations`)
   - مقاولو العمالة والتشغيل (`/contractors`)
   - كتالوج المنتجات (`/products`)
   - المستلزمات والكراتين (`/supplies`)
3. **العمليات والتشغيل:**
   - وارد المواد الخام (`/raw-purchases`)
   - مشتريات المستلزمات (`/packaging-purchases`)
   - صفقات البضاعة الجاهزة (`/finished-purchases`)
   - طلبيات العملاء (`/client-orders`)
   - عمليات التدوير والإنتاج (`/processing-operations`)
   - الشحنات والتصدير (`/shipments`)
4. **المخزون والمحطات:**
   - مخزن المنتج الجاهز (`/inventory`)
   - مخزن المواد الخام (`/inventory/raw`)
   - التحويلات بين المحطات (`/inventory/transfers`)
   - مركز مراقبة الهالك (`/inventory/waste`)
5. **الماليات والتحصيلات:**
   - كشف الحسابات العام (`/financials`)
   - سندات الدفع والتحصيل (`/financials/transactions`)
   - الخزينة والحسابات البنكية (`/financials/treasury`)
6. **التقارير والتحليلات:**
   - مركز التقارير (`/reports`)
   - تقرير ربحية الشحنات (`/reports/profitability`)
   - تقرير مراقبة المحطات (`/reports/stations`)

---

## 5. كود مصفوفة القائمة (`config/navigation.ts`)

```ts
import {
  LayoutDashboard,
  Users,
  Truck,
  Building2,
  HardHat,
  Package,
  Boxes,
  Scale,
  ShoppingBag,
  CheckSquare,
  ClipboardList,
  Factory,
  Ship,
  Warehouse,
  ArrowRightLeft,
  Trash2,
  Receipt,
  Wallet,
  Landmark,
  BarChart3,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'الرئيسية واللوحات',
    items: [
      { title: 'لوحة التحكم التنفيذية', href: '/dashboard', icon: LayoutDashboard },
      { title: 'لوحة قيادة المخزون', href: '/dashboard/inventory', icon: Warehouse },
    ],
  },
  {
    title: 'البيانات الأساسية',
    items: [
      { title: 'دليل عملاء التصدير', href: '/customers', icon: Users },
      { title: 'دليل الموردين', href: '/suppliers', icon: Truck },
      { title: 'المحطات والمخازن', href: '/stations', icon: Building2 },
      { title: 'مقاولو العمالة', href: '/contractors', icon: HardHat },
      { title: 'كتالوج المنتجات', href: '/products', icon: Package },
      { title: 'المستلزمات والكراتين', href: '/supplies', icon: Boxes },
    ],
  },
  {
    title: 'العمليات والتشغيل',
    items: [
      { title: 'وارد المواد الخام', href: '/raw-purchases', icon: Scale },
      { title: 'مشتريات المستلزمات', href: '/packaging-purchases', icon: ShoppingBag },
      { title: 'صفقات بضاعة جاهزة', href: '/finished-purchases', icon: CheckSquare },
      { title: 'طلبيات التصدير', href: '/client-orders', icon: ClipboardList },
      { title: 'عمليات التدوير والإنتاج', href: '/processing-operations', icon: Factory },
      { title: 'الشحنات والتصدير', href: '/shipments', icon: Ship },
    ],
  },
  {
    title: 'المخزون والمحطات',
    items: [
      { title: 'مخزن المنتج الجاهز', href: '/inventory', icon: Package },
      { title: 'مخزن المواد الخام', href: '/inventory/raw', icon: Boxes },
      { title: 'التحويل بين المحطات', href: '/inventory/transfers', icon: ArrowRightLeft },
      { title: 'مراقبة وتكاليف الهالك', href: '/inventory/waste', icon: Trash2 },
    ],
  },
  {
    title: 'الماليات والتحصيلات',
    items: [
      { title: 'كشف الحسابات العام', href: '/financials', icon: Receipt },
      { title: 'سندات الدفع والتحصيل', href: '/financials/transactions', icon: Wallet },
      { title: 'الخزينة والحسابات البنكية', href: '/financials/treasury', icon: Landmark },
    ],
  },
  {
    title: 'التقارير والتحليلات',
    items: [
      { title: 'مركز التقارير الموحد', href: '/reports', icon: BarChart3 },
      { title: 'ربحية الشحنات', href: '/reports/profitability', icon: BarChart3 },
      { title: 'مراقبة كفاءة المحطات', href: '/reports/stations', icon: Building2 },
    ],
  },
];
```

---

## 6. نقطة التفتيش والاختبار (Check Point 02)
1. **اختبار الواجهة المتجاوبة ومكون Sheet:**
   - فتح التطبيق وتأكيد ظهور السايدبار بعرض 260px على الشاشات الكبيرة، واختفائه وتحوله إلى زر Hamburger Menu على شاشات الهواتف.
   - فتح القائمة على الموبايل والتأكد من انزلاق الـ Sheet بنعومة من اليمين (`side="right"`).
2. **اختبار تمييز الرابط النشط وقائمة التمرير ScrollArea:**
   - الضغط على رابط `/customers` والتأكد من تظليله بخلفية خضراء داكنة `#012d1d` مع كتابة بيضاء.
   - التأكد من إمكانية التمرير بسلاسة داخل السايدبار عبر `ScrollArea`.
3. **اختبار بيانات المستخدم بالهيدر وقائمة DropdownMenu:**
   - التأكد من قراءة اسم المستخدم الحالي ورتبته (`Admin`) وعرض أول حرفين كـ `Avatar` في أعلى اليسار.
   - النقر على الـ Avatar والتأكد من فتح `DropdownMenu` بخيارات الملف الشخصي والمحطة وتسجيل الخروج.

---

## 7. شروط الاكتمال (Definition of Done)
- [ ] الهيكل الموحد يعمل على جميع مسارات `(dashboard)` بنظام RTL.
- [ ] دمج مكونات shadcn/ui (Sheet, Avatar, DropdownMenu, ScrollArea, Separator, Breadcrumb) بنجاح.
- [ ] السايدبار يعرض الروابط الـ 20 كاملة دون أي رابط مكسور.
- [ ] مسار الـ Breadcrumbs يتغير تلقائياً مع تغير المسار في المتصفح.
- [ ] اجتياز **🛑 Major Checkpoint 1** بالكامل.
