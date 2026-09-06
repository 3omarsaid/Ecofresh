import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"e:\web\exporting_erp\main_prototype"
pages_dir = os.path.join(base_dir, "pages")

target_files = {
    "raw-purchase-details.html": "Screen 21 - Raw Purchase Details",
    "shipment-details.html": "Screen 26 - Shipment Details",
    "lot-details.html": "Screen 30 - Lot Details",
    "waste-monitoring.html": "Screen 31 - Waste Monitoring",
    "supplier-report.html": "Screen 39 - Supplier Report"
}

for filename, desc in target_files.items():
    filepath = os.path.join(pages_dir, filename)
    if not os.path.exists(filepath):
        print(f"FAIL: File {filename} not found!")
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
    
    print(f"\n==========================================")
    print(f"ANALYZING: {filename} ({desc})")
    print(f"==========================================")
    
    if filename == "raw-purchase-details.html":
        if "مسار التتبع المباشر" in html:
            print("[PASS] Found 'مسار التتبع المباشر' header container.")
        else:
            print("[FAIL] 'مسار التتبع المباشر' header container missing.")
        
        m = re.search(r"مسار التتبع المباشر.*?(</div>\s*</div>\s*</div>)", html, re.DOTALL)
        if m:
            block = m.group(0)
            links = re.findall(r'<a\s+href="([^"]+)"[^>]*>(.*?)</a>', block, re.DOTALL)
            clean_links = [(re.sub(r'<[^>]+>', '', text).strip(), href) for href, text in links]
            print(f"  - Node Links: {clean_links}")
            arrows = len(re.findall(r'arrow_back', block))
            print(f"  - Visual Connector Arrows (arrow_back): {arrows}")
        else:
            print("  - Could not extract traceability block.")

    elif filename == "shipment-details.html":
        if "مسار التتبع (Traceability)" in html or "مسار التتبع" in html:
            print("[PASS] Found 'مسار التتبع (Traceability)' visual diagram container.")
        else:
            print("[FAIL] Visual Traceability Diagram missing.")
            
        m = re.search(r"مسار التتبع.*?(</div>\s*</div>\s*</div>\s*</div>)", html, re.DOTALL)
        if m:
            block = m.group(0)
            if "bg-outline-variant" in block or "h-0.5" in block:
                print("  - Connector line element present: True")
            else:
                print("  - Connector line element present: False")
            
            icons = re.findall(r'<span class="material-symbols-outlined">([^<]+)</span>', block)
            labels = re.findall(r'<p class="font-label-sm[^"]*">([^<]+)</p>', block)
            details = re.findall(r'<p class="text-\[10px\][^"]*">([^<]+)</p>', block)
            print(f"  - Visual Node Icons: {icons}")
            print(f"  - Visual Node Labels: {labels}")
            print(f"  - Visual Node Values/IDs: {details}")

    elif filename == "lot-details.html":
        if "دورة حياة اللوط" in html:
            print("[PASS] Found 'دورة حياة اللوط (Lot Lifecycle Timeline)' container.")
        else:
            print("[FAIL] Lot Lifecycle Timeline container missing.")
            
        m = re.search(r"دورة حياة اللوط.*?(<!-- Related Operations Table -->|</main>)", html, re.DOTALL)
        if m:
            block = m.group(0)
            has_border = "border-r-2" in block
            print(f"  - Vertical Timeline Line element (border-r-2): {has_border}")
            steps = re.findall(r'<span class="text-xs text-on-surface-variant font-mono">([^<]+)</span>', block)
            print(f"  - Timeline Step Dates/Refs: {steps}")
            step_descs = re.findall(r'<p class="font-bold text-primary mt-1">([^<]+)</p>', block)
            print(f"  - Timeline Step Descriptions: {step_descs}")

    elif filename == "waste-monitoring.html":
        if "مراقبة الهالك" in html:
            print("[PASS] Found Waste Monitoring header.")
        kpi_count = len(re.findall(r'bg-surface-container-lowest', html))
        print(f"  - Bento KPI / Container count: {kpi_count}")
        tbl_match = "سجل الهالك التفصيلي" in html
        print(f"  - Waste Log table header present: {tbl_match}")
        troubleshoot_btns = len(re.findall(r'تتبع الهالك', html))
        print(f"  - Waste Traceability ('تتبع الهالك') action buttons: {troubleshoot_btns}")

    elif filename == "supplier-report.html":
        if "سجل الموردين والتوريدات والتتبع إلى الهالك" in html:
            print("[PASS] Found Supplier Traceability Tree Table header.")
        else:
            print("[FAIL] Supplier Traceability Tree Table header missing.")
        
        m = re.search(r"سجل الموردين والتوريدات والتتبع إلى الهالك.*?(</table>)", html, re.DOTALL)
        if m:
            block = m.group(0)
            ths = re.findall(r'<th[^>]*>([^<]+)</th>', block)
            print(f"  - Table Columns: {ths}")
            tds = re.findall(r'<td[^>]*>(.*?)</td>', block, re.DOTALL)
            clean_tds = [re.sub(r'<[^>]+>', '', td).strip() for td in tds]
            print(f"  - Traceability Row Values: {clean_tds[:10]}")
            hrefs = re.findall(r'href="([^"]+)"', block)
            print(f"  - Connected Links: {hrefs}")
