import os, re

base_dir = r"e:/web/exporting_erp/main_prototype"

# Inspect script in add-transaction.html
with open(os.path.join(base_dir, "pages/add-transaction.html"), "r", encoding="utf-8") as f:
    c = f.read()

scripts = [m.group(0) for m in re.finditer(r'<script.*?>.*?</script>', c, re.DOTALL)]
print("=== ADD TRANSACTION SCRIPT ===")
print(scripts[-1].encode("ascii", errors="replace").decode("ascii"))

# Inspect script in shipment-wizard.html
with open(os.path.join(base_dir, "pages/shipment-wizard.html"), "r", encoding="utf-8") as f:
    c_wiz = f.read()

scripts_wiz = [m.group(0) for m in re.finditer(r'<script.*?>.*?</script>', c_wiz, re.DOTALL)]
print("\n=== SHIPMENT WIZARD SCRIPT ===")
print(scripts_wiz[-1].encode("ascii", errors="replace").decode("ascii"))
