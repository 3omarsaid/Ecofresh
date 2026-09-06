## 2026-08-11T06:46:15Z
Review the complete RTL Enterprise Shell, navigation layout, shared CSS/JS, and Master Data screens (Screens 01-18) plus raw purchases & arrival forms (Screens 19-20).

Tasks:
1. Verify layout compliance: `<html dir="rtl" lang="ar">`, IBM Plex Sans Arabic font, color palette (`#012d1d`, `#F8F9FA`, `#0054cd`), sidebar navigation, header search bar, breadcrumbs, notifications.
2. Verify completeness and quality of Screens 01-20:
   - Screen 01: Executive Dashboard
   - Screens 02-04: Products catalog, add form, details hub
   - Screens 05-06: Cartons catalog, add form
   - Screens 07-10: Customers directory, add form, details hub, customer-product agreements
   - Screens 11-13: Suppliers directory, add form & pricing, details hub
   - Screens 14-16: Stations directory, add form, details hub (auto-linked warehouses)
   - Screens 17-18: Contractors directory, add form
   - Screens 19-20: Raw material purchases & arrival receipt form with lot preview box
3. Verify links between pages resolve correctly without 404 broken links.
4. Document your evaluation and explicit verdict (`APPROVE` or `REQUEST_CHANGES`) in `e:/web/exporting_erp/.agents/teamwork_preview_reviewer_m2_1/handoff.md`.
5. Send a message to orchestrator upon completion.
