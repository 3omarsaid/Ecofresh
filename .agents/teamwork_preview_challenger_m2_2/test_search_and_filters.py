import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"e:\web\exporting_erp\main_prototype"
pages_dir = os.path.join(base_dir, "pages")

files = sorted([f for f in os.listdir(pages_dir) if f.endswith(".html")])

print(f"Inspecting Search Inputs and Table Filters across {len(files)} pages...\n")

table_pages = []
search_input_details = {}
table_filter_details = {}

for f in files:
    filepath = os.path.join(pages_dir, f)
    with open(filepath, "r", encoding="utf-8") as fp:
        html = fp.read()
    
    # Check if page has tables
    has_table = "<table" in html
    if has_table:
        table_pages.append(f)
    
    # Search inputs
    searches = re.findall(r'<input\b[^>]*placeholder="([^"]*بحث[^"]*)"[^>]*>', html)
    search_input_details[f] = searches
    
    # Select dropdown filters
    selects = re.findall(r'<select\b[^>]*>(.*?)</select>', html, re.DOTALL)
    options_summary = []
    for s in selects:
        opts = re.findall(r'<option[^>]*>(.*?)</option>', s)
        options_summary.append(opts[:3]) # first 3 options
    table_filter_details[f] = options_summary

print(f"Total pages containing data tables: {len(table_pages)} / {len(files)}")
print(f"Table pages list: {table_pages}\n")

print("--- Form Search Inputs ---")
for f, searches in search_input_details.items():
    if searches:
        print(f"  {f}: {searches}")

print("\n--- Table Dropdown Filters ---")
for f, filters in table_filter_details.items():
    if filters:
        print(f"  {f}: {len(filters)} select elements -> Sample options: {filters[:2]}")

