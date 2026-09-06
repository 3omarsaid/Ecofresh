const fs = require('fs');
const path = require('path');

const baseDir = __dirname;

const pagesInfo = [
    ['index.html', 'لوحة القيادة التنفيذية', 'dashboard'],
    ['supplies.html', 'إدارة المستلزمات (Supplies)', 'inventory_2'],
    ['stations-management.html', 'إدارة وتدقيق المحطات', 'factory'],
    ['treasury-payments.html', 'الخزينة والمدفوعات', 'account_balance_wallet'],
    ['suppliers.html', 'الموردون والتوريدات', 'group'],
    ['raw-materials.html', 'مخزن المواد الخام (Raw Inventory)', 'inventory_2'],
    ['processing-operations.html', 'عمليات التدوير (Processing)', 'autorenew'],
    ['finished-goods.html', 'مخزن المنتج الجاهز (Finished Goods)', 'inventory'],
    ['employees.html', 'إدارة الموظفين (Employees)', 'badge'],
    ['create-shipment.html', 'إنشاء شحنة تصدير', 'local_shipping'],
    ['client-orders.html', 'طلبات العملاء والاتفاقيات', 'receipt_long'],
    ['new-operation.html', 'عملية تشغيل جديدة', 'conveyor_belt'],
    ['exports-contractors.html', 'إدارة المقاولين والصادرات', 'handshake']
];

function buildNav(currentFilename) {
    const linksHtml = pagesInfo.map(([fname, label, icon]) => {
        const isActive = (fname === currentFilename) || (fname === 'employees.html' && currentFilename === 'employees-management.html');
        const styleCls = isActive 
            ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-surface-variant' 
            : 'text-on-primary hover:bg-primary-fixed-variant/40 transition-colors';
        return `            <li>
                <a href="${fname}" class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${styleCls}">
                    <span class="material-symbols-outlined">${icon}</span>
                    <span>${label}</span>
                </a>
            </li>`;
    }).join('\n');

    return `<nav class="fixed right-0 top-0 h-screen w-[280px] z-50 flex flex-col bg-primary text-on-primary shadow-xl border-l border-outline-variant/10">
    <div class="h-toolbar-height flex flex-col justify-center px-6 border-b border-outline-variant/20 py-4 bg-primary shrink-0">
        <h1 class="font-headline-md text-headline-md font-bold text-surface-container-lowest">نظام تجميد للتصدير</h1>
        <p class="font-label-sm text-label-sm text-primary-fixed-dim">Glacier Ledger ERP</p>
    </div>
    <div class="flex-1 overflow-y-auto py-3 px-3">
        <ul class="flex flex-col gap-1">
${linksHtml}
        </ul>
    </div>
    <div class="p-4 border-t border-outline-variant/20 shrink-0 bg-primary-container/30">
        <div class="flex items-center gap-3 text-xs text-primary-fixed-dim">
            <span class="material-symbols-outlined text-green-400 text-base">check_circle</span>
            <span>تتبع صرف التعبئة والتكلفة active</span>
        </div>
    </div>
</nav>`;
}

const files = fs.readdirSync(baseDir);
let updatedCount = 0;

files.forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(baseDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        const navStart = content.indexOf('<nav class="fixed right-0 top-0 h-screen w-[280px]');
        if (navStart !== -1) {
            const navEnd = content.indexOf('</nav>', navStart);
            if (navEnd !== -1) {
                const newNav = buildNav(file);
                content = content.slice(0, navStart) + newNav + content.slice(navEnd + 6);
                fs.writeFileSync(filePath, content, 'utf8');
                updatedCount++;
                console.log(`Updated sidebar in ${file}`);
            }
        }
    }
});

console.log(`TOTAL FILES UPDATED: ${updatedCount}`);
