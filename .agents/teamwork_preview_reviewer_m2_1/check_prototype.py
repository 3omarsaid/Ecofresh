import os
import glob
import re

root_dir = r'e:\web\exporting_erp\main_prototype'
html_files = glob.glob(os.path.join(root_dir, '**', '*.html'), recursive=True)

print("--- DETAILED PAGE HEAD INSPECTION ---")
for filepath in html_files:
    rel_path = os.path.relpath(filepath, root_dir)
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    has_font_google = 'IBM+Plex+Sans+Arabic' in content or 'IBM Plex Sans Arabic' in content
    has_global_css = 'global.css' in content
    has_custom_css = 'custom.css' in content
    has_nav_js = 'navigation.js' in content
    has_interactions_js = 'interactions.js' in content
    has_app_js = 'app.js' in content
    has_rtl = 'dir="rtl"' in content or "dir='rtl'" in content
    has_lang = 'lang="ar"' in content or "lang='ar'" in content
    
    missing = []
    if not has_font_google: missing.append("GoogleFont:IBM Plex Sans Arabic")
    if not has_global_css: missing.append("global.css")
    if not has_custom_css: missing.append("custom.css")
    if not has_nav_js: missing.append("navigation.js")
    if not has_interactions_js: missing.append("interactions.js")
    if not has_app_js: missing.append("app.js")
    if not has_rtl: missing.append("dir=rtl")
    if not has_lang: missing.append("lang=ar")
    
    if missing:
        print(f"File: {rel_path} --> Missing: {', '.join(missing)}")
    else:
        print(f"File: {rel_path} --> ALL SHELL CHECKS PASSED")
