import os

base_dir = r"e:/web/exporting_erp/main_prototype"

print("=== VERIFYING FORMULAS & INTERACTION ENACTION ===")

# 1. Inspect shipment-wizard.html calculateAll() or inline script
wiz_path = os.path.join(base_dir, "pages", "shipment-wizard.html")
with open(wiz_path, "r", encoding="utf-8") as f:
    wiz_code = f.read()

print(f"\n--- `pages/shipment-wizard.html` Script snippet ---")
script_idx = wiz_code.find("<script>")
if script_idx != -1:
    print(wiz_code[script_idx:script_idx+1500])
else:
    print("No inline script tag found in shipment-wizard.html, checking external JS.")

# 2. Inspect add-transaction.html script snippet
trans_path = os.path.join(base_dir, "pages", "add-transaction.html")
with open(trans_path, "r", encoding="utf-8") as f:
    trans_code = f.read()

print(f"\n--- `pages/add-transaction.html` Script snippet ---")
script_idx = trans_code.find("<script>")
if script_idx != -1:
    print(trans_code[script_idx:script_idx+1500])

# 3. Inspect raw-arrival-add.html script snippet
raw_path = os.path.join(base_dir, "pages", "raw-arrival-add.html")
with open(raw_path, "r", encoding="utf-8") as f:
    raw_code = f.read()

print(f"\n--- `pages/raw-arrival-add.html` Script snippet ---")
script_idx = raw_code.find("<script>")
if script_idx != -1:
    print(raw_code[script_idx:script_idx+1500])
