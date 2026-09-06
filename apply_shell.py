
import os
import re

shell_head = """<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>{title}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#012d1d",
                        "primary-container": "#1b4332",
                        "secondary": "#0054cd",
                        "background": "#f8f9fa",
                        "surface": "#ffffff",
                        "surface-variant": "#e1e3e4",
                        "on-surface": "#191c1d",
                        "on-surface-variant": "#414844",
                        "outline": "#717973",
                        "outline-variant": "#c1c8c2",
                        "error": "#ba1a1a"
                    }
                }
            }
        }
    </script>
<link rel="stylesheet" href="../css/global.css"/>
<link rel="stylesheet" href="../css/custom.css"/>
<script src="../js/navigation.js" defer></script>
<script src="../js/interactions.js" defer></script>
<script src="../js/app.js" defer></script>
<style>
  /* Custom styles ported from prototype 2 */
  .font-data-mono { font-family: "IBM Plex Sans Arabic", sans-serif; }
  .font-title-sm { font-family: "IBM Plex Sans Arabic", sans-serif; }
  .font-label-sm { font-family: "IBM Plex Sans Arabic", sans-serif; }
  .font-body-md { font-family: "IBM Plex Sans Arabic", sans-serif; }
  .font-headline-md { font-family: "IBM Plex Sans Arabic", sans-serif; }
  .font-display-lg { font-family: "IBM Plex Sans Arabic", sans-serif; }
</style>
</head>
<body class="bg-background text-on-surface min-h-screen w-full flex flex-col font-[\"IBM_Plex_Sans_Arabic\"] antialiased overflow-x-hidden">
  <aside id="app-sidebar" class="fixed right-0 top-0 h-full w-[260px] bg-surface border-l border-outline-variant flex flex-col z-50 overflow-y-auto shadow-md transition-transform duration-300 transform translate-x-full md:translate-x-0"></aside>
  <main class="flex-1 w-full md:w-[calc(100%-260px)] md:mr-[260px] pt-16 min-h-screen flex flex-col p-4 md:p-6 space-y-6 overflow-x-hidden box-border">
"""

shell_foot = """
  </main>
</body>
</html>
"""

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # extract title
    title_match = re.search(r"<title>(.*?)</title>", content)
    title = title_match.group(1) if title_match else "???? ??????? ??????"

    # extract main content. we need everything inside <main> and before <script> or </body>
    main_match = re.search(r"<main[^>]*>(.*?)</main>", content, re.DOTALL)
    if not main_match:
        print(f"Could not find <main> in {filepath}")
        return

    main_content = main_match.group(1)

    # find any scripts at the end of the file
    scripts_match = re.search(r"</main>\s*(<script>.*?</script>|<div id=\"toastContainer\".*?</div>)", content, re.DOTALL)
    extra_scripts = ""
    # extract all scripts after </main> or at the bottom
    scripts_all = re.findall(r"<script[^>]*>.*?</script>", content[content.find("</main>"):], re.DOTALL)
    
    # We also need modals like <div id="newOperationModal" ...>
    modals_match = re.search(r"</main>\s*(<div[^>]*modal[^>]*>.*?</div>\s*)+<script", content, re.DOTALL | re.IGNORECASE)
    modals = ""
    if modals_match:
        # just grab everything between </main> and the first <script> after it
        between = content[content.find("</main>")+7 : content.rfind("<script")]
        modals = between

    # Re-assemble
    new_content = shell_head.replace("{title}", title) + main_content + "\n" + modals + "\n" + "\n".join(scripts_all) + shell_foot
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Processed {filepath}")

process_file(r"e:\web\exporting_erp\base_prototype\pages\processing-operations.html")
process_file(r"e:\web\exporting_erp\base_prototype\pages\client-orders.html")

process_file(r"e:\web\exporting_erp\base_prototype\pages\shipment-create.html")
