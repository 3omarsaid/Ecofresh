## 2026-08-11T06:58:40Z

You are Worker 2 (Interactive Engine & Formula Remediation Specialist).
Your working directory is `e:/web/exporting_erp/.agents/teamwork_preview_worker_m2_2`.

MUST READ:
- Read `e:/web/exporting_erp/.agents/ORIGINAL_REQUEST.md`.
- Read `e:/web/exporting_erp/PROJECT.md`.
- Read `e:/web/exporting_erp/.agents/orchestrator/GATE_STATUS.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Objective:
Remediate the 4 defects identified during Iteration 1 Gate Verification across `interactions.js`, `add-transaction.html`, `raw-arrival-add.html`, and `shipment-wizard.html`.

Tasks:
1. `main_prototype/js/interactions.js`:
   - Inspect the generic wizard click listener around lines 51-87 (`const stepContainers = document.querySelectorAll('form, .step-wizard-container');`).
   - Modify the condition so it ignores clicks if the button is inside `shipment-wizard.html` or inside a container with a custom wizard script, preventing the generic 4-step toast ("الخطوة X من 4") from conflicting with the 7-step Create Shipment Wizard.

2. `main_prototype/pages/add-transaction.html`:
   - Add inline JavaScript code that listens to `input` / `change` events on transaction amount, transaction type (Payment vs Collection / Debit vs Credit), and party selection.
   - Dynamically compute and display the Live Balance Preview widget in real time:
     `New Balance = Current Balance + Amount` (for Collections/Credits) or `Current Balance - Amount` (for Payments/Debits).
   - Format numbers cleanly with Arabic thousand separators or `.2f`.

3. `main_prototype/pages/raw-arrival-add.html`:
   - Add inline JavaScript code that listens to `input` events on gross weight, net weight, unit price per KG, and transport fees.
   - Dynamically update the Live Summary side card fields (Raw Total Price, Transport Fee, Total Purchase Amount, and Lot Preview badge) in real time.

4. `main_prototype/pages/shipment-wizard.html`:
   - Align Raw Material Cost calculation in `calculateAll()` to `netKg * rawUnitCost` (or `withdrawnKg * rawUnitCost` as configured in agreement).
   - Align Packaging Waste % formula to `(cartonWasteQty / cartonsNeeded) * 100`.

5. Write your detailed changes and handoff report to:
   - `e:/web/exporting_erp/.agents/teamwork_preview_worker_m2_2/changes.md`
   - `e:/web/exporting_erp/.agents/teamwork_preview_worker_m2_2/handoff.md`
6. Send a message to orchestrator upon completion.
