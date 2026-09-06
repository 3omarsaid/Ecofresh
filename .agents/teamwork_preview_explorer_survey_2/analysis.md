# Operations, Costing Wizard & Inventory Prototype Survey Report (Screens 19–31)

## Executive Summary
This report presents an in-depth survey of the **Operations & Costing Wizard screens (Screens 19–26)** and **Inventory, Waste & Traceability screens (Screens 27–31)** for the **Nilotic Frost ERP** system located at `e:/web/exporting_erp/main_prototype/pages`.

All 13 screens exist within `main_prototype/pages/` and follow a unified Arabic RTL layout (IBM Plex Sans Arabic font, Forest Green `#012d1d`, Ice Blue `#f8f9fa`, Professional Blue `#0054cd`, Tailwind CSS Material-style styling). Most screens are well-structured with high visual quality, clear data presentation, and mock data. However, functional gaps exist in interactive dynamic calculations and multi-step wizard step implementations (notably in Screen 25).

---

## Detailed Assessment of Screens 19–31

### Group 1: Operations & Costing Wizard (Screens 19–26)

#### Screen 19: Raw Material Purchases (`raw-purchases.html`)
- **File Location**: `main_prototype/pages/raw-purchases.html`
- **Purpose**: Raw Material Purchases registry table and quick entry receipt form.
- **Current State & Layout**: 
  - Top header with active badge and navigation breadcrumbs.
  - Bento grid layout containing:
    - **Entry Form (8 cols)**: Supplier dropdown, Raw Product dropdown, Station dropdown, Auto-filled Warehouse (disabled input), Quantity (KG), Default Price, Actual Price (EGP).
    - **Cost Summary & Traceability Card (4 cols)**: Raw value calculation preview, Transport freight toggle checkbox/input, Total cost, and Lot number preview (`LOT-STB-23-089`).
  - **Recent Receipts Table**: Lists receipt code (`REC-23-0891`), date, supplier (`شركة الخير`), product (`فراولة`), station (`محطة النور`), quantity, price, total, and status badge (`قيد المراجعة` / `مكتمل`).
- **Gaps & Dynamic Logic**: Form total calculations are currently static HTML values. Form submission uses generic toast notification from `interactions.js`.

#### Screen 20: Add Raw Material Arrival (`raw-arrival-add.html`)
- **File Location**: `main_prototype/pages/raw-arrival-add.html`
- **Purpose**: Dedicated transactional form for recording raw material arrivals at stations.
- **Current State & Layout**:
  - Divided into 4 clear fieldset sections:
    1. **Basic Information**: Date, Supplier dropdown (`مزرعة النيل الأخضر`), Raw Product dropdown, Station & auto-filled warehouse (`مخزن الاستلام الخام A1`).
    2. **Quantity & Price**: Quantity input with unit selector, Default reference price (15.50 EGP), Actual price.
    3. **Transport (Nawlon)**: Carrier input, transport cost input.
    4. **Document & Notes**: Document/waybill number (`DOC-2023-102`), notes textarea.
  - Sticky right column with **Live Summary Card** (Total quantity, raw value, transport, grand total in EGP) and **Lot Preview Card** (`LOT-RAW-231027-???`).
  - Sticky bottom action bar with "Save Draft" and "Save Arrival" buttons.
- **Gaps & Dynamic Logic**: Dynamic calculation script between Quantity * Actual Price + Transport is missing in inline JS; relies on global form submit toast.

#### Screen 21: Raw Purchase Details (`raw-purchase-details.html`)
- **File Location**: `main_prototype/pages/raw-purchase-details.html`
- **Purpose**: Order detail view for raw purchases with end-to-end Lot-Supplier traceability.
- **Current State & Layout**:
  - Top bar with document print button (`window.print()`).
  - Header banner with order number (`PUR-2026-001`), reference (`REF-RAW-9901`), receipt status badge (`مستلم بالمخزن`), and total cost (`500,000 جنيه`).
  - **Visual Traceability Flow Box**: Supplier (`شركة الخير`) -> Purchase Order (`PUR-2026-001`) -> Generated Lot (`LOT-2026-001`) -> Station & Warehouse (`محطة النور`).
  - **Supply & Cost Breakdown Grid**: Itemized listing of raw product, received quantity (10,000 KG), unit price (50.00 EGP/KG), raw value, transport cost, and target warehouse.
