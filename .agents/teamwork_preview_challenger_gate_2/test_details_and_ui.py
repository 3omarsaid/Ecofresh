import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(r"e:\web\exporting_erp\main_prototype")

def test_shipment_details():
    filepath = BASE_DIR / "pages" / "shipment-details.html"
    content = filepath.read_text(encoding="utf-8")

    print("\n=== TEST 1: shipment-details.html Traceability Audit ===")

    # 1. Traceability Tree header
    has_trace_header = "مسار التتبع" in content
    print(f"[Traceability Header Found]: {has_trace_header}")

    # Check traceability tree nodes
    node_matches = re.findall(r'<p class="font-label-sm text-label-sm font-semibold[^"]*">([^<]+)</p>\s*<p class="text-\[10px\] text-on-surface-variant">([^<]+)</p>', content)
    print(f"[Traceability Nodes Detected]: {len(node_matches)}")
    for i, (title, detail) in enumerate(node_matches, 1):
        print(f"  Node {i}: {title} ({detail})")

    # Check Raw material scale & waste tracking
    has_raw_balance = "ميزان الخامات" in content
    has_waste_trace = "تتبع الهالك (Waste)" in content
    print(f"[Raw Material Scale Section]: {has_raw_balance}")
    print(f"[Waste Traceability Section]: {has_waste_trace}")

    # Check waste breakdown items
    waste_items = re.findall(r'<span class="font-body-md text-body-md text-on-background">([^<]+)</span>\s*</div>\s*<span class="font-data-tabular text-data-tabular">([^<]+)</span>', content)
    print(f"[Waste Breakdown Items]: {waste_items}")

def test_lot_details():
    filepath = BASE_DIR / "pages" / "lot-details.html"
    content = filepath.read_text(encoding="utf-8")

    print("\n=== TEST 2: lot-details.html Visual Timeline Audit ===")

    # Timeline header
    has_timeline_header = "دورة حياة اللوط" in content
    print(f"[Timeline Header Found]: {has_timeline_header}")

    # Timeline steps
    steps = re.findall(r'<span class="text-xs text-on-surface-variant font-mono">([^<]+)</span>\s*<p class="font-bold text-primary mt-1">([^<]+)</p>', content)
    print(f"[Timeline Steps Count]: {len(steps)}")
    for idx, (header, desc) in enumerate(steps, 1):
        print(f"  Step {idx}: Header='{header}' | Desc='{desc}'")

    # Remaining quantity badge
    rem_qty = re.search(r'<span class="text-2xl font-bold text-emerald-700 font-mono">([^<]+)', content)
    print(f"[Lot Remaining Quantity]: {rem_qty.group(1).strip() if rem_qty else 'N/A'}")

    # Cross-links check
    sup_link = 'href="supplier-details.html"' in content
    st_link = 'href="station-details.html"' in content
    shp_link = 'href="shipment-details.html"' in content
    cust_link = 'href="customer-details.html"' in content
    print(f"[Link to Supplier Details]: {sup_link}")
    print(f"[Link to Station Details]: {st_link}")
    print(f"[Link to Shipment Details]: {shp_link}")
    print(f"[Link to Customer Details]: {cust_link}")

def test_waste_monitoring():
    filepath = BASE_DIR / "pages" / "waste-monitoring.html"
    content = filepath.read_text(encoding="utf-8")

    print("\n=== TEST 3: waste-monitoring.html UI Audit ===")

    # KPI Cards
    has_total_waste = "إجمالي الهالك (طن)" in content
    has_raw_waste = "هالك خام (طن)" in content
    has_pkg_waste = "هالك تعبئة (طن)" in content
    has_pct_waste = "نسبة الهالك الكلية" in content
    has_station_waste = "أعلى محطة هالك" in content

    print(f"[KPI Total Waste]: {has_total_waste}")
    print(f"[KPI Raw Waste]: {has_raw_waste}")
    print(f"[KPI Packaging/Carton Waste]: {has_pkg_waste}")
    print(f"[KPI Waste Percentage]: {has_pct_waste}")
    print(f"[KPI Highest Waste Station]: {has_station_waste}")

    # Table columns
    cols = ["الشحنة", "اللوط", "المورد", "محطة التشغيل", "المسحوب (كجم)", "المنتج (كجم)", "الهالك (كجم)", "% الهالك", "التاريخ", "إجراءات"]
    present_cols = [col for col in cols if col in content]
    print(f"[Table Columns Present]: {len(present_cols)}/{len(cols)}")

    # Action buttons
    action_btns = content.count("تتبع الهالك")
    print(f"['تتبع الهالك' Action Buttons Count]: {action_btns}")

if __name__ == "__main__":
    test_shipment_details()
    test_lot_details()
    test_waste_monitoring()
