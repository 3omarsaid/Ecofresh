import os, re

base_dir = r"e:/web/exporting_erp/main_prototype"

def inspect_file(rel_path, script_index=None):
    filepath = os.path.join(base_dir, rel_path)
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    print(f"\n==========================================")
    print(f"  FULL SCRIPT INSPECTION: {rel_path}")
    print(f"==========================================")
    
    if script_index is not None:
        scripts = [m.group(0) for m in re.finditer(r'<script.*?>.*?</script>', content, re.DOTALL)]
        if script_index < len(scripts):
            s = scripts[script_index]
            print(s.encode("ascii", errors="replace").decode("ascii"))
        else:
            print(f"Script index {script_index} out of range ({len(scripts)} found)")
    else:
        print(content.encode("ascii", errors="replace").decode("ascii"))

inspect_file("pages/shipment-wizard.html", 5)
inspect_file("pages/add-transaction.html", 4)
inspect_file("pages/raw-arrival-add.html", 5)
inspect_file("js/interactions.js")
inspect_file("js/navigation.js")
