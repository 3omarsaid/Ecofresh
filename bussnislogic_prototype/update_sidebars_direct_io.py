import os
import re

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

def make_sidebar(target):
    lis = []
    for fname, label, icon in pages_info:
        is_act = (fname == target) or (fname == 'employees.html' and target == 'employees-management.html')
        cls = 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-surface-variant' if is_act else 'text-on-primary hover:bg-primary-fixed-variant/40 transition-colors'
        lis.append(f'''            <li>
                <a href="{fname}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all {cls}">
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
{'\n'.join(lis)}
        </ul>
    </div>
    <div class="p-4 border-t border-outline-variant/20 shrink-0 bg-primary-container/30">
        <div class="flex items-center gap-3 text-xs text-primary-fixed-dim">
            <span class="material-symbols-outlined text-green-400 text-base">check_circle</span>
            <span>جميع الموديولات متصلة (13 صفحة)</span>
        </div>
    </div>
</nav>'''

html_files = [f for f in os.listdir(base_dir) if f.endswith(".html")]

updated = 0
for f_name in html_files:
    f_path = os.path.join(base_dir, f_name)
    with open(f_path, "r", encoding="utf-8") as f:
        text = f.read()

    new_nav_block = make_sidebar(f_name)
    # Match <nav class="fixed right-0 top-0 ..."> ... </nav>
    pattern = r'<nav\s+class="fixed right-0 top-0.*?</nav>'
    if re.search(pattern, text, re.DOTALL):
        new_text = re.sub(pattern, new_nav_block, text, flags=re.DOTALL)
        with open(f_path, "w", encoding="utf-8") as f:
            f.write(new_text)
        updated += 1
        print("SUCCESSFULLY UPDATED NAV IN:", f_name)

print(f"TOTAL HTML FILES UPDATED: {updated}")
