import os

base_dir = r"e:/web/exporting_erp/main_prototype"

print("=== VERIFYING FORMULAS & INTERACTION ENACTION ===")

files_to_inspect = [
    ("pages/shipment-wizard.html", ["calculateAll", "function updateUI", "profit", "waste"]),
    ("pages/add-transaction.html", ["updateBalance", "currentBalance", "amount", "newBalance"]),
    ("pages/raw-arrival-add.html", ["totalWeight", "unitPrice", "totalCost", "calculateTotal"]),
    ("js/interactions.js", ["calculate", "balance", "waste", "toast"])
]

for rel_p, keywords in files_to_inspect:
    abs_p = os.path.join(base_dir, rel_p)
    print(f"\n==========================================")
    print(f"FILE: {rel_p}")
    print(f"==========================================")
    if os.path.exists(abs_p):
        with open(abs_p, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        for kw in keywords:
            pos = content.find(kw)
            if pos != -1:
                snippet = content[max(0, pos-100):min(len(content), pos+400)]
                snippet_clean = snippet.encode("ascii", errors="replace").decode("ascii")
                print(f"\n--- Keyword '{kw}' snippet ---")
                print(snippet_clean)
            else:
                print(f"  [!] Keyword '{kw}' not found in {rel_p}")
    else:
        print(f"  [!] File not found: {rel_p}")
