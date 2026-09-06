import os
import re

base_dir = r"d:\Desktop\stitch_frozex_global_supply_erp"

pages_info = [
    ('index.html', 'لوحة القيادة التنفيذية', 'dashboard'),
    ('supplies.html', 'إدارة المستلزمات (Supplies)', 'inventory_2'),
    ('stations-management.html', 'إدارة المحطات', 'factory'),
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

def build_nav(current_filename):
    links_html = []
    for fname, label, icon in pages_info:
        is_active = (fname == current_filename)
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
        </li>
        ''')
    
    return f'''
<nav class="fixed right-0 top-0 h-screen w-[280px] z-50 flex flex-col bg-primary text-on-primary shadow-xl border-l border-outline-variant/10">
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
            <span>جميع الصفحات متصلة (13 صفحة)</span>
        </div>
    </div>
</nav>
'''

for root, dirs, files in os.walk(base_dir):
    if root != base_dir:
        continue
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            nav_marker = '<nav class="fixed right-0 top-0 h-screen w-[280px]'
            if nav_marker in content:
                start_idx = content.find(nav_marker)
                end_idx = content.find("</nav>", start_idx)
                if end_idx != -1:
                    end_idx += len("</nav>")
                    new_nav = build_nav(file)
                    content = content[:start_idx] + new_nav.strip() + content[end_idx:]
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Updated sidebar in {file}")

print("SIDEBARS SYNCHRONIZED SUCCESSFULLY.")
