import {
  LayoutDashboard,
  Users,
  UserCheck,
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
  LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
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
      { title: 'لوحة قيادة المخزون', href: '/inventory', icon: Warehouse },
    ],
  },
  {
    title: 'البيانات الأساسية',
    items: [
      { title: 'دليل عملاء التصدير', href: '/customers', icon: Users },
      { title: 'دليل الموردين', href: '/suppliers', icon: Truck },
      { title: 'المحطات والمخازن', href: '/stations', icon: Building2 },
      { title: 'مقاولو العمالة', href: '/contractors', icon: HardHat },
      { title: 'إدارة الموظفين', href: '/employees', icon: UserCheck },
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

export const pageTitleMap: Record<string, string> = {
  '/dashboard': 'لوحة التحكم التنفيذية',
  '/dashboard/inventory': 'لوحة قيادة المخزون',
  '/customers': 'دليل عملاء التصدير',
  '/suppliers': 'دليل الموردين',
  '/stations': 'المحطات والمخازن',
  '/contractors': 'مقاولو العمالة والتشغيل',
  '/employees': 'إدارة الموظفين والرواتب',
  '/products': 'كتالوج المنتجات التصديرية',
  '/supplies': 'المستلزمات والكراتين',
  '/raw-purchases': 'وارد المواد الخام',
  '/packaging-purchases': 'مشتريات المستلزمات',
  '/finished-purchases': 'صفقات بضاعة جاهزة',
  '/client-orders': 'طلبيات التصدير للعملاء',
  '/processing-operations': 'عمليات التدوير والإنتاج',
  '/shipments': 'الشحنات والتصدير',
  '/inventory': 'مخزن المنتج الجاهز',
  '/inventory/raw': 'مخزن المواد الخام',
  '/inventory/transfers': 'التحويل بين المحطات',
  '/inventory/waste': 'مراقبة وتكاليف الهالك',
  '/financials': 'كشف الحسابات العام',
  '/financials/transactions': 'سندات الدفع والتحصيل',
  '/financials/treasury': 'الخزينة والحسابات البنكية',
  '/reports': 'مركز التقارير الموحد',
  '/reports/profitability': 'ربحية الشحنات',
  '/reports/stations': 'مراقبة كفاءة المحطات',
};
