# Original User Request

## Initial Request — 2026-08-11T09:18:33Z

Complete Arabic RTL ERP UI/UX Prototype for frozen-food export system (Nilotic Frost ERP), featuring all 40 operational, inventory, waste traceability, shipment costing, financial statement, payment, and reporting screens in one cohesive enterprise design.

Working directory: e:/web/exporting_erp
Integrity mode: development

## Requirements

### R1. Cohesive Arabic RTL Enterprise Application Shell & Navigation
Complete RTL layout with sidebar navigation, header with quick search, breadcrumbs, notifications, quick actions, consistent typography (IBM Plex Sans Arabic), and unified color palette (Forest Green `#012d1d`, Ice Blue `#F8F9FA`, Professional Blue `#0054cd`).

### R2. Complete 40-Screen Enterprise ERP Prototype
Implemented all 40 explicit screens covering Master Data (Products, Packaging, Customers, Suppliers, Stations, Contractors), Operations (Raw Material Purchases, Packaging Purchases, Multi-step Shipment Wizard, Shipment Details), Inventory & Waste (Raw Inventory, Packaging Inventory, Stock Movements, Lot Details, Waste Monitoring), Financials (Statements, Party Ledger, Payments & Collections, Add Transaction, Treasury & Banks), and Executive Monitoring (Shipment Profitability, Station Monitoring, Supplier Report, Customer Report).

### R3. Interactive Business Rules & Automatic Relationships
Demonstrated auto-fills and dynamic calculations across screens: Customer Product Agreements auto-filling Packaging & Selling Price; Station selection loading raw/packaging warehouses, default station rates, default contractor & rate; Raw Material Lot traceability; Calculated Waste & Carton Waste; Live financial statements and balance previews (`Current Balance ± Transaction = New Balance`).

## Acceptance Criteria

### Master Data & Configuration (Screens 01-18)
- [x] Screen 01: Executive Dashboard with KPI cards, analytical charts, recent operations, low stock & high waste alerts.
- [x] Screens 02-04: Products catalog (`products.html`), product creation form (`product-add.html`), product details with tabbed history (`product-details.html`).
- [x] Screens 05-06: Cartons/packaging inventory table (`cartons.html`) and carton creation form (`carton-add.html`).
- [x] Screens 07-10: Customer listing (`customers.html`), customer registration (`customer-add.html`), customer detail hub (`customer-details.html`), and customer-product agreement configuration (`customer-agreements.html`).
- [x] Screens 11-13: Supplier directory (`suppliers.html`), supplier registration with default product prices (`supplier-add.html`), and supplier detail hub (`supplier-details.html`).
- [x] Screens 14-16: Station directory with auto-generated warehouses (`stations.html`), station registration (`station-add.html`), and station detail hub (`station-details.html`).
- [x] Screens 17-18: Contractor directory with default rates (`contractors.html`) and contractor registration (`contractor-add.html`).

### Operations & Costing Wizard (Screens 19-26)
- [x] Screens 19-21: Raw Material Purchases table (`raw-purchases.html`), purchase form with live total & lot creation preview (`raw-arrival-add.html`), raw purchase details with Lot-Supplier traceability (`raw-purchase-details.html`).
- [x] Screens 22-23: Packaging Purchases table (`packaging-purchases.html`) and packaging purchase entry form (`supplies-arrival-add.html`).
- [x] Screen 24: Shipment registry (`shipments.html`) with multi-criteria filters.
- [x] Screen 25: 7-step Create Shipment Wizard (`shipment-wizard.html`) with strict dependency auto-fill (Customer -> Configured Products -> Station -> Lot -> Raw Consumption & Waste % -> Carton Consumption & Waste -> Costs & Overrides -> Financial Summary & Profit Margin).
- [x] Screen 26: Shipment Details screen (`shipment-details.html`) with overview, production, inventory, costing breakdown, profit, and end-to-end traceability tree.

### Inventory, Waste & Traceability (Screens 27-31)
- [x] Screens 27-28: Raw Material Inventory dashboard (`inventory-raw.html`) with lot remaining quantities and Packaging Inventory dashboard (`inventory-cartons.html`).
- [x] Screen 29: Stock Movements ledger (`stock-movements.html`) showing Purchase Receipt, Withdrawal, Carton Consumption, Waste, and Adjustments.
- [x] Screen 30: Lot Details view (`lot-details.html`) with visual lifecycle timeline (Purchase -> Stock -> Shipment -> Withdrawal -> Waste).
- [x] Screen 31: Waste Monitoring hub (`waste-monitoring.html`) with top metrics, station/supplier waste breakdown, and full traceability links.

### Financial Statements & Banking (Screens 32-36)
- [x] Screens 32-33: Financial Statements ledger (`financial-statements.html`) filtered by party type and individual Party Statement Detail (`party-statement-details.html`) with running balance timeline & export/print.
- [x] Screens 34-35: Payments & Collections portal (`payments-collections.html`) and Add Financial Transaction form (`add-transaction.html`) with live balance preview (`Current Balance + Transaction = New Balance`).
- [x] Screen 36: Treasury & Banks liquid cash dashboard (`treasury-banks.html`) with transaction log.

### Monitoring & Reports (Screens 37-40)
- [x] Screen 37: Shipment Profitability analysis table (`shipment-profitability.html`).
- [x] Screen 38: Station Monitoring dashboard (`station-monitoring.html`) with inventory, purchases, shipments, waste %, costs, and financial balance per station.
- [x] Screen 39: Supplier Report (`supplier-report.html`) with purchase volume, outstanding balance, and linked waste traceability.
- [x] Screen 40: Customer Report (`customer-report.html`) with shipments, quantity sold, collected vs outstanding, and total profit margins.