- **Gaps & Dynamic Logic**: Fully populated mock data. Links point correctly to `supplier-details.html`, `lot-details.html`, and `station-details.html`.

#### Screen 22: Packaging Purchases (`packaging-purchases.html`)
- **File Location**: `main_prototype/pages/packaging-purchases.html`
- **Purpose**: Registry table for carton and packaging material purchases.
- **Current State & Layout**:
  - Action header with "Add Supplies Arrival" button (`supplies-arrival-add.html`).
  - Search bar filtering by receipt number, carton, or supplier.
  - **Data Table**: Columns for Receipt # (`PKG-2026-001`), Date, Supplier (`شركة الخير`), Carton/Item (`كرتونة سما`), Station (`محطة النور`), Quantity (500 cartons), Unit Price, Freight, and Total Cost (6,250.00 EGP).
- **Gaps & Dynamic Logic**: Functional mock table. Live filtering works via `interactions.js`.

#### Screen 23: Add Packaging Supplies Arrival (`supplies-arrival-add.html`)
- **File Location**: `main_prototype/pages/supplies-arrival-add.html`
- **Purpose**: Transactional form for recording carton and packaging material deliveries.
- **Current State & Layout**:
  - Focus-mode layout (side nav suppressed, sticky action footer).
  - 4 Form Sections:
    1. **Basic Info**: Date, document #, supplier dropdown (`شركة النيل للكرتون`, `مصنع الأهرام للتغليف`).
    2. **Location & Item**: Station selection, auto-filled Warehouse (locked input), Carton Item select (`كرتونة فراولة تصدير 5 كجم`, `كرتونة خضار 10 كجم`), Unit indicator.
    3. **Quantities & Financials**: Quantity input, default price, actual price, transport cost, and **Live Invoice Summary Card**.
    4. **Notes**: Extra comments textarea.
  - **Embedded JavaScript Engine**:
    - `updateWarehouse()`: Maps station selection (`alex`, `cairo`, `delta`) to warehouse string.
    - `updateDefaultPrice()`: Auto-fills reference price and unit based on selected carton `data-price` and `data-unit` attributes.
    - `calculateSummary()`: Calculates items total (`Quantity * ActualPrice`) + transport = Grand Total, with DOM scale animation on total update.
- **Gaps & Dynamic Logic**: Complete working dynamic calculations in inline script.

#### Screen 24: Shipment Registry & Profitability (`shipments.html`)
- **File Location**: `main_prototype/pages/shipments.html`
- **Purpose**: Management registry for export shipments with profit margin analytics.
- **Current State & Layout**:
  - Top action bar with "Export Report" and "Filter" buttons.
  - **4 Aggregated KPI Cards**: Total Revenue ($1,245,000), Total Costs ($840,000), Net Profit ($405,000), Average Profit Margin % (32.5% with visual progress bar).
  - **Detailed Data Table**: Includes multi-column Cost Breakdown Group:
    - Shipment # (`#EXP-2023-089`), Client (`الشركة العالمية للتجارة`), Product (`فراولة مجمدة`), Quantity (24.5 Tons), Sales Value ($45,000).
    - Cost Breakdown: Raw Cost ($18,000), Station Cost ($4,500), Container Freight ($2,800), Packaging Cost ($1,200) -> Total Cost ($26,500).
    - Profit ($18,500) and Margin Badge (41.1% - green for high profit, 17.3% - red for warning).
  - Table Footer with grand totals calculation row and pagination.
