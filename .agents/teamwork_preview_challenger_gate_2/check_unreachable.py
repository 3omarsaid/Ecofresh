import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(r"e:\web\exporting_erp\main_prototype")
html_files = list(BASE_DIR.glob("**/*.html"))

targets = [
    'shipment-create.html',
    'station-add.html',
    'dashboard-executive.html',
    'product-details.html',
    'supplier-product-add.html',
    'customer-agreements.html',
    'supplier-add.html'
]

print("=== INCOMING LINKS AUDIT FOR UNREACHABLE CANDIDATES ===")

for target in targets:
    referrers = []
    for f in html_files:
        content = f.read_text(encoding='utf-8', errors='ignore')
        if target in content:
            referrers.append(f.relative_to(BASE_DIR).as_posix())
    print(f"\nTarget '{target}': {len(referrers)} referrers found")
    for ref in referrers:
        print(f"  - Referred by: {ref}")
