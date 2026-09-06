$pagesInfo = @(
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

function Get-NavHtml($currentFname) {
    $links = foreach ($item in $pagesInfo) {
        $isActive = ($item.fname -eq $currentFname)
        if ($isActive) {
            $styleCls = "bg-secondary-container text-on-secondary-container font-bold border-r-4 border-surface-variant"
        } else {
            $styleCls = "text-on-primary hover:bg-primary-fixed-variant/40 transition-colors"
        }
        "<li><a href=""$($item.fname)"" class=""flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all $styleCls""><span class=""material-symbols-outlined"">$($item.icon)</span><span>$($item.label)</span></a></li>"
    }

    $joinedLinks = $links -join "`n"

    return @"
<nav class="fixed right-0 top-0 h-screen w-[280px] z-50 flex flex-col bg-primary text-on-primary shadow-xl border-l border-outline-variant/10">
    <div class="h-toolbar-height flex flex-col justify-center px-6 border-b border-outline-variant/20 py-4 bg-primary shrink-0">
        <h1 class="font-headline-md text-headline-md font-bold text-surface-container-lowest">نظام تجميد للتصدير</h1>
        <p class="font-label-sm text-label-sm text-primary-fixed-dim">Glacier Ledger ERP</p>
    </div>
    <div class="flex-1 overflow-y-auto py-3 px-3">
        <ul class="flex flex-col gap-1">
            $joinedLinks
        </ul>
    </div>
    <div class="p-4 border-t border-outline-variant/20 shrink-0 bg-primary-container/30">
        <div class="flex items-center gap-3 text-xs text-primary-fixed-dim">
            <span class="material-symbols-outlined text-green-400 text-base">check_circle</span>
            <span>نظام موحد - 9 صفحات متصلة</span>
        </div>
    </div>
</nav>
"@
}

foreach ($item in $pagesInfo) {
    $srcPath = Join-Path $PSScriptRoot "$($item.folder)\code.html"
    $content = Get-Content -Path $srcPath -Raw -Encoding UTF8
    $newNav = Get-NavHtml $item.fname

    $regex = '(?s)<nav[^>]*>.*?</nav>'
    if ($content -match $regex) {
        $content = [regex]::Replace($content, $regex, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $newNav })
    } else {
        $content = $content.Replace('<body', "$newNav`n<body")
    }

    $destPath = Join-Path $PSScriptRoot $item.fname
    Set-Content -Path $destPath -Value $content -Encoding UTF8
    Write-Host "Created $($item.fname)"
}

Write-Host "Done consolidating all 9 pages!"
