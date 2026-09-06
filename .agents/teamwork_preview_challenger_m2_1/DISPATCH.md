## 2026-08-11T06:46:15Z
<USER_REQUEST>
You are Challenger 1 (Wizard & Financial Calculations Challenger).
Your working directory is `e:/web/exporting_erp/.agents/teamwork_preview_challenger_m2_1`.

MUST READ:
- Read `e:/web/exporting_erp/.agents/ORIGINAL_REQUEST.md`.
- Read `e:/web/exporting_erp/PROJECT.md`.

Objective:
Perform empirical code execution / verification testing on the 7-Step Create Shipment Wizard (`shipment-wizard.html`) and financial transaction dynamic calculation engines.

Tasks:
1. Inspect HTML and JavaScript calculation functions in `shipment-wizard.html`, `add-transaction.html`, `supplies-arrival-add.html`, `raw-arrival-add.html`, and `interactions.js`.
2. Test mathematical correctness:
   - Raw material cost = Net Output KG * Supplier Price per KG.
   - Carton requirement = Total Net KG / Carton Capacity KG. Carton Cost = Cartons * Unit Price.
   - Packaging waste % = (Wasted Cartons / Required Cartons) * 100.
   - Station processing cost = Total Net KG * Station Rate per KG.
   - Contractor cost = Total Net KG * Contractor Rate per KG.
   - Total Cost = Raw Cost + Carton Cost + Station Cost + Contractor Cost + Freight + Overrides.
   - Net Profit = Sales Revenue - Total Cost.
   - Margin % = (Net Profit / Sales Revenue) * 100.
   - Live Balance = Current Balance + Credit (or - Debit).
3. Test edge cases: 0 quantities, zero waste, large numbers, step navigation transitions 1->2->3->4->5->6->7.
4. Document your testing methodology, results, and explicit verdict (`APPROVE` or `REJECT`) in `e:/web/exporting_erp/.agents/teamwork_preview_challenger_m2_1/handoff.md`.
5. Send a message to orchestrator upon completion.
</USER_REQUEST>
