## 2026-08-11T09:38:32Z
You are Worker 1 (Operations & Wizard Specialist).
Your working directory is `e:/web/exporting_erp/.agents/teamwork_preview_worker_m2_1`.

MUST READ:
- Read verbatim user request in `e:/web/exporting_erp/.agents/ORIGINAL_REQUEST.md`.
- Read project scope & feature inventory in `e:/web/exporting_erp/PROJECT.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective:
Complete the 7-Step Create Shipment Wizard (`e:/web/exporting_erp/main_prototype/pages/shipment-wizard.html`).

Tasks:
1. Open and inspect `e:/web/exporting_erp/main_prototype/pages/shipment-wizard.html`.
2. Observe current implementation where Steps 4, 5, and 6 DOM markup is missing and JavaScript skips from Step 3 to Step 7.
3. Build complete, beautiful Arabic RTL DOM sections for:
   - **Step 4**: Carton / Packaging Consumption & Waste (select packaging item, unit price, quantity required, calculated carton cost & carton waste %).
   - **Step 5**: Operational Costs & Contractor Rates (Station processing rate per KG/ton, select contractor & rate, inland freight/shipping fee, manual cost override input fields).
   - **Step 6**: Live Financial Summary & Profit Margin Preview (total sales revenue, itemized raw material + carton + station + contractor + freight cost breakdown, total shipment cost, calculated net profit, net profit margin %).
4. Update the step navigation JavaScript so `visibleSteps = [1, 2, 3, 4, 5, 6, 7]`. Make Next/Previous buttons, step progress indicators, and active step panel toggles work seamlessly across all 7 steps.
5. Preserve unified enterprise design: IBM Plex Sans Arabic font, Tailwind CSS classes (`bg-[#012d1d]`, `bg-[#f8f9fa]`, `text-[#0054cd]`, etc.), breadcrumbs, sidebar, header, and toast notifications.
6. Verify your implementation by checking HTML markup completeness and running any necessary structural validation.
7. Write your changes and handoff report to:
   - `e:/web/exporting_erp/.agents/teamwork_preview_worker_m2_1/changes.md`
   - `e:/web/exporting_erp/.agents/teamwork_preview_worker_m2_1/handoff.md`
8. Send a message to orchestrator upon completion.
