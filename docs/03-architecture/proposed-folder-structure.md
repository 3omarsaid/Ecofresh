# هيكل مجلدات مشروع Next.js + Supabase

## الهيكل الكامل المقترح

```
nilotic-frost-erp/        ← مشروع Next.js جديد من الصفر
│
├── 📄 package.json
├── 📄 components.json        ← ملف إعداد shadcn/ui
├── 📄 next.config.ts
├── 📄 tailwind.config.ts
├── 📄 tsconfig.json
├── 📄 .env.local           ← Supabase keys
├── 📄 .env.example
│
├── 📁 app/                 ← Next.js App Router
│   ├── 📄 layout.tsx       ← Root layout (RTL, fonts, theme)
│   ├── 📄 page.tsx         ← Redirect → /dashboard
│   │
│   ├── 📁 (auth)/          ← Route Group: صفحات بدون sidebar
│   │   ├── 📄 layout.tsx
│   │   ├── 📁 login/
│   │   │   └── 📄 page.tsx
│   │   └── 📁 forgot-password/
│   │       └── 📄 page.tsx
│   │
│   ├── 📁 (dashboard)/     ← Route Group: صفحات داخل الـ app
│   │   ├── 📄 layout.tsx   ← Sidebar + Header layout
│   │   │
│   │   ├── 📁 dashboard/
│   │   │   └── 📄 page.tsx
│   │   │
│   │   ├── 📁 customers/
│   │   │   ├── 📄 page.tsx                  ← قائمة العملاء
│   │   │   ├── 📁 new/
│   │   │   │   └── 📄 page.tsx              ← إضافة عميل
│   │   │   └── 📁 [id]/
│   │   │       ├── 📄 page.tsx              ← تفاصيل العميل
│   │   │       └── 📁 agreements/
│   │   │           └── 📄 page.tsx          ← اتفاقيات العميل
│   │   │
│   │   ├── 📁 suppliers/
│   │   │   ├── 📄 page.tsx
│   │   │   ├── 📁 new/
│   │   │   └── 📁 [id]/
│   │   │
│   │   ├── 📁 stations/
│   │   ├── 📁 contractors/
│   │   ├── 📁 products/
│   │   ├── 📁 supplies/
│   │   ├── 📁 employees/
│   │   │
│   │   ├── 📁 raw-purchases/
│   │   │   ├── 📄 page.tsx
│   │   │   ├── 📁 new/
│   │   │   └── 📁 [id]/
│   │   │
│   │   ├── 📁 packaging-purchases/
│   │   ├── 📁 finished-purchases/
│   │   │
│   │   ├── 📁 processing-operations/
│   │   │   ├── 📄 page.tsx
│   │   │   ├── 📁 new/
│   │   │   └── 📁 [id]/
│   │   │
│   │   ├── 📁 client-orders/
│   │   │   ├── 📄 page.tsx
│   │   │   ├── 📁 new/
│   │   │   └── 📁 [id]/
│   │   │
│   │   ├── 📁 shipments/
│   │   │   ├── 📄 page.tsx
│   │   │   ├── 📁 new/
│   │   │   └── 📁 [id]/
│   │   │
│   │   ├── 📁 inventory/
│   │   │   ├── 📄 page.tsx      ← مخزون الجاهز
│   │   │   ├── 📁 raw/
│   │   │   ├── 📁 supplies/
│   │   │   └── 📁 waste/
│   │   │
│   │   ├── 📁 warehouses/
│   │   │   ├── 📄 page.tsx
│   │   │   └── 📁 [id]/
│   │   │
│   │   ├── 📁 financials/
│   │   │   ├── 📄 page.tsx      ← كشوف الحسابات
│   │   │   ├── 📁 transactions/
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   └── 📁 new/
│   │   │   ├── 📁 treasury/
│   │   │   │   ├── 📄 page.tsx
│   │   │   │   └── 📁 [id]/
│   │   │   └── 📁 [partyId]/    ← كشف حساب طرف
│   │   │
│   │   └── 📁 reports/
│   │       ├── 📄 page.tsx
│   │       ├── 📁 profitability/
│   │       ├── 📁 stations/
│   │       ├── 📁 suppliers/
│   │       └── 📁 customers/
│   │
│   └── 📁 api/             ← Route Handlers
│       ├── 📁 auth/
│       │   └── 📁 callback/
│       │       └── 📄 route.ts  ← Supabase Auth callback
│       ├── 📁 export/
│       │   └── 📁 pdf/
│       │       └── 📄 route.ts  ← توليد PDF
│       └── 📁 webhooks/
│
├── 📁 actions/             ← Server Actions (Mutations)
│   ├── 📄 auth.ts
│   ├── 📄 customers.ts
│   ├── 📄 suppliers.ts
│   ├── 📄 raw-batches.ts        ← addRawMaterialArrival()
│   ├── 📄 processing.ts         ← createProcessingOperation()
│   ├── 📄 shipments.ts          ← createShipment()
│   ├── 📄 financials.ts         ← addFinancialTransaction()
│   └── 📄 transfers.ts
│
├── 📁 components/          ← React Components
│   ├── 📁 ui/              ← مكونات shadcn/ui الرسمية (Radix UI + Tailwind)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx       ← لقائمة الموبايل الجانبية (Mobile Drawer)
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── select.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── form.tsx        ← تكامل react-hook-form مع Zod
│   │   ├── label.tsx
│   │   ├── avatar.tsx
│   │   ├── scroll-area.tsx
│   │   ├── separator.tsx
│   │   ├── tooltip.tsx
│   │   └── popover.tsx
│   ├── 📁 layout/
│   │   ├── sidebar.tsx     ← مبني باستخدام ScrollArea و Separator
│   │   ├── header.tsx      ← مبني باستخدام DropdownMenu و Avatar
│   │   ├── mobile-nav.tsx  ← مبني باستخدام Sheet
│   │   └── breadcrumb.tsx  ← مكونات مسار التنقل
│   ├── 📁 modules/         ← Per-module components
│   │   ├── 📁 inventory/
│   │   ├── 📁 shipments/
│   │   ├── 📁 financials/
│   │   └── ...
│   └── 📁 shared/
│       ├── data-table.tsx  ← TanStack Table مغلف بمكونات Table الخاصة بـ shadcn
│       ├── kpi-card.tsx    ← كروت المؤشرات مبنية على Card الخاصة بـ shadcn
│       ├── toast.tsx       ← Sonner Toast
│       └── audit-log.tsx
│
├── 📁 lib/                 ← Utilities
│   ├── 📄 supabase/
│   │   ├── client.ts       ← Browser client
│   │   ├── server.ts       ← Server client
│   │   └── middleware.ts   ← Auth middleware
│   ├── 📄 validations/     ← Zod schemas
│   │   ├── shipment.ts
│   │   ├── processing.ts
│   │   └── ...
│   ├── 📄 utils.ts         ← دالة cn() المعتمدة لدمج فئات Tailwind و clsx في shadcn
│   └── 📄 constants.ts     ← مفاتيح ثابتة (أنواع القيود، الأوضاع، ...)
│
├── 📁 types/               ← TypeScript types
│   ├── 📄 database.ts      ← Auto-generated من Supabase CLI
│   ├── 📄 business.ts      ← Business types
│   └── 📄 api.ts
│
├── 📁 supabase/            ← Supabase local development
│   ├── 📁 migrations/      ← SQL migration files
│   ├── 📁 functions/       ← Edge Functions
│   └── 📄 config.toml
│
└── 📁 public/
    ├── 📁 fonts/
    └── 📁 images/
```

---

## قواعد التنظيم

| القاعدة | التفاصيل |
|--------|---------|
| **Server by default** | كل component افتراضياً Server Component إلا إذا احتاج interactivity |
| **`"use client"` فقط للضرورة** | Forms، modals، toast، أي component بـ event handlers |
| **shadcn/ui via CLI** | تثبيت وتحديث مكونات الواجهة عبر `npx shadcn@latest add <component>` مع ضبط دعم RTL |
| **Server Actions في `/actions/`** | كل mutation يذهب لـ Server Action — ليس Route Handler |
| **Route Handlers محدودة** | فقط: PDF export, webhooks, Supabase auth callback |
| **Zod في كل مكان** | كل Server Action له schema validation قبل أي database operation |
| **Types auto-generated** | `supabase gen types typescript` يولّد types من الـ schema تلقائياً |