- **Gaps & Dynamic Logic**: Comprehensive visual prototype with complete cost breakdowns.

#### Screen 25: 7-Step Create Shipment Wizard (`shipment-wizard.html`)
- **File Location**: `main_prototype/pages/shipment-wizard.html`
- **Purpose**: Guided 7-step wizard for configuring new export shipments.
- **Required 7 Steps**:
  1. Customer selection & Product choice
  2. Station selection & Warehouse allocation
  3. Production data & Raw consumption / Waste % calculation
  4. Carton consumption & Packaging waste
  5. Station & Contractor cost overrides
  6. Financial summary & Margin preview
  7. Final confirmation
- **Current State & Layout**:
  - Progress bar header showing 7 step indicators (1 العميل, 2 المحطة, 3 الإنتاج, 4 الكرتون, 5 التكاليف, 6 الملخص, 7 تأكيد).
  - **DOM Content Present**: Step 1 (Customer & Product selects, Selling price), Step 2 (Station & Warehouse radio, Lot selection), Step 3 (Withdrawn KG, Net Output KG, inline JS `calculateWaste()` showing Waste KG & Waste %), Step 7 (Confirmation summary).
- **CRITICAL GAPS IDENTIFIED**:
  - **Missing HTML DOM Steps**: Step 4 (Carton consumption), Step 5 (Cost Overrides & Contractor rates), and Step 6 (Financial Summary & Profit Margin) are **NOT present** in the HTML markup.
  - **JavaScript Skipping Logic**: Lines 445-524 in `shipment-wizard.html` explicitly skip steps 4–6 (`if(currentStep > 3 && currentStep < 7) currentStep = 7;`).
  - **Auto-Fill Incompleteness**: Customer Product Agreement lookup (auto-filling default carton & selling price) is static dropdown options rather than dynamic auto-fill upon customer selection.

#### Screen 26: Shipment Details (`shipment-details.html`)
- **File Location**: `main_prototype/pages/shipment-details.html`
- **Purpose**: Deep-dive operational and financial detail hub for a completed shipment (`#SHP-2023-001`).
- **Current State & Layout**:
  - Header banner with shipment status (`مكتملة`), customer (`شركة الأغذية العالمية`), product (`فراولة مجمدة`), station (`محطة العبور`), print & PDF export buttons.
  - **End-to-End Visual Traceability Flow**: 5-step node graph: Supplier (`مزرعة الأمل`) -> Purchase (`PO-1024`) -> Lot (`L-9982`) -> Production (`محطة العبور`) -> Shipment (`SHP-2023-001`).
  - **Raw Material Scale**: Raw withdrawn (30,000 KG) vs Output (24,500 KG) with yield rate progress bar (81.6%).
  - **Waste Breakdown Box**: Grade 2 sorting (3,000 KG), Manufacturing waste (1,500 KG), Impurities (1,000 KG) -> Total Waste (5,500 KG).
  - **Itemized Cost Breakdown Table**: Raw Material (62%), Station Processing (18%), Contractor Labor (9%), Packaging Cartons (7%), Freight & Clearance (4%) -> Total 480,000 EGP.
  - **Profitability Card**: Revenue (542,000 EGP), Net Profit (62,000 EGP), Margin % (22%).
  - **Document Downloads**: Bill of Lading, Certificate of Origin, Commercial Invoice.
- **Gaps & Dynamic Logic**: Exceptionally complete detail hub with end-to-end traceability.

---

### Group 2: Inventory, Waste & Traceability (Screens 27–31)

