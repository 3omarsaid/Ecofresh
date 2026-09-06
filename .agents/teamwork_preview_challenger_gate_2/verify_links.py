import os
import re
from pathlib import Path

BASE_DIR = Path(r"e:\web\exporting_erp\main_prototype")

def find_all_html_and_js():
    html_files = list(BASE_DIR.glob("**/*.html"))
    js_files = list(BASE_DIR.glob("**/*.js"))
    return html_files, js_files

def extract_links_from_html(file_path):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    links = []
    # Match href="..."
    href_matches = re.findall(r'href=["\']([^"\']+)["\']', content)
    for href in href_matches:
        links.append(('href', href))

    # Match action="..."
    action_matches = re.findall(r'action=["\']([^"\']+)["\']', content)
    for act in action_matches:
        links.append(('action', act))

    # Match onclick="window.location.href='...'" or location.href = '...'
    loc_matches = re.findall(r'location(?:\.href)?\s*=\s*["\']([^"\']+)["\']', content)
    for loc in loc_matches:
        links.append(('location', loc))

    return links

def extract_links_from_js(file_path):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    links = []
    # Match URL strings ending in .html
    html_str_matches = re.findall(r'["\']([^"\']+\.html(?:#[^"\']*)?)["\']', content)
    for h in html_str_matches:
        links.append(('js_string', h))

    return links

def check_link(source_file, raw_link):
    # Ignore external URLs, anchor-only, javascript:, void(0)
    if raw_link.startswith(('http://', 'https://', 'mailto:', 'tel:', 'javascript:')):
        return True, "external/ignored"
    if raw_link == '#' or raw_link.startswith('#'):
        return True, "anchor"

    # Separate query / hash
    clean_link = raw_link.split('?')[0].split('#')[0]
    if not clean_link:
        return True, "empty_after_hash"

    source_dir = source_file.parent
    target_path = (source_dir / clean_link).resolve()

    if target_path.exists():
        return True, str(target_path)
    else:
        return False, str(target_path)

def run_empirical_check():
    html_files, js_files = find_all_html_and_js()
    print(f"Found {len(html_files)} HTML files and {len(js_files)} JS files.")

    total_links = 0
    broken_links = []
    valid_links = []

    for html_file in html_files:
        rel_html = html_file.relative_to(BASE_DIR)
        links = extract_links_from_html(html_file)
        for link_type, link_val in links:
            total_links += 1
            ok, target = check_link(html_file, link_val)
            if not ok:
                broken_links.append({
                    "source": str(rel_html),
                    "type": link_type,
                    "raw": link_val,
                    "target": target
                })
            else:
                valid_links.append({
                    "source": str(rel_html),
                    "raw": link_val
                })

    for js_file in js_files:
        rel_js = js_file.relative_to(BASE_DIR)
        links = extract_links_from_js(js_file)
        for link_type, link_val in links:
            total_links += 1
            ok, target = check_link(js_file, link_val)
            if not ok:
                broken_links.append({
                    "source": str(rel_js),
                    "type": link_type,
                    "raw": link_val,
                    "target": target
                })
            else:
                valid_links.append({
                    "source": str(rel_js),
                    "raw": link_val
                })

    print(f"Total links checked: {total_links}")
    print(f"Valid links: {len(valid_links)}")
    print(f"Broken links count: {len(broken_links)}")

    if broken_links:
        print("\n--- BROKEN LINKS FOUND ---")
        for b in broken_links:
            print(f"Source: {b['source']} | Type: {b['type']} | Link: {b['raw']} | Resolved: {b['target']}")
    else:
        print("\nALL LINKS ARE VALID!")

if __name__ == "__main__":
    run_empirical_check()
