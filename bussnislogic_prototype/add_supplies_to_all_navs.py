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

def make_ul_html(current_file):
    links = []
    for fname, label, icon in pages_info:
        is_active = (fname == current_file) or (fname == 'employees.html' and current_file == 'employees-management.html')
        if is_active:
            style_cls = 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-surface-variant'
        else:
            style_cls = 'text-on-primary hover:bg-primary-fixed-variant/40 transition-colors'
            
        links.append(f'''            <li>
                <a href="{fname}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all {style_cls}">
                    <span class="material-symbols-outlined">{icon}</span>
                    <span>{label}</span>
                </a>
            </li>''')
    return '<ul class="flex flex-col gap-1">\n' + '\n'.join(links) + '\n        </ul>'

updated = 0
for f_name in os.listdir(base_dir):
    if f_name.endswith(".html"):
        f_path = os.path.join(base_dir, f_name)
        with open(f_path, "r", encoding="utf-8") as f:
            content = f.read()

        ul_pattern = r'<ul class="flex flex-col gap-1">.*?</ul>'
        new_ul = make_ul_html(f_name)
        if re.search(ul_pattern, content, re.DOTALL):
            new_content = re.sub(ul_pattern, new_ul, content, flags=re.DOTALL)
            with open(f_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            updated += 1
            print(f"Updated UL in {f_name}")

print(f"DONE. Updated {updated} files with supplies link.")
