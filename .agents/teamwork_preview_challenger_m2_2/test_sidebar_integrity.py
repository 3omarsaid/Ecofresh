import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"e:\web\exporting_erp\main_prototype"
pages_dir = os.path.join(base_dir, "pages")

files = sorted([f for f in os.listdir(pages_dir) if f.endswith(".html")])

print(f"Checking sidebar navigation links in {len(files)} pages...\n")

sidebar_link_issues = []
active_link_mismatches = []

for f in files:
    filepath = os.path.join(pages_dir, f)
    with open(filepath, "r", encoding="utf-8") as fp:
        html = fp.read()
    
    # Extract sidebar nav content
    sidebar_match = re.search(r'<aside\b[^>]*>(.*?)</aside>', html, re.DOTALL)
    if not sidebar_match:
        # Check if mobile nav or alternative sidebar exists
        sidebar_link_issues.append((f, "No <aside> tag found"))
        continue
        
    sidebar_content = sidebar_match.group(1)
    
    # Find all hrefs inside sidebar
    sidebar_hrefs = re.findall(r'<a\s+[^>]*href="([^"]+)"', sidebar_content)
    
    # Check if active item matches current file
    # Active item usually has bg-primary or text-primary font-bold or border-r-4
    active_items = re.findall(r'<a\s+[^>]*href="([^"]+)"[^>]*class="[^"]*(?:bg-primary|font-bold|border-r-4|bg-surface-container-high)[^"]*"', sidebar_content)
    
    # Verify if active link points to the page itself or its parent section
    active_target = active_items[0] if active_items else None
    
    # Check if target file exists for all sidebar links
    for h in sidebar_hrefs:
        if h == "#" or h.startswith("javascript:"):
            sidebar_link_issues.append((f, f"Dummy href='{h}' in sidebar"))
        else:
            target = os.path.normpath(os.path.join(pages_dir, h))
            if not os.path.exists(target):
                sidebar_link_issues.append((f, f"Broken link in sidebar: {h}"))

print("==========================================")
print("SIDEBAR INTEGRITY RESULTS")
print("==========================================")
print(f"Total pages checked: {len(files)}")
print(f"Total sidebar issues: {len(sidebar_link_issues)}")

if sidebar_link_issues:
    for f, issue in sidebar_link_issues:
        print(f"  In {f}: {issue}")

