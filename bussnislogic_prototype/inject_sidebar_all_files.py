import os

base_dir = r"d:\Desktop\stitch_frozex_global_supply_erp"

pages_info = [
    ('index.html', 'لوحة القيادة التنفيذية', 'dashboard'),
    ('supplies.html', 'إدارة المستلزمات (Supplies)', 'inventory_2'),
    ('stations-management.html', 'إدارة وتدقيق المحطات', 'factory'),
    ('treasury-payments.html', 'الخزينة والمدفوعات', 'account_balance_wallet'),
    ('suppliers.html', 'الموردون والتوريدات', 'group'),
    ('raw-materials.html', 'مخزن المواد الخام (Raw Inventory)', 'inventory_2'),
    ('processing-operations.html', 'عمليات التدوير (Processing)', 'autorenew'),
    ('finished-goods.html', 'مخزن المنتج الجاهز (Finished Goods)', 'inventory'),
    ('employees.html', 'إدارة الموظفين (Employees)', 'badge'),
    ('create-shipment.html', 'إنشاء شحنة تصدير', 'local_shipping'),
    ('client-orders.html', 'طلبات العملاء والاتفاقيات', 'receipt_long'),
    ('new-operation.html', 'عملية تشغيل جديدة', 'conveyor_belt'),
    ('exports-contractors.html', 'إدارة المقاولين والصادرات', 'handshake')
]

def build_nav_html(current_file):
    links_html = []
    for fname, label, icon in pages_info:
        is_active = (fname == current_file) or (fname == 'employees.html' and current_file == 'employees-management.html')
        if is_active:
            style_cls = 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-surface-variant'
        else:
            style_cls = 'text-on-primary hover:bg-primary-fixed-variant/40 transition-colors'
            
        links_html.append(f'''
            <li>
                <a href="{fname}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all {style_cls}">
                    <span class="material-symbols-outlined">{icon}</span>
                    <span>{label}</span>
                </a>
            </li>''')
            
    return f'''<nav class="fixed right-0 top-0 h-screen w-[280px] z-50 flex flex-col bg-primary text-on-primary shadow-xl border-l border-outline-variant/10">
    <div class="h-toolbar-height flex flex-col justify-center px-6 border-b border-outline-variant/20 py-4 bg-primary shrink-0">
        <h1 class="font-headline-md text-headline-md font-bold text-surface-container-lowest">نظام تجميد للتصدير</h1>
        <p class="font-label-sm text-label-sm text-primary-fixed-dim">Glacier Ledger ERP</p>
    </div>
    <div class="flex-1 overflow-y-auto py-3 px-3">
        <ul class="flex flex-col gap-1">
{''.join(links_html)}
        </ul>
    </div>
    <div class="p-4 border-t border-outline-variant/20 shrink-0 bg-primary-container/30">
        <div class="flex items-center gap-3 text-xs text-primary-fixed-dim">
            <span class="material-symbols-outlined text-green-400 text-base">check_circle</span>
            <span>جميع الموديولات متصلة (13 صفحة)</span>
        </div>
    </div>
</nav>'''

for f_name in os.listdir(base_dir):
    if f_name.endswith(".html"):
        f_path = os.path.join(base_dir, f_name)
        with open(f_path, "r", encoding="utf-8") as f:
            content = f.read()

        s_idx = content.find("<nav")
        e_idx = content.find("</nav>")
        if s_idx != -1 and e_idx != -1:
            e_idx += len("</nav>")
            new_nav = build_nav_html(f_name)
            new_content = content[:s_idx] + new_nav + content[e_idx:]
            with open(f_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print("REPLACED NAV IN:", f_name)

print("COMPLETED ALL SIDEBAR REPLACEMENTS.")
