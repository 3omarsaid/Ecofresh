# هيكل المجلدات — Nilotic Frost ERP

## الهيكل الكامل للمستودع

```
exporting_erp/
├── 📄 PROJECT.md                     # وصف المشروع، الـ Features والـ Milestones
├── 📄 ORIGINAL_REQUEST.md            # المتطلبات الأصلية التي بُني عليها البروتوتايب
├── 📄 HANDOVER_STATUS.md             # سجل مراجعة اكتمال الشاشات والروابط
├── 📄 audit_details.json             # تفاصيل تدقيق الروابط (711 رابط، 0 مكسور)
├── 📄 prototype_inspection.json      # نتائج فحص البروتوتايب
├── 📄 apply_shell.py                 # سكريبت مساعد
├── 📄 update_menu.py                 # سكريبت تحديث القائمة
│
├── 📁 base_prototype/                # ← النسخة الرئيسية والأحدث (هذه هي المرجع)
│   ├── 📄 index.html                 # الصفحة الرئيسية (Dashboard)
│   ├── 📁 pages/                     # 59 صفحة HTML
│   │   ├── 📄 [كل شاشات النظام]
│   ├── 📁 js/
│   │   ├── 📄 state.js               # قلب النظام: البيانات + المنطق + RBAC
│   │   ├── 📄 navigation.js          # محرك Sidebar + Header الموحد
│   │   ├── 📄 interactions.js        # Toast + Tabs + Search + Forms
│   │   └── 📄 app.js                 # ملف placeholder (شبه فارغ)
│   └── 📁 css/
│       ├── 📄 global.css             # RTL + body styles
│       └── 📄 custom.css             # custom overrides
│
├── 📁 bussnislogic_prototype/        # نسخة تطوير قديمة/تجريبية
│   ├── 📄 [HTML pages متعددة]       # نسخ بديلة من الشاشات
│   ├── 📄 [Python scripts]           # سكريبتات sync الـ sidebars
│   ├── 📁 _1/ ... _9/               # مجلدات نسخ متعددة
│   └── 📁 glacier_ledger/
│       └── 📄 DESIGN.md             # مواصفات تصميم المحاسبة
│
└── 📁 docs/                          # ← مجلد التوثيق الشامل (هذا الملف)
    ├── 📁 00-overview/
    ├── 📁 01-business/
    ├── 📁 02-analysis/
    ├── 📁 03-architecture/
    ├── 📁 04-database/
    ├── 📁 05-api/
    ├── 📁 06-development/
    ├── 📁 07-deployment/
    ├── 📁 08-ai/
    ├── 📁 09-ui-contracts/
    ├── 📁 10-implementation/
    ├── 📄 CHANGELOG.md
    └── 📄 CLIENT_USER_MANUAL.md
```

---

## تفاصيل مجلد `base_prototype/pages/`

### تصنيف الصفحات حسب الموديول

