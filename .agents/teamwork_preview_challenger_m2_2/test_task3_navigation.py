import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"e:\web\exporting_erp\main_prototype"
pages_dir = os.path.join(base_dir, "pages")

html_files = []
# main index
if os.path.exists(os.path.join(base_dir, "index.html")):
    html_files.append(os.path.join(base_dir, "index.html"))

# page files
for f in os.listdir(pages_dir):
    if f.endswith(".html"):
        html_files.append(os.path.join(pages_dir, f))

print(f"Total HTML files to test for navigation integrity: {len(html_files)}\n")

broken_links = []
empty_links = []
hash_links = []
valid_links_count = 0

sidebar_active_status = {}
breadcrumb_status = {}
search_inputs_status = {}
table_filters_status = {}

for filepath in sorted(html_files):
    filename = os.path.basename(filepath)
    rel_dir = os.path.dirname(filepath)
    
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
    
    # 1. Href check
    hrefs = re.findall(r'<a\s+[^>]*href="([^"]+)"', html)
    for h in hrefs:
        h_clean = h.split('#')[0].split('?')[0]
        if not h_clean or h == "#":
            if h == "#":
                hash_links.append((filename, h))
            else:
                empty_links.append((filename, h))
            continue
        
        if h_clean.startswith("http://") or h_clean.startswith("https://") or h_clean.startswith("javascript:"):
            continue
        
        # Check relative file path existence
        target_path = os.path.normpath(os.path.join(rel_dir, h_clean))
        if os.path.exists(target_path):
            valid_links_count += 1
        else:
            broken_links.append((filename, h, target_path))

    # 2. Sidebar active link check
    # Check if there is an active class highlight in nav
    active_matches = re.findall(r'class="[^"]*(?:bg-primary|text-primary font-bold|border-r-4|bg-surface-container-high)[^"]*"', html)
    sidebar_active_status[filename] = len(active_matches) > 0

    # 3. Breadcrumb check
    breadcrumbs = re.findall(r'<a\s+[^>]*href="([^"]+)"[^>]*>الرئيسية</a>', html)
    breadcrumb_status[filename] = breadcrumbs

    # 4. Search inputs check
    search_inputs = re.findall(r'<input\s+[^>]*placeholder="[^"]*بحث[^"]*"', html)
    search_inputs_status[filename] = len(search_inputs)

    # 5. Table filters check
    select_filters = re.findall(r'<select\b[^>]*>', html)
    table_filters_status[filename] = len(select_filters)

print("==========================================")
print("NAVIGATION & LINK INTEGRITY REPORT")
print("==========================================")
print(f"Total Valid Internal Hrefs Resolved: {valid_links_count}")
print(f"Total Broken / Non-Existent Hrefs: {len(broken_links)}")
print(f"Total Dummy Hash (#) Hrefs: {len(hash_links)}")

if broken_links:
    print("\n[BROKEN LINKS DISCOVERED]:")
    for src, href, tgt in broken_links:
        print(f"  In {src}: href='{href}' -> Target not found: {tgt}")

if hash_links:
    print(f"\n[DUMMY HASH (#) LINKS]: {len(hash_links)} occurrences across files.")
    # Show sample
    sample_files = set(src for src, h in hash_links)
    print(f"  Files containing dummy '#' links: {sorted(list(sample_files))[:10]}")

print("\n==========================================")
print("SIDEBAR ACTIVE HIGHLIGHT & SEARCH / FILTER REPORT")
print("==========================================")
inactive_sidebars = [f for f, active in sidebar_active_status.items() if not active]
print(f"Files with Active Sidebar Highlight: {len(sidebar_active_status) - len(inactive_sidebars)} / {len(html_files)}")
if inactive_sidebars:
    print(f"Files missing clear active sidebar highlight: {inactive_sidebars}")

pages_with_search = [f for f, count in search_inputs_status.items() if count > 0]
print(f"\nPages with Quick Search Input: {len(pages_with_search)} / {len(html_files)}")

pages_with_filters = [f for f, count in table_filters_status.items() if count > 0]
print(f"Pages with Select Filter Dropdowns: {len(pages_with_filters)} / {len(html_files)}")
