// Nilotic Frost ERP — Universal Navigation & Router Engine (Unified Enterprise Architecture)
document.addEventListener('DOMContentLoaded', () => {
  const isRoot = !window.location.pathname.includes('/pages/');
  const rootPath = isRoot ? './' : '../';
  const pagesPath = isRoot ? './pages/' : './';
  const rawPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentPage = rawPage.split('?')[0].split('#')[0] || 'index.html';

  // Menu Structure (Logically Organized across 6 Categories)
  const menuStructure = [
    {
      category: 'لوحة التحكم',
      items: [
        { name: 'الرئيسية (لوحة التحكم)', icon: 'dashboard', href: isRoot ? 'index.html' : '../index.html', key: 'index.html' },
        { name: 'لوحة القيادة التنفيذية', icon: 'monitoring', href: `${pagesPath}dashboard-executive.html`, key: 'dashboard-executive.html' }
      ]
    },
    {
      category: 'البيانات الأساسية',
      items: [
        { name: 'إدارة المنتجات', icon: 'nutrition', href: `${pagesPath}products.html`, key: 'products.html' },
        { name: 'إدارة المستلزمات والكراتين', icon: 'inventory_2', href: `${pagesPath}supplies.html`, key: 'supplies.html' },
        { name: 'العملاء والاتفاقيات', icon: 'groups', href: `${pagesPath}customers.html`, key: 'customers.html' },
        { name: 'إدارة الموردين', icon: 'local_shipping', href: `${pagesPath}suppliers.html`, key: 'suppliers.html' },
        { name: 'المحطات والمخازن', icon: 'factory', href: `${pagesPath}stations.html`, key: 'stations.html' },
        { name: 'المقاولون والعمالة', icon: 'badge', href: `${pagesPath}contractors.html`, key: 'contractors.html' },
        { name: 'إدارة الموظفين', icon: 'badge', href: `${pagesPath}employees.html`, key: 'employees.html' }
      ]
    },
    {
      category: 'العمليات والتشغيل',
      items: [
        { name: 'طلبيات العملاء', icon: 'receipt_long', href: `${pagesPath}client-orders.html`, key: 'client-orders.html' },
        { name: 'عمليات التدوير والإنتاج', icon: 'autorenew', href: `${pagesPath}processing-operations.html`, key: 'processing-operations.html' },
        { name: 'الشحنات والتصدير', icon: 'conveyor_belt', href: `${pagesPath}shipments.html`, key: 'shipments.html' },
        { name: 'وارد بضاعة جاهزة (صفقات)', icon: 'local_offer', href: `${pagesPath}finished-purchases.html`, key: 'finished-purchases.html' },
        { name: 'وارد المواد الخام', icon: 'shopping_cart', href: `${pagesPath}raw-purchases.html`, key: 'raw-purchases.html' },
        { name: 'وارد المستلزمات', icon: 'inventory', href: `${pagesPath}packaging-purchases.html`, key: 'packaging-purchases.html' }
      ]
    },
    {
      category: 'المخزون والتتبع',
      items: [
        { name: 'مخزون المنتج الجاهز (Batches)', icon: 'inventory', href: `${pagesPath}inventory.html`, key: 'inventory.html' },
        { name: 'مخزون المواد الخام (Raw Lots)', icon: 'warehouse', href: `${pagesPath}raw-materials.html`, key: 'raw-materials.html' },
        { name: 'مخزون المستلزمات والكراتين', icon: 'inventory_2', href: `${pagesPath}supplies.html`, key: 'supplies.html' },
        { name: 'المخازن والمحطات المركزية', icon: 'store', href: `${pagesPath}warehouses.html`, key: 'warehouses.html' },
        { name: 'مراقبة الهالك والتتبع 360°', icon: 'delete_history', href: `${pagesPath}waste-monitoring.html`, key: 'waste-monitoring.html' }
      ]
    },
    {
      category: 'الماليات والتحصيلات',
      items: [
        { name: 'كشوف الحسابات المركزية', icon: 'receipt_long', href: `${pagesPath}financial-statements.html`, key: 'financial-statements.html' },
        { name: 'المدفوعات والتحصيلات', icon: 'account_balance_wallet', href: `${pagesPath}payments-collections.html`, key: 'payments-collections.html' },
        { name: 'الخزينة والبنوك', icon: 'account_balance', href: `${pagesPath}treasury-banks.html`, key: 'treasury-banks.html' }
      ]
    },
    {
      category: 'التقارير التحليلية',
      items: [
        { name: 'مركز التقارير والتحليلات', icon: 'analytics', href: `${pagesPath}reports.html`, key: 'reports.html' }
      ]
    }
  ];

  // Map sub-pages to their parent sidebar key
  const parentMenuMap = {
    'dashboard-executive.html': 'dashboard-executive.html',
    'dashboard-inventory.html': 'inventory.html',
    'product-add.html': 'products.html',
    'product-details.html': 'products.html',
    'supply-add.html': 'supplies.html',
    'carton-add.html': 'supplies.html',
    'cartons.html': 'supplies.html',
    'supplies.html': 'supplies.html',
    'customer-add.html': 'customers.html',
    'customer-details.html': 'customers.html',
    'customer-agreements.html': 'customers.html',
    'customer-product-add.html': 'customers.html',
    'customer-report.html': 'financial-statements.html',
    'supplier-add.html': 'suppliers.html',
    'supplier-details.html': 'suppliers.html',
    'supplier-product-add.html': 'suppliers.html',
    'supplier-report.html': 'financial-statements.html',
    'station-add.html': 'stations.html',
    'station-details.html': 'stations.html',
    'station-monitoring.html': 'stations.html',
    'contractor-add.html': 'contractors.html',
    'contractor-details.html': 'contractors.html',
    'employees.html': 'employees.html',
    'client-orders.html': 'client-orders.html',
    'processing-operations.html': 'processing-operations.html',
    'finished-purchases.html': 'finished-purchases.html',
    'raw-purchases.html': 'raw-purchases.html',
    'raw-arrival-add.html': 'raw-purchases.html',
    'raw-purchase-details.html': 'raw-purchases.html',
    'packaging-purchases.html': 'packaging-purchases.html',
    'supplies-arrival-add.html': 'packaging-purchases.html',
    'shipments.html': 'shipments.html',
    'shipment-create.html': 'shipments.html',
    'shipment-details.html': 'shipments.html',
    'shipment-profitability.html': 'reports.html',
    'inventory.html': 'inventory.html',
    'raw-materials.html': 'raw-materials.html',
    'inventory-raw.html': 'raw-materials.html',
    'inventory-supplies.html': 'supplies.html',
    'inventory-cartons.html': 'supplies.html',
    'warehouses.html': 'warehouses.html',
    'stock-movements.html': 'warehouses.html',
    'warehouse-details.html': 'warehouses.html',
    'lot-details.html': 'inventory.html',
    'financial-statements.html': 'financial-statements.html',
    'add-transaction.html': 'financial-statements.html',
    'party-statement-details.html': 'financial-statements.html',
    'payments-collections.html': 'payments-collections.html',
    'payment-details.html': 'payments-collections.html',
    'treasury-banks.html': 'treasury-banks.html',
    'treasury-account-details.html': 'treasury-banks.html',
    'reports.html': 'reports.html'
  };

  // Map page keys to exact header title
  const pageTitleMap = {
    'index.html': 'الرئيسية (لوحة التحكم)',
    'dashboard-executive.html': 'لوحة القيادة التنفيذية',
    'dashboard-inventory.html': 'لوحة قيادة المخزون',
    'products.html': 'إدارة المنتجات والبيانات الأساسية',
    'product-add.html': 'إضافة منتج جديد',
    'product-details.html': 'تفاصيل المنتج والمخزون',
    'supplies.html': 'إدارة المستلزمات والتعبئة',
    'supply-add.html': 'إضافة مستلزم جديد',
    'carton-add.html': 'إضافة كرتونة تصدير',
    'cartons.html': 'المستلزمات والكراتين',
    'client-orders.html': 'العملاء والاتفاقيات والطلبيات',
    'customers.html': 'دليل العملاء والاتفاقيات التجارية',
    'customer-add.html': 'إضافة عميل جديد',
    'customer-details.html': 'تفاصيل بروفايل العميل',
    'customer-agreements.html': 'اتفاقيات وعقود العملاء',
    'customer-product-add.html': 'إضافة اتفاقية منتج للعميل',
    'customer-report.html': 'تقرير كشف حساب العميل',
    'suppliers.html': 'دليل الموردين والتوريدات',
    'supplier-add.html': 'إضافة مورد جديد',
    'supplier-details.html': 'الملف الكامل للمورد',
    'supplier-product-add.html': 'إضافة منتجات المورد',
    'supplier-report.html': 'تقرير كشف حساب المورد',
    'stations.html': 'إدارة وتدقيق المحطات والمخازن',
    'station-add.html': 'إضافة محطة جديدة',
    'station-details.html': 'الملف التشغيلي الكامل للمحطة',
    'station-monitoring.html': 'مراقبة تشغيل المحطات',
    'contractors.html': 'دليل وحسابات المقاولين',
    'contractor-add.html': 'إضافة مقاول جديد',
    'contractor-details.html': 'البروفايل التشغيلي للمقاول',
    'employees.html': 'إدارة الموظفين والعمالة',
    'finished-purchases.html': 'وارد البضاعة الجاهزة والصفقات (Direct Purchases)',
    'raw-purchases.html': 'وارد المواد الخام وتتبع الرصيد',
    'raw-arrival-add.html': 'تسجيل وارد خام جديد',
    'raw-purchase-details.html': 'تفاصيل وارد الخام والتتبع',
    'packaging-purchases.html': 'وارد المستلزمات والكراتين',
    'supplies-arrival-add.html': 'تسجيل استلام مستلزمات',
    'processing-operations.html': 'عمليات التدوير والإنتاج',
    'shipments.html': 'الشحنات والتشغيل اليومي',
    'shipment-create.html': 'إنشاء شحنة تصدير جديدة',
    'shipment-details.html': 'تفاصيل الشحنة والتشغيل',
    'shipment-profitability.html': 'تقرير ربحية الشحنات التصديرية',
    'inventory.html': 'مخزن المنتج الجاهز واللوطات (Finished Goods Batches)',
    'inventory-raw.html': 'مخزن المواد الخام وأرصدة الموردين',
    'inventory-supplies.html': 'مخزون المستلزمات والتعبئة',
    'inventory-cartons.html': 'مخزون كراتين التصدير',
    'warehouses.html': 'إدارة ومراقبة المخازن المركزية',
    'warehouse-details.html': 'تفاصيل وسجل حركة المخزن',
    'lot-details.html': 'تفاصيل اللوط والتتبع',
    'waste-monitoring.html': 'مراقبة الهالك والتتبع الشامل 360°',
    'financial-statements.html': 'كشوف الحسابات المركزية',
    'add-transaction.html': 'إضافة حركة مالية جديدة',
    'party-statement-details.html': 'تفاصيل كشف الحساب التفصيلي',
    'payments-collections.html': 'المدفوعات والتحصيلات المركزية',
    'payment-details.html': 'تفاصيل الحركة المالية',
    'treasury-banks.html': 'الخزينة والبنوك ومراقبة السيولة',
    'treasury-account-details.html': 'سجل حركات حساب الخزينة/البنك',
    'reports.html': 'مركز التقارير والتحليلات الموحد'
  };

  const activeKey = parentMenuMap[currentPage] || currentPage;
  const activeTitle = pageTitleMap[currentPage] || 'نظام التصدير المصري';

  // 1. Remove any legacy top navbar elements
  document.querySelectorAll('nav.fixed.top-0, nav.sticky.top-0, nav.md\\:hidden, header:not(#app-header)').forEach(el => {
    if (!el.closest('aside')) {
      el.remove();
    }
  });

  // 2. Standardize Top Header (<header id="app-header">)
  let header = document.getElementById('app-header');
  if (!header) {
    header = document.createElement('header');
    header.id = 'app-header';
    document.body.insertBefore(header, document.body.firstChild);
  }

  header.className = 'bg-surface border-b border-outline-variant shadow-sm flex items-center justify-between w-full px-4 py-3 md:px-6 h-16 z-40 fixed top-0 right-0 left-0 md:pr-[260px]';
  header.innerHTML = `
    <div class="flex items-center gap-3 md:gap-4">
      <button class="md:hidden p-2 rounded-lg hover:bg-surface-variant text-on-surface flex items-center justify-center transition-colors" data-sidebar-toggle title="القائمة الرئيسية">
        <span class="material-symbols-outlined text-[24px]">menu</span>
      </button>
      <div class="flex items-center gap-2 md:gap-3">
        <span class="font-bold text-base md:text-lg text-primary">${activeTitle}</span>
        <span class="hidden sm:inline-block text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">مراقبة وتتبع 360°</span>
      </div>
    </div>
    <div class="flex items-center gap-2 md:gap-3">
      <div class="relative hidden sm:block w-48 md:w-64">
        <input type="search" placeholder="بحث شامل في النظام..." class="w-full bg-surface-variant/40 border border-outline-variant rounded-lg pr-9 pl-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary transition-all">
        <span class="material-symbols-outlined text-outline text-[18px] absolute right-2.5 top-2 pointer-events-none">search</span>
      </div>
      <a href="${pagesPath}shipment-create.html" class="hidden lg:inline-flex items-center gap-1.5 bg-primary text-white text-xs px-3.5 py-2 rounded-lg font-bold hover:bg-primary-container transition-all shadow-sm">
        <span class="material-symbols-outlined text-[18px]">add_circle</span>
        إنشاء شحنة
      </a>
      <button class="p-2 rounded-lg hover:bg-surface-variant text-on-surface relative transition-colors" title="التنبيهات">
        <span class="material-symbols-outlined text-[20px]">notifications</span>
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
      </button>
      <div class="flex items-center gap-2 border-r border-outline-variant pr-3 mr-1">
        <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm">
          م
        </div>
        <div class="hidden xl:flex flex-col text-right">
          <span class="text-xs font-bold text-on-surface">مدير النظام</span>
          <span class="text-[10px] text-outline">إدارة التصدير</span>
        </div>
      </div>
    </div>
  `;

  // 3. Standardize Sidebar (<aside id="app-sidebar">)
  let sidebar = document.querySelector('aside');
  if (!sidebar) {
    sidebar = document.createElement('aside');
    document.body.appendChild(sidebar);
  }
  sidebar.id = 'app-sidebar';
  sidebar.className = 'fixed right-0 top-0 h-full w-[260px] bg-surface border-l border-outline-variant flex flex-col z-50 overflow-y-auto shadow-md transition-transform duration-300 transform translate-x-full md:translate-x-0';
  
  sidebar.innerHTML = `
    <div class="p-4 border-b border-outline-variant flex flex-col gap-3 shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center font-bold shadow-sm text-sm">NF</div>
          <div>
            <h1 class="font-bold text-primary text-base leading-tight">نظام التصدير</h1>
            <p class="text-[11px] text-on-surface-variant font-medium">Nilotic Frost ERP</p>
          </div>
        </div>
        <button class="md:hidden p-1 text-on-surface hover:text-primary rounded-lg" data-sidebar-close title="إغلاق القائمة">
          <span class="material-symbols-outlined text-[22px]">close</span>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <a href="${pagesPath}processing-operations.html" class="bg-surface-variant hover:bg-outline-variant text-on-surface rounded-lg py-1.5 px-2 text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm border border-outline-variant/60">
          <span class="material-symbols-outlined text-[15px] text-primary">autorenew</span>
          عملية تدوير
        </a>
        <a href="${pagesPath}shipment-create.html" class="bg-primary text-white rounded-lg py-1.5 px-2 text-[11px] font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-1 shadow-sm">
          <span class="material-symbols-outlined text-[15px]">add_circle</span>
          إنشاء شحنة
        </a>
      </div>
    </div>
    <nav class="flex-1 p-3 flex flex-col gap-1 text-sm overflow-y-auto">
      ${menuStructure.map(cat => `
        <div class="text-[11px] font-bold text-outline uppercase px-3 pt-3 pb-1 tracking-wider opacity-80">${cat.category}</div>
        ${cat.items.map(item => {
          const isActive = activeKey === item.key || (activeKey === '' && item.key === 'index.html');
          const activeClasses = isActive 
            ? 'text-primary font-bold border-r-4 border-primary bg-primary/10 shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-variant hover:text-primary';
          return `
            <a href="${item.href}" class="nav-item flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out text-xs font-semibold ${activeClasses}">
              <span class="material-symbols-outlined text-[19px]">${item.icon}</span>
              <span>${item.name}</span>
            </a>
          `;
        }).join('')}
      `).join('')}
    </nav>
  `;

  // 4. Standardize Main Container (<main>)
  const main = document.querySelector('main');
  if (main) {
    main.className = 'flex-1 w-full md:w-[calc(100%-260px)] md:mr-[260px] pt-16 min-h-screen flex flex-col p-4 md:p-6 space-y-6 overflow-x-hidden box-border';
  }

  // 5. Mobile Sidebar Toggle & Backdrop Drawer Engine
  let backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'sidebar-backdrop';
    backdrop.className = 'fixed inset-0 bg-black/40 z-45 hidden md:!hidden transition-opacity duration-300';
    document.body.appendChild(backdrop);
  }

  const openSidebar = () => {
    if (sidebar) {
      sidebar.classList.remove('translate-x-full');
      backdrop.classList.remove('hidden');
    }
  };

  const closeSidebar = () => {
    if (sidebar) {
      sidebar.classList.add('translate-x-full');
      backdrop.classList.add('hidden');
    }
  };

  document.querySelectorAll('[data-sidebar-toggle]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      if (sidebar && sidebar.classList.contains('translate-x-full')) {
        openSidebar();
      } else {
        closeSidebar();
      }
    };
  });

  document.querySelectorAll('[data-sidebar-close]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      closeSidebar();
    };
  });

  backdrop.onclick = closeSidebar;

  // 6. Global Search Redirect Engine
  document.querySelectorAll('input[type="search"], input[placeholder*="بحث"]').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          window.location.href = `${pagesPath}shipments.html?q=${encodeURIComponent(query)}`;
        }
      }
    });
  });
});