```
pages/
│
├── 🟢 Dashboard
│   ├── dashboard-executive.html      # لوحة القيادة التنفيذية
│   └── dashboard-inventory.html      # لوحة مخزون
│
├── 🟢 Master Data — Products
│   ├── products.html                  # كتالوج المنتجات
│   ├── product-add.html               # إضافة منتج
│   └── product-details.html           # تفاصيل المنتج
│
├── 🟢 Master Data — Supplies
│   ├── supplies.html                  # المستلزمات والكراتين
│   ├── supply-add.html                # إضافة مستلزم
│   ├── cartons.html                   # قائمة الكراتين
│   └── carton-add.html                # إضافة كرتونة
│
├── 🟢 Master Data — Customers
│   ├── customers.html                 # دليل العملاء
│   ├── customer-add.html              # إضافة عميل
│   ├── customer-details.html          # تفاصيل العميل
│   ├── customer-agreements.html       # الاتفاقيات
│   └── customer-product-add.html      # إضافة اتفاقية منتج
│
├── 🟢 Master Data — Suppliers
│   ├── suppliers.html                 # دليل الموردين
│   ├── supplier-add.html              # إضافة مورد
│   ├── supplier-details.html          # تفاصيل المورد
│   └── supplier-product-add.html      # إضافة منتجات المورد
│
├── 🟢 Master Data — Stations
│   ├── stations.html                  # المحطات
│   ├── station-add.html               # إضافة محطة
│   └── station-details.html           # تفاصيل المحطة
│
├── 🟢 Master Data — Contractors
│   ├── contractors.html               # المقاولون
│   ├── contractor-add.html            # إضافة مقاول
│   └── contractor-details.html        # تفاصيل المقاول
│
├── 🟢 Master Data — Employees
│   └── employees.html                 # قائمة الموظفين
│
├── 🟡 Operations
│   ├── raw-purchases.html             # مشتريات الخام
│   ├── raw-arrival-add.html           # تسجيل وارد خام
│   ├── raw-purchase-details.html      # تفاصيل وارد الخام
│   ├── packaging-purchases.html       # مشتريات المستلزمات
│   ├── supplies-arrival-add.html      # تسجيل وارد مستلزمات
│   ├── finished-purchases.html        # البضاعة الجاهزة (صفقات)
│   ├── client-orders.html             # طلبيات العملاء
│   ├── processing-operations.html     # ← FULL CRUD + RBAC
│   ├── shipments.html                 # سجل الشحنات
│   ├── shipment-create.html           # ← تنفيذ شحنة جديدة
│   └── shipment-details.html          # تفاصيل الشحنة
│
├── 🟡 Inventory & Traceability
│   ├── inventory.html                 # ← مخزون الجاهز (FULL)
│   ├── raw-materials.html             # مخزون الخام
│   ├── inventory-raw.html             # (جزئي)
│   ├── inventory-supplies.html        # (جزئي)
│   ├── inventory-cartons.html         # (جزئي)
│   ├── warehouses.html                # المخازن
│   ├── warehouse-details.html         # تفاصيل المخزن
│   ├── stock-movements.html           # حركات المخزون (جزئي)
│   ├── lot-details.html               # تفاصيل اللوط (جزئي)
│   └── waste-monitoring.html          # مراقبة الهالك (جزئي)
│
├── 🟢 Financials
│   ├── financial-statements.html      # ← كشوف الحسابات (FULL)
│   ├── party-statement-details.html   # تفاصيل كشف حساب طرف
│   ├── payments-collections.html      # المدفوعات والتحصيلات
│   ├── add-transaction.html           # إضافة حركة مالية
│   ├── payment-details.html           # تفاصيل حركة
│   ├── treasury-banks.html            # الخزينة والبنوك
│   └── treasury-account-details.html  # تفاصيل حساب
│
└── 🟡 Reports
    ├── reports.html                   # مركز التقارير
    ├── shipment-profitability.html    # ربحية الشحنات (جزئي)
    ├── station-monitoring.html        # مراقبة المحطات (جزئي)
    ├── supplier-report.html           # تقرير الموردين (جزئي)
    └── customer-report.html           # تقرير العملاء (جزئي)
```

---

## دور كل ملف JavaScript

| الملف | الدور | يُحمَّل متى؟ |
|------|-------|------------|
| `state.js` | قلب البيانات والمنطق | `<script>` بدون defer — أولاً |
| `navigation.js` | بناء sidebar + header | `defer` — بعد HTML |
| `interactions.js` | toast + tabs + search | `defer` — بعد HTML |
| `app.js` | placeholder فارغ | `defer` |
| inline `<script>` في كل صفحة | منطق الصفحة الخاص | آخر الصفحة |

---

## ملاحظة على `bussnislogic_prototype/`

يحتوي على:
- **HTML pages متعددة:** نسخ أقدم من بعض الشاشات
- **Python scripts:** أدوات مساعدة لمزامنة الـ sidebars بين الصفحات (كانت تُستخدم قبل توحيد navigation.js)
- **مجلدات _1 إلى _9:** snapshots متعددة من مراحل التطوير

> **هذا المجلد للأرشفة فقط. المرجع الرسمي هو `base_prototype/`**