#### Screen 27: Raw Material Inventory (`inventory-raw.html`)
- **File Location**: `main_prototype/pages/inventory-raw.html`
- **Purpose**: Real-time stock dashboard for raw materials and active lots.
- **Current State & Layout**:
  - **5 Top KPI Summary Cards**: Total Raw Purchases (10,000 KG), Withdrawn for Production (4,000 KG), Waste (300 KG / 7.5%), Available Balance (6,000 KG), Remaining Inventory Value (300,000 EGP).
  - Filter toolbar for Station, Product, and Supplier.
  - **Lots Inventory Table**: Columns for Lot # (`LOT-2026-001`), Supplier (`شركة الخير`), Product (`فراولة خام`), Station/Warehouse (`محطة النور`), Original Qty, Withdrawn Qty, Waste Qty, Remaining Qty, Unit Cost (50.00 EGP), Total Value, and "Traceability Tree" action button linking to `lot-details.html`.
- **Gaps & Dynamic Logic**: Well-structured interface; table links seamlessly to Lot Details and Supplier Details.

#### Screen 28: Packaging Inventory (`inventory-cartons.html`)
- **File Location**: `main_prototype/pages/inventory-cartons.html`
- **Purpose**: Packaging materials stock dashboard and master item configuration.
- **Current State & Layout**:
  - **3 Top KPI Cards**: Total Inventory (124,500 cartons), Reorder Threshold Alerts (3 items), Average Purchase Price (4.50 EGP).
  - Split screen layout:
    - **Left Column (8 cols)**: Searchable packaging inventory table with status indicators (`متوفر`, `إعادة طلب` for low stock items like PKG-1047).
    - **Right Column (4 cols)**: "Add New Packaging Item" form (name, type, unit, default supplier, unit price) AND "Selected Item Detail" card displaying per-station stock distribution (`الإسكندرية`: 32,000, `السادات`: 10,500, `العبور`: 2,500) and a 7-day consumption bar chart with peak highlight.
- **Gaps & Dynamic Logic**: High visual quality with embedded mini-chart visualization.

#### Screen 29: Stock Movements Ledger (`stock-movements.html`)
- **File Location**: `main_prototype/pages/stock-movements.html`
- **Purpose**: Audit ledger tracking all inventory receipts, withdrawals, and waste adjustments.
- **Current State & Layout**:
  - Filter bar by movement type (Purchase Receipt, Production Withdrawal, Packaging Consumption, Waste) and warehouse.
  - **Ledger Table**: Date (`01/01/2026`), Movement ID (`MOV-2026-001`), Type badge (`وارد شراء`, `سحب تشغيل`, `هالك محطة`), Warehouse, Item, Quantity (`+10,000 KG`, `-4,000 KG`, `300 KG`), Direction (`إضافة +`, `صرف -`, `هالك`), Source/Supplier, Destination/Shipment, Lot #, Document Reference.
- **Gaps & Dynamic Logic**: Clear cross-referencing links to `raw-purchase-details.html`, `shipment-details.html`, `lot-details.html`, and `waste-monitoring.html`.

#### Screen 30: Lot Details & Traceability (`lot-details.html`)
- **File Location**: `main_prototype/pages/lot-details.html`
- **Purpose**: Individual lot lifecycle tracking and farm-to-shipment traceability hub.
- **Current State & Layout**:
  - Header banner with Lot # (`LOT-2026-001`), Status (`متاح بالمخزن`), Supplier link (`شركة الخير`), Product, Station link (`محطة النور`), Available Balance (6,000 KG).
  - **Lot Lifecycle Timeline**: Vertical step timeline:
    1. `01/01/2026`: Purchase receipt `PUR-2026-001` (10,000 KG @ 50 EGP).
    2. `01/01/2026`: Stock deposit in Raw Warehouse.
    3. `05/01/2026`: Production withdrawal for shipment `SHP-2026-001` (4,000 KG raw -> 3,700 KG net output + 300 KG waste).
  - **Related Shipments Table**: Lists all shipments consuming from this lot with net output and waste percentages.
  - Quick action button: "Withdraw from this Lot for Shipment" (`shipment-wizard.html`).
- **Gaps & Dynamic Logic**: Complete traceability UI linking purchase, stock, shipment, and waste.

