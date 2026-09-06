$pages = @(
    @{ folder = "_3"; fname = "index.html"; label = "لوحة القيادة التنفيذية"; icon = "dashboard" },
    @{ folder = "_1"; fname = "create-shipment.html"; label = "إنشاء شحنة تصدير"; icon = "local_shipping" },
    @{ folder = "_2"; fname = "client-orders.html"; label = "طلبات العملاء والاتفاقيات"; icon = "receipt_long" },
    @{ folder = "_7"; fname = "new-operation.html"; label = "عملية تشغيل جديدة"; icon = "conveyor_belt" },
    @{ folder = "_5"; fname = "raw-materials.html"; label = "مخزون المواد الخام"; icon = "inventory_2" },
    @{ folder = "_6"; fname = "suppliers.html"; label = "الموردون"; icon = "group" },
    @{ folder = "_8"; fname = "treasury-payments.html"; label = "الخزينة والمدفوعات"; icon = "account_balance_wallet" },
    @{ folder = "_4"; fname = "stations-management.html"; label = "إدارة المحطات"; icon = "factory" },
    @{ folder = "_9"; fname = "exports-contractors.html"; label = "إدارة المقاولين والصادرات"; icon = "handshake" }
)

foreach ($p in $pages) {
    $src = "d:\Desktop\stitch_frozex_global_supply_erp\" + $p.folder + "\code.html"
    $dst = "d:\Desktop\stitch_frozex_global_supply_erp\" + $p.fname
    
    if (-not (Test-Path $dst)) {
        Copy-Item $src $dst -Force
        Write-Host "Copied $src to $dst"
    }
}
Write-Host "All files copied!"
