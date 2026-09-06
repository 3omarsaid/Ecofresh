
import re

filepath = r"e:\web\exporting_erp\base_prototype\js\navigation.js"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

new_menu = """  const menuStructure = [
    {
      category: "???? ??????",
      items: [
        { name: "???????? (???? ??????)", icon: "dashboard", href: isRoot ? "index.html" : "../index.html", key: "index.html" }
      ]
    },
    {
      category: "???????? ????????",
      items: [
        { name: "????????", icon: "nutrition", href: `${pagesPath}products.html`, key: "products.html" },
        { name: "??????????", icon: "inventory_2", href: `${pagesPath}supplies.html`, key: "supplies.html" },
        { name: "??????? ???????????", icon: "groups", href: `${pagesPath}customers.html`, key: "customers.html" },
        { name: "????????", icon: "local_shipping", href: `${pagesPath}suppliers.html`, key: "suppliers.html" },
        { name: "???????", icon: "factory", href: `${pagesPath}stations.html`, key: "stations.html" },
        { name: "?????????", icon: "badge", href: `${pagesPath}contractors.html`, key: "contractors.html" }
      ]
    },
    {
      category: "????????",
      items: [
        { name: "?????? ???????", icon: "autorenew", href: `${pagesPath}processing-operations.html`, key: "processing-operations.html" },
        { name: "?????? ???????", icon: "receipt_long", href: `${pagesPath}client-orders.html`, key: "client-orders.html" },
        { name: "????? ???????", icon: "conveyor_belt", href: `${pagesPath}shipments.html`, key: "shipments.html" }
      ]
    },
    {
      category: "??????? ???????",
      items: [
        { name: "????? ?????", icon: "warehouse", href: `${pagesPath}inventory-raw.html`, key: "inventory-raw.html" },
        { name: "????? ?????? ??????", icon: "inventory", href: `${pagesPath}inventory.html`, key: "inventory.html" },
        { name: "?????? ??????", icon: "delete_history", href: `${pagesPath}waste-monitoring.html`, key: "waste-monitoring.html" }
      ]
    },
    {
      category: "????????",
      items: [
        { name: "??? ????????", icon: "receipt_long", href: `${pagesPath}financial-statements.html`, key: "financial-statements.html" },
        { name: "????????? ??????????", icon: "account_balance_wallet", href: `${pagesPath}payments-collections.html`, key: "payments-collections.html" },
        { name: "??????? ???????", icon: "account_balance", href: `${pagesPath}treasury-banks.html`, key: "treasury-banks.html" }
      ]
    },
    {
      category: "????????",
      items: [
        { name: "???????? ??????????", icon: "analytics", href: `${pagesPath}reports.html`, key: "reports.html" }
      ]
    }
  ];"""

# Replace the existing menuStructure definition
content = re.sub(r"const menuStructure = \[\s*\{.*?\}\s*\];", new_menu, content, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