#### Screen 31: Waste Monitoring Hub (`waste-monitoring.html`)
- **File Location**: `main_prototype/pages/waste-monitoring.html`
- **Purpose**: Operational loss & waste monitoring dashboard.
- **Current State & Layout**:
  - **5 KPI Cards**: Total Waste (42.5 Tons, +5.2% alert), Raw Waste (28.1 Tons / 66%), Packaging Waste (14.4 Tons / 34%), Waste % (3.2% vs 2.0% threshold alert), Highest Waste Station (`الفرز الآلي - خط B` / 12.5 Tons).
  - **Detailed Waste Log Table**: Shipment # (`SHP-4029`), Lot # (`L-2938`), Supplier (`مزارع الدلتا`), Station (`الفرز الآلي`), Withdrawn KG (5,000), Output KG (4,650), Waste KG (350), Waste % (7.0% red badge), Date, and "Trace Waste" action buttons.
  - Highlighted row formatting for high-waste alerts (>5%).
- **Gaps & Dynamic Logic**: Highly effective dashboard for monitoring operational waste.

---

## Interactive Business Rules & Dynamic Relationships Matrix

| Business Rule / Relationship | Implementation Status | Implementation Mechanism | Found Gaps & Required Actions |
|---|---|---|---|
| **1. Customer Product Agreements Auto-Fill** | Partial | Dropdowns in `shipment-wizard.html` & `customer-agreements.html` | Agreement terms (default packaging type, contracted selling price) do not dynamically auto-fill fields when customer/product is selected in `shipment-wizard.html`. Needs JS event listener on Customer/Product select. |
| **2. Station Selection & Defaults Auto-Fill** | Partial | `supplies-arrival-add.html` has working JS (`updateWarehouse()`). `raw-purchases.html` & `shipment-wizard.html` have static text. | Selecting station should automatically filter available warehouses, load station default processing rate (EGP/ton), and default contractor/contractor rate. In `shipment-wizard.html`, Cost Overrides step (Step 5) is missing in DOM. |
| **3. Raw Material Lot Traceability** | Complete | Cross-linked detail pages (`raw-purchase-details.html`, `lot-details.html`, `shipment-details.html`, `stock-movements.html`) | Full visual chain exists: Supplier -> Purchase -> Lot -> Station -> Shipment. Traceability node diagrams and timeline graphics are fully rendered. |
| **4. Calculated Waste & Carton Waste** | Partial | `shipment-wizard.html` inline JS `calculateWaste()` computes raw waste & % (`withdrawn - net`). `waste-monitoring.html` presents aggregate metrics. | Carton consumption & carton waste calculation (Step 4 of wizard) is missing from DOM in `shipment-wizard.html`. Needs inclusion of carton requirement formula: `ceil(Net Output KG / Pack Capacity)` + waste %. |

---

## Key Recommendations for Next Steps

1. **Complete Shipment Wizard (Screen 25)**:
   - Add missing HTML DOM step containers for Step 4 (Carton Consumption & Packaging Waste), Step 5 (Station & Contractor Cost Overrides), and Step 6 (Financial Summary & Margin Breakdown).
   - Update `shipment-wizard.html` JavaScript to navigate sequentially through all 7 steps without skipping.

2. **Implement Reactive Business Rules JS Engine**:
   - Create a central helper module `business-rules.js` or extend `interactions.js` to handle:
     - Customer agreement lookup -> auto-fills selling price & packaging.
     - Station select -> populates warehouse select & station processing rate.
     - Live shipment costing summary: `Revenue - (Raw Cost + Station Cost + Contractor Cost + Packaging Cost + Freight) = Profit & Margin %`.

3. **Wire Live Form Calculations in Raw Arrivals (Screen 20)**:
   - Add inline/global calculation script to `raw-arrival-add.html` to compute `Quantity * Actual Price + Freight = Total Cost` dynamically in the Live Summary Card.
