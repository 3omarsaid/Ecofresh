import os
import re

pages_info = [
    ('_3', 'index.html', 'لوحة القيادة التنفيذية', 'dashboard'),
    ('_1', 'create-shipment.html', 'إنشاء شحنة تصدير', 'local_shipping'),
    ('_2', 'client-orders.html', 'طلبات العملاء والاتفاقيات', 'receipt_long'),
    ('_7', 'new-operation.html', 'عملية تشغيل جديدة', 'conveyor_belt'),
    ('_5', 'raw-materials.html', 'مخزون المواد الخام', 'inventory_2'),
    ('_6', 'suppliers.html', 'الموردون', 'group'),
    ('_8', 'treasury-payments.html', 'الخزينة والمدفوعات', 'account_balance_wallet'),
    ('_4', 'stations-management.html', 'إدارة المحطات', 'factory'),
    ('_9', 'exports-contractors.html', 'إدارة المقاولين والصادرات', 'handshake'),
]

def build_nav(current_filename):
    links_html = []
    for folder, fname, label, icon in pages_info:
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
            <span>نظام موحد - 9 صفحات متصلة</span>
        </div>
    </div>
</nav>
'''

for folder, fname, label, icon in pages_info:
    src_path = os.path.join(folder, 'code.html')
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace navigation
    nav_pattern = r'<nav[^>]*>.*?</nav>'
    new_nav = build_nav(fname)
    if re.search(nav_pattern, content, re.DOTALL):
        content = re.sub(nav_pattern, new_nav, content, flags=re.DOTALL)
    else:
        # If no nav tag found, inject right after <body>
        content = content.replace('<body', f'{new_nav}\n<body', 1)
        
    # Write updated file to root
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Successfully created: {fname}')

print("All 9 HTML pages consolidated successfully!")
