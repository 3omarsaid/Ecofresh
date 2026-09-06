import os
import glob
import re

root_dir = r'e:\web\exporting_erp\main_prototype'

target_screens = [
    'index.html',
    'pages/dashboard-executive.html',
    'pages/products.html',
    'pages/product-add.html',
    'pages/product-details.html',
    'pages/cartons.html',
    'pages/carton-add.html',
    'pages/customers.html',
    'pages/customer-add.html',
    'pages/customer-details.html',
    'pages/customer-agreements.html',
    'pages/customer-product-add.html',
    'pages/suppliers.html',
    'pages/supplier-add.html',
    'pages/supplier-product-add.html',
    'pages/supplier-details.html',
    'pages/stations.html',
    'pages/station-add.html',
    'pages/station-details.html',
    'pages/contractors.html',
    'pages/contractor-add.html',
    'pages/raw-purchases.html',
    'pages/raw-arrival-add.html'
]

print("--- AUDITING SCREENS 01-20 LINKS & ASSETS ---")
all_hrefs = {}
all_srcs = {}

for rel_screen in target_screens:
    filepath = os.path.join(root_dir, rel_screen)
    if not os.path.exists(filepath):
        print(f"ERROR: File missing: {rel_screen}")
        continue
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', content)
    srcs = re.findall(r'src=["\']([^"\']+)["\']', content)
    
    missing_links = []
    hash_links = []
    for h in hrefs:
        if h == '#':
            hash_links.append(h)
        elif not (h.startswith('http') or h.startswith('mailto:') or h.startswith('tel:')):
            clean_h = h.split('#')[0]
            if clean_h:
                target = os.path.normpath(os.path.join(os.path.dirname(filepath), clean_h))
                if not os.path.exists(target):
                    missing_links.append((h, target))
                    
    missing_srcs = []
    for s in srcs:
        if not (s.startswith('http') or s.startswith('data:')):
            target = os.path.normpath(os.path.join(os.path.dirname(filepath), s))
            if not os.path.exists(target):
                missing_srcs.append((s, target))
                
    print(f"\nScreen [{rel_screen}]: Hrefs count: {len(hrefs)}, Hash links: {len(hash_links)}, Missing hrefs: {len(missing_links)}, Missing srcs: {len(missing_srcs)}")
    if missing_links:
        for h, t in missing_links:
            print(f"  - BROKEN HREF: {h} -> {t}")
    if missing_srcs:
        for s, t in missing_srcs:
            print(f"  - BROKEN SRC: {s} -> {t}")
