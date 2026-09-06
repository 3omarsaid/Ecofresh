import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"e:\web\exporting_erp\main_prototype"
pages_dir = os.path.join(base_dir, "pages")

pages = [f for f in os.listdir(pages_dir) if f.endswith(".html")]

print(f"Scanning {len(pages)} HTML pages in main_prototype/pages for data continuity entities...\n")

patterns = {
    "Lot_IDs": r'\b(LOT-[A-Za-z0-9-]+|L-[0-9]+)\b',
    "Shipment_IDs": r'\b(SHP-[A-Za-z0-9-]+)\b',
    "PO_IDs": r'\b(PUR-[A-Za-z0-9-]+|PO-[0-9]+|REF-RAW-[0-9]+)\b',
    "Suppliers": r'(شركة الخير|مزارع الدلتا|الشركة الزراعية المتحدة|أجرولينك|مزارع النيل|مزرعة الأمل|شركة الوادي)',
    "Stations": r'(محطة النور|محطة العبور|الفرز الآلي|التجميد السريع|الغسيل والتجهيز)',
    "Customers": r'(شركة سما|شركة الأغذية العالمية|شركة الأمل للتصدير|شركة الفارس)'
}

entity_map = {}

for p in sorted(pages):
    filepath = os.path.join(pages_dir, p)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    entity_map[p] = {}
    for cat, pat in patterns.items():
        matches = set(re.findall(pat, content))
        if matches:
            entity_map[p][cat] = list(matches)

for p, data in entity_map.items():
    if data:
        print(f"--- {p} ---")
        for cat, vals in data.items():
            print(f"  {cat}: {vals}")
