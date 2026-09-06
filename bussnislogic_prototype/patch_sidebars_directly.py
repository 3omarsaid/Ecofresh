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

def make_ul_block(target_fname):
    lis = []
    for fname, label, icon in pages_info:
        is_act = (fname == target_fname) or (fname == 'employees.html' and target_fname == 'employees-management.html')
        cls = 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-surface-variant' if is_act else 'text-on-primary hover:bg-primary-fixed-variant/40 transition-colors'
        lis.append(f'            <li><a href="{fname}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all {cls}"><span class="material-symbols-outlined">{icon}</span><span>{label}</span></a></li>')
    return '<ul class="flex flex-col gap-1">\n' + '\n'.join(lis) + '\n        </ul>'

updated_files = 0
for f_name in os.listdir(base_dir):
    if f_name.endswith(".html"):
        f_path = os.path.join(base_dir, f_name)
        with open(f_path, "r", encoding="utf-8") as f:
            content = f.read()

        ul_start = content.find('<ul class="flex flex-col gap-1">')
        if ul_start != -1:
            ul_end = content.find('</ul>', ul_start)
            if ul_end != -1:
                ul_end += len('</ul>')
                new_ul = make_ul_block(f_name)
                new_content = content[:ul_start] + new_ul + content[ul_end:]
                with open(f_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                updated_files += 1
                print(f"PATCHED: {f_name}")

print(f"SUCCESS: Patched sidebar in {updated_files} HTML files.")
