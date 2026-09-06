import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"e:\web\exporting_erp\main_prototype"
pages_dir = os.path.join(base_dir, "pages")

files = sorted([f for f in os.listdir(pages_dir) if f.endswith(".html")])

print(f"Checking breadcrumbs and back links in {len(files)} pages...\n")

breadcrumb_data = {}

for f in files:
    filepath = os.path.join(pages_dir, f)
    with open(filepath, "r", encoding="utf-8") as fp:
        html = fp.read()
    
    # Look for breadcrumb blocks
    # e.g., <div class="flex items-center gap-2 ..."> or nav breadcrumbs
    crumbs = re.findall(r'<a\s+[^>]*href="([^"]+)"[^>]*>([^<]+)</a>\s*(?:/|&gt;|›|→)?', html)
    
    # Filter header/breadcrumb links (exclude sidebar)
    # Check if breadcrumbs contain index.html or section parent
    header_crumbs = []
    for href, text in crumbs:
        text_clean = text.strip()
        if "الرئيسية" in text_clean or "العملاء" in text_clean or "الموردين" in text_clean or "وارد الخام" in text_clean or "مخزون الخام" in text_clean or "الشحنات" in text_clean or "المحطات" in text_clean:
            header_crumbs.append((text_clean, href))
            
    breadcrumb_data[f] = header_crumbs

for f, crumbs in breadcrumb_data.items():
    if crumbs:
        print(f"--- {f} ---")
        for text, href in crumbs:
            target = os.path.normpath(os.path.join(pages_dir, href))
            exists = os.path.exists(target)
            status = "VALID" if exists else "BROKEN"
            print(f"  [{status}] '{text}' -> href='{href}'")
