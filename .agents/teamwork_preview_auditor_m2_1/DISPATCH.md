## 2026-08-11T09:46:15Z

<USER_REQUEST>
You are Forensic Auditor 1 (Integrity Forensics Auditor).
Your working directory is `e:/web/exporting_erp/.agents/teamwork_preview_auditor_m2_1`.

MUST READ:
- Read `e:/web/exporting_erp/.agents/ORIGINAL_REQUEST.md`.
- Read `e:/web/exporting_erp/PROJECT.md`.

Objective:
Perform comprehensive forensic integrity audit across all 40 operational, inventory, financial, and reporting prototype screens in `e:/web/exporting_erp/main_prototype/`.

Tasks:
1. Check for integrity violations:
   - Ensure NO hardcoded test result overrides or fake verification flags in HTML/JS source code.
   - Ensure NO dummy / facade empty implementations that display fake statistics without actual UI structure.
   - Ensure all 40 screens contain genuine, rich Arabic UI markup, authentic data tables, forms, charts, and interactive handlers.
   - Ensure strict compliance with Arabic RTL enterprise styling (`dir="rtl" lang="ar"`, IBM Plex Sans Arabic font, Forest Green `#012d1d`, Ice Blue `#F8F9FA`, Professional Blue `#0054cd`).
2. Examine `shipment-wizard.html` to confirm that all 7 steps are genuinely implemented in the DOM with real input controls and calculation event handlers.
3. Document your systematic audit steps, file evidence, and explicit verdict (`CLEAN` or `INTEGRITY VIOLATION`) in `e:/web/exporting_erp/.agents/teamwork_preview_auditor_m2_1/handoff.md`.
4. Send a message to orchestrator upon completion.
</USER_REQUEST>
