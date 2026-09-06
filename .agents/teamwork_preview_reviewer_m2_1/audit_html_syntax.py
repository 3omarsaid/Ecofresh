import os
import glob
import re

root_dir = r'e:\web\exporting_erp\main_prototype'
html_files = glob.glob(os.path.join(root_dir, '**', '*.html'), recursive=True)

print("--- AUDITING HTML SYNTAX / STRAY TAGS ---")
for filepath in html_files:
    rel_path = os.path.relpath(filepath, root_dir)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    stray_button_a = len(re.findall(r'</button>\s*</a>', content))
    stray_a_open = len(re.findall(r'<a [^>]*class="[^"]*btn[^"]*"[^>]*>\s*<button', content))
    
    if stray_button_a > 0 or stray_a_open > 0:
        print(f"File: {rel_path} -> Mismatched button/a tags found! '</button></a>': {stray_button_a}")
