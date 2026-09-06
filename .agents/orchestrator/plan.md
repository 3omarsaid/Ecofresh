# Orchestrator Milestone Plan — Nilotic Frost ERP Prototype

## Overview
Nilotic Frost ERP is a frozen-food export system with an Arabic RTL UI/UX prototype covering 40 operational, inventory, waste traceability, shipment costing, financial statement, payment, and reporting screens in one cohesive enterprise design.

## Strategy: Project Pattern with Dual Track Architecture
We follow the strict Project Pattern orchestration:
1. **Phase 0: Workspace & Specification Survey**
   - Dispatch 3 parallel Explorer subagents (`teamwork_preview_explorer`) to inspect existing workspace files in `e:/web/exporting_erp`, verify missing/existing screens, CSS/JS shared assets, RTL shell, data models, and business rule interactions.
   - Aggregate findings into `PROJECT.md § Feature Inventory` (listing all 40 screens and underlying business rules).

2. **Phase 1: Milestone Decomposition & Interface Contracts**
   Decompose the 40 screens into cohesive milestone blocks (3-7 milestones):
   - **M1: Core Shell & Master Data Configuration (Screens 01-18)**
     - Layout, IBM Plex Sans Arabic typography, color palette, sidebar navigation, search/header.
     - Products (02-04), Cartons (05-06), Customers & Agreements (07-10), Suppliers (11-13), Stations (14-16), Contractors (17-18), Executive Dashboard (01).
   - **M2: Operations & Shipment Costing Engine (Screens 19-26)**
     - Raw Material Purchases & Lot preview (19-21), Packaging Purchases (22-23), Shipment Registry (24), 7-Step Create Shipment Wizard with strict dependency auto-fill (25), Shipment Details & Traceability tree (26).
   - **M3: Inventory, Waste Traceability & Stock Movements (Screens 27-31)**
     - Raw Inventory (27), Packaging Inventory (28), Stock Movements Ledger (29), Lot Details visual timeline (30), Waste Monitoring Hub (31).
   - **M4: Financial Statements, Payments & Treasury (Screens 32-36)**
     - Financial Statements ledger (32), Party Statement Detail with running balance timeline (33), Payments & Collections (34), Add Transaction with live balance preview (35), Treasury & Banks (36).
   - **M5: Executive Monitoring & Analytics Reports (Screens 37-40)**
     - Shipment Profitability (37), Station Monitoring (38), Supplier Report (39), Customer Report (40).
   - **E2E Testing Track**:
     - Parallel track constructing opaque-box test suite (Tiers 1-4) published as `TEST_READY.md`.

3. **Phase 2: Execution & Verification Gates**
   - For each milestone:
     a. Dispatch 3 Explorers (`teamwork_preview_explorer`) for architectural/implementation guidance.
     b. Dispatch Worker (`teamwork_preview_worker`) to implement screens, HTML/CSS/JS, logic, and self-test.
     c. Dispatch 2 Reviewers (`teamwork_preview_reviewer`) to verify functionality, RTL UI consistency, and business rules.
     d. Dispatch 2 Challengers (`teamwork_preview_challenger`) for empirical validation.
     e. Dispatch Forensic Auditor (`teamwork_preview_auditor`) for zero-tolerance integrity check.
     f. Evaluate Gate (`GATE_STATUS.md`). Re-iterate on failure.

4. **Phase 3: Final Acceptance & Reporting**
   - Phase 1 of Final Milestone: Pass 100% of E2E test suite (`TEST_READY.md`).
   - Phase 2: Adversarial Coverage Hardening (Tier 5).
   - Produce final human report summarizing all 40 screens and verified business rules.
