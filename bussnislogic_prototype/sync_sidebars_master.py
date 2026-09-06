import os
import re

NAV_TEMPLATE = """<!-- Mobile Overlay Backdrop -->
<div id="mobileSidebarBackdrop" onclick="toggleMobileSidebar()" class="fixed inset-0 bg-black/50 z-40 hidden lg:hidden backdrop-blur-xs transition-opacity"></div>

<!-- SideNavBar -->
<nav id="mainSidebar" class="fixed right-0 top-0 h-screen w-[280px] z-50 flex flex-col bg-primary text-on-primary shadow-xl border-l border-outline-variant/10 transition-transform duration-300 transform translate-x-full lg:translate-x-0">
    <div class="h-toolbar-height flex flex-col justify-center px-6 border-b border-outline-variant/20 py-4 bg-primary shrink-0 relative">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="font-headline-md text-headline-md font-bold text-surface-container-lowest">نظام تجميد للتصدير</h1>
                <p class="font-label-sm text-label-sm text-primary-fixed-dim">Glacier Ledger ERP</p>
            </div>
            <button onclick="toggleMobileSidebar()" class="lg:hidden text-on-primary/80 hover:text-white p-1 rounded-lg">
                <span class="material-symbols-outlined text-2xl">close</span>
            </button>
        </div>
    </div>
    <div class="flex-1 overflow-y-auto py-3 px-3">
        <ul class="flex flex-col gap-1">
            <li>
                <a href="index.html" data-page="index.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">dashboard</span>
                    <span>لوحة القيادة التنفيذية</span>
                </a>
            </li>
            <li>
                <a href="supplies.html" data-page="supplies.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <span>إدارة المستلزمات (Supplies)</span>
                </a>
            </li>
            <li>
                <a href="processing-operations.html" data-page="processing-operations.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">autorenew</span>
                    <span>عمليات التدوير (Processing)</span>
                </a>
            </li>
            <li>
                <a href="create-shipment.html" data-page="create-shipment.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">local_shipping</span>
                    <span>إنشاء شحنة تصدير</span>
                </a>
            </li>
            <li>
                <a href="client-orders.html" data-page="client-orders.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">receipt_long</span>
                    <span>طلبات العملاء والاتفاقيات</span>
                </a>
            </li>
            <li>
                <a href="new-operation.html" data-page="new-operation.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">conveyor_belt</span>
                    <span>عملية تشغيل جديدة</span>
                </a>
            </li>
            <li>
                <a href="raw-materials.html" data-page="raw-materials.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">shelves</span>
                    <span>مخزون المواد الخام</span>
                </a>
            </li>
            <li>
                <a href="finished-goods.html" data-page="finished-goods.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">check_box</span>
                    <span>المنتجات التامة (Finished Goods)</span>
                </a>
            </li>
            <li>
                <a href="suppliers.html" data-page="suppliers.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">group</span>
                    <span>الموردون</span>
                </a>
            </li>
            <li>
                <a href="treasury-payments.html" data-page="treasury-payments.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">account_balance_wallet</span>
                    <span>الخزينة والمدفوعات</span>
                </a>
            </li>
            <li>
                <a href="stations-management.html" data-page="stations-management.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">factory</span>
                    <span>إدارة المحطات</span>
                </a>
            </li>
            <li>
                <a href="employees-management.html" data-page="employees-management.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">badge</span>
                    <span>إدارة الموظفين والعمالة</span>
                </a>
            </li>
            <li>
                <a href="exports-contractors.html" data-page="exports-contractors.html" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors">
                    <span class="material-symbols-outlined">handshake</span>
                    <span>إدارة المقاولين والصادرات</span>
                </a>
            </li>
        </ul>
    </div>
    <div class="p-4 border-t border-outline-variant/20 shrink-0 bg-primary-container/30">
        <div class="flex items-center gap-3 text-xs text-primary-fixed-dim">
            <span class="material-symbols-outlined text-green-400 text-base">check_circle</span>
            <span>نظام محاكاة متصل - Prototype</span>
        </div>
    </div>
</nav>

<script>
function toggleMobileSidebar() {
    const sidebar = document.getElementById("mainSidebar");
    const backdrop = document.getElementById("mobileSidebarBackdrop");
    if (sidebar && backdrop) {
        sidebar.classList.toggle("translate-x-full");
        backdrop.classList.toggle("hidden");
    }
}
</script>"""

ACTIVE_CLASSES = 'font-bold bg-secondary-container text-on-secondary-container border-r-4 border-surface-variant transition-all'
INACTIVE_CLASSES = 'font-medium text-on-primary hover:bg-primary-fixed-variant/40 transition-colors'

def process_file(filename):
    if not filename.endswith(".html"):
        return
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Determine current page active item
    nav_html = NAV_TEMPLATE
    
    # Set active class for current page
    target_pattern = f'data-page="{filename}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm {INACTIVE_CLASSES}"'
    replacement = f'data-page="{filename}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm {ACTIVE_CLASSES}"'
    nav_html = nav_html.replace(target_pattern, replacement)

    # Replace <nav ...> </nav> or overlay + nav
    # First search for backdrop if present
    content = re.sub(r'<!-- Mobile Overlay Backdrop -->[\s\S]*?<!-- SideNavBar -->', '<!-- SideNavBar -->', content)
    content = re.sub(r'<nav[\s\S]*?</nav>(\s*<script>\s*function toggleMobileSidebar[\s\S]*?</script>)?', nav_html, content, count=1)

    # Make header support mobile hamburger menu and right margin adjustment for responsive
    header_hamburger = """<button onclick="toggleMobileSidebar()" class="lg:hidden p-2 text-on-surface hover:text-primary rounded-lg">
            <span class="material-symbols-outlined text-2xl">menu</span>
        </button>"""

    # Check if header exists and adjust header margin class right-[280px] to lg:right-[280px] left-0 right-0
    content = re.sub(r'<header class="([^"]*?)right-\[280px\]', r'<header class="\1right-0 lg:right-[280px]', content)
    content = re.sub(r'<main class="([^"]*?)mr-\[280px\]', r'<main class="\1mr-0 lg:mr-[280px]', content)

    # Inject hamburger icon inside header if not present
    if 'toggleMobileSidebar()' not in content.split('<header')[1].split('</header>')[0] if '<header' in content else False:
        content = re.sub(r'(<header[^>]*>\s*<div class="flex items-center gap-4">)', r'\1\n        ' + header_hamburger, content, count=1)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully processed {filename}")

def main():
    files = [f for f in os.listdir('.') if f.endswith('.html')]
    for file in files:
        process_file(file)

if __name__ == '__main__':
    main()
