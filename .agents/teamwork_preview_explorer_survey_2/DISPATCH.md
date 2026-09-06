## 2026-08-11T09:21:01Z
You are Explorer 2 (Operations & Inventory Specialist).
Your working directory is `e:/web/exporting_erp/.agents/teamwork_preview_explorer_survey_2`.

MUST READ: Read the verbatim user request in `e:/web/exporting_erp/.agents/ORIGINAL_REQUEST.md` first.

Objective:
Survey the workspace at `e:/web/exporting_erp` to assess the current state of Operations & Costing Wizard screens (Screens 19-26) and Inventory, Waste & Traceability screens (Screens 27-31).

Tasks:
1. Examine existing files in `e:/web/exporting_erp`.
2. Assess existence and completeness of Screens 19-31:
   - Screens 19-21: `raw-purchases.html`, `raw-arrival-add.html`, `raw-purchase-details.html`
   - Screens 22-23: `packaging-purchases.html`, `supplies-arrival-add.html`
   - Screen 24: `shipments.html`
   - Screen 25: `shipment-wizard.html` (7-step wizard: Customer -> Configured Products -> Station -> Lot -> Raw Consumption & Waste % -> Carton Consumption & Waste -> Costs & Overrides -> Financial Summary & Profit Margin)
   - Screen 26: `shipment-details.html`
   - Screens 27-28: `inventory-raw.html`, `inventory-cartons.html`
   - Screen 29: `stock-movements.html`
   - Screen 30: `lot-details.html`
   - Screen 31: `waste-monitoring.html`
3. Analyze required interactive business rules & dynamic relationships:
   - Customer Product Agreements auto-filling Packaging & Selling Price
   - Station selection loading raw/packaging warehouses, default station rates, default contractor & rate
   - Raw Material Lot traceability
   - Calculated Waste & Carton Waste
4. Write your findings to `e:/web/exporting_erp/.agents/teamwork_preview_explorer_survey_2/analysis.md` and `handoff.md`.
5. Send a message to orchestrator upon completion.
