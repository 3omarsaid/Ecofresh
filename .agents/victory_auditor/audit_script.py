import os
import glob
import re

base_dir = r"e:/web/exporting_erp/main_prototype"
js_files = glob.glob(os.path.join(base_dir, "**/*.js"), recursive=True)
html_files = glob.glob(os.path.join(base_dir, "**/*.html"), recursive=True)

print("=== Phase B: Anti-Pattern & Integrity Forensics Scan ===")
print(f"Inspecting {len(js_files)} JS files and {len(html_files)} HTML files.")

prohibited_patterns = [
    (r"return\s+true\s*;?\s*//\s*bypass", "Hardcoded bypass return"),
    (r"return\s+\d+\s*;?\s*//\s*fake", "Fake hardcoded return"),
    (r"//\s*TODO:\s*implement", "Unimplemented TODO comment"),
    (r"NotImplementedError", "Unimplemented error marker"),
    (r"alert\([\"'`]mock[\"'`]\)", "Mock alert marker"),
    (r"fake_pass", "Fake pass token"),
    (r"hardcoded_test", "Hardcoded test token")
]

violations = []
for filepath in js_files + html_files:
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        for pattern, desc in prohibited_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                rel = os.path.relpath(filepath, base_dir)
                violations.append((rel, desc, len(matches)))

if violations:
    print(f"VIOLATIONS FOUND: {len(violations)}")
    for rel, desc, count in violations:
        print(f"  [FAIL] {rel}: {desc} ({count} occurrences)")
else:
    print("PASS: No prohibited hardcode/facade/bypass patterns found in source code.")
