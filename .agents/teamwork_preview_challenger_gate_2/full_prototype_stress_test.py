import os
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(r"e:\web\exporting_erp\main_prototype")

def get_all_html_files():
    return {f.relative_to(BASE_DIR).as_posix(): f for f in BASE_DIR.glob("**/*.html")}

def extract_all_links(filepath):
    content = filepath.read_text(encoding="utf-8", errors="ignore")
    # find all hrefs, actions, location.hrefs
    raw_links = re.findall(r'(?:href|action|location\.href)\s*=\s*["\']([^"\']+)["\']', content)
    
    # also find any quoted .html paths
    html_quotes = re.findall(r'["\']([^"\']+\.html(?:#[^"\']*)?)["\']', content)
    
    all_raw = set(raw_links + html_quotes)
    cleaned = []
    for r in all_raw:
        if r.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:', '#')):
            continue
        clean = r.split('?')[0].split('#')[0]
        if clean:
            cleaned.append(r)
    return cleaned

def run_stress_test():
    all_html_map = get_all_html_files()
    print(f"Total HTML files in prototype: {len(all_html_map)}")

    link_graph = {rel_path: [] for rel_path in all_html_map}
    broken_references = []
    all_valid_links_count = 0

    for rel_path, full_path in all_html_map.items():
        links = extract_all_links(full_path)
        source_dir = full_path.parent

        for link in links:
            clean_link = link.split('?')[0].split('#')[0]
            target_full = (source_dir / clean_link).resolve()

            if target_full.exists():
                all_valid_links_count += 1
                try:
                    target_rel = target_full.relative_to(BASE_DIR).as_posix()
                    if target_rel in link_graph:
                        link_graph[rel_path].append(target_rel)
                except ValueError:
                    pass
            else:
                broken_references.append({
                    "source": rel_path,
                    "link": link,
                    "resolved": str(target_full)
                })

    print(f"Total Valid Cross-Links Analyzed: {all_valid_links_count}")
    print(f"Total Broken References Found: {len(broken_references)}")

    if broken_references:
        print("\n[BROKEN REFERENCES DETECTED]:")
        for b in broken_references:
            print(f"  Source: {b['source']} -> Link: '{b['link']}' (Resolved: {b['resolved']})")
    else:
        print("\n✅ ZERO BROKEN REFERENCES DETECTED across all 45 HTML files!")

    # Check reachability graph starting from index.html and sidebar
    visited = set()
    queue = ["index.html"]

    while queue:
        curr = queue.pop(0)
        if curr not in visited:
            visited.add(curr)
            for neighbor in link_graph.get(curr, []):
                if neighbor not in visited:
                    queue.append(neighbor)

    unreachable = set(all_html_map.keys()) - visited
    print(f"\nReachable Screens from index.html: {len(visited)} / {len(all_html_map)}")
    if unreachable:
        print(f"Unreachable screens from index.html: {unreachable}")
    else:
        print("✅ ALL 45 SCREENS ARE FULLY REACHABLE FROM INDEX.HTML!")

    # Specific Audit for Key Pages
    print("\n=== AUDIT OF KEY SCENARIO PAGES ===")
    key_pages = [
        "pages/shipment-details.html",
        "pages/lot-details.html",
        "pages/waste-monitoring.html",
        "pages/shipment-wizard.html",
        "pages/raw-purchase-details.html",
        "pages/party-statement-details.html"
    ]

    for kp in key_pages:
        if kp in link_graph:
            outgoing = set(link_graph[kp])
            print(f"Page '{kp}' connects to {len(outgoing)} distinct screens: {sorted(list(outgoing))}")

if __name__ == "__main__":
    run_stress_test()
