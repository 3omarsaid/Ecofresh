# Project: Nilotic Frost ERP (Frozen-Food Export ERP Prototype)

## Architecture
- **Framework & Styling**: Pure HTML5, Tailwind CSS, IBM Plex Sans Arabic typography, Material Symbols Outlined icons.
- **RTL Application Shell**: Right fixed sidebar navigation (`260px`), top header bar with live search, notifications, quick actions, breadcrumbs.
- **Data & Component Layer**: Modular HTML pages in `e:/web/exporting_erp/main_prototype/pages/` linked via `css/global.css`, `css/custom.css`, `js/interactions.js`, `js/navigation.js`.
- **Interactive Business Rules & Auto-Fills**:
  1. Customer-Product Agreements auto-fill packaging & selling prices.
  2. Station selection auto-links raw & packaging warehouses, station processing rates, contractor default rates.
  3. Raw Material Lot traceability linking Supplier -> Purchase Lot -> Station Storage -> Shipment -> Waste.
  4. 7-step Create Shipment Wizard: Customer -> Configured Products -> Station -> Lot -> Raw & Waste % -> Carton Consumption & Waste -> Costs & Overrides -> Financial Summary & Profit Margin.
  5. Live Balance Preview widget: `Current Balance ± Transaction Amount = New Balance`.

## Feature Inventory
| # | Feature | Screen File | Assigned Milestone | Status | Source |
|---|---------|-------------|-------------------|--------|--------|
| 01 | Executive Dashboard | `index.html` / `pages/dashboard-executive.html` | M1 | Done | Verified |
| 02 | Products Catalog | `pages/products.html` | M1 | Done | Verified |
| 03 | Product Creation Form | `pages/product-add.html` | M1 | Done | Verified |
| 04 | Product Details Hub | `pages/product-details.html` | M1 | Done | Verified |
| 05 | Cartons Catalog | `pages/cartons.html` | M1 | Done | Verified |
| 06 | Carton Creation Form | `pages/carton-add.html` | M1 | Done | Verified |
| 07 | Customers Directory | `pages/customers.html` | M1 | Done | Verified |
| 08 | Customer Registration | `pages/customer-add.html` | M1 | Done | Verified |
| 09 | Customer Detail Hub | `pages/customer-details.html` | M1 | Done | Verified |
| 10 | Customer-Product Agreement Matrix | `pages/customer-agreements.html` / `customer-product-add.html` | M1 | Done | Verified |
| 11 | Suppliers Directory | `pages/suppliers.html` | M1 | Done | Verified |
| 12 | Supplier Registration & Prices | `pages/supplier-add.html` / `supplier-product-add.html` | M1 | Done | Verified |
| 13 | Supplier Detail Hub | `pages/supplier-details.html` | M1 | Done | Verified |
| 14 | Station Directory | `pages/stations.html` | M1 | Done | Verified |
| 15 | Station Registration Form | `pages/station-add.html` | M1 | Done | Verified |
| 16 | Station Detail Hub | `pages/station-details.html` | M1 | Done | Verified |
| 17 | Contractor Directory | `pages/contractors.html` | M1 | Done | Verified |
| 18 | Contractor Registration | `pages/contractor-add.html` | M1 | Done | Verified |
| 19 | Raw Material Purchases Table | `pages/raw-purchases.html` | M2 | Done | Verified |
| 20 | Purchase Form & Lot Preview | `pages/raw-arrival-add.html` | M2 | Done | Verified |
| 21 | Raw Purchase Details | `pages/raw-purchase-details.html` | M2 | Done | Verified |
| 22 | Packaging Purchases Table | `pages/packaging-purchases.html` | M2 | Done | Verified |
| 23 | Packaging Purchase Entry Form | `pages/supplies-arrival-add.html` | M2 | Done | Verified |
| 24 | Shipment Registry | `pages/shipments.html` | M2 | Done | Verified |
| 25 | 7-Step Create Shipment Wizard | `pages/shipment-wizard.html` | M2 | Done | Verified |
| 26 | Shipment Details & Traceability Tree | `pages/shipment-details.html` | M2 | Done | Verified |
| 27 | Raw Material Inventory Dashboard | `pages/inventory-raw.html` | M3 | Done | Verified |
| 28 | Packaging Inventory Dashboard | `pages/inventory-cartons.html` | M3 | Done | Verified |
| 29 | Stock Movements Ledger | `pages/stock-movements.html` | M3 | Done | Verified |
| 30 | Lot Details & Visual Timeline | `pages/lot-details.html` | M3 | Done | Verified |
| 31 | Waste Monitoring Hub | `pages/waste-monitoring.html` | M3 | Done | Verified |
| 32 | Financial Statements Ledger | `pages/financial-statements.html` | M4 | Done | Verified |
| 33 | Party Statement Detail | `pages/party-statement-details.html` | M4 | Done | Verified |
| 34 | Payments & Collections Portal | `pages/payments-collections.html` | M4 | Done | Verified |
| 35 | Add Financial Transaction | `pages/add-transaction.html` | M4 | Done | Verified |
| 36 | Treasury & Banks Cash Dashboard | `pages/treasury-banks.html` | M4 | Done | Verified |
| 37 | Shipment Profitability Table | `pages/shipment-profitability.html` | M5 | Done | Verified |
| 38 | Station Monitoring Dashboard | `pages/station-monitoring.html` | M5 | Done | Verified |
| 39 | Supplier Analytics Report | `pages/supplier-report.html` | M5 | Done | Verified |
| 40 | Customer Analytics Report | `pages/customer-report.html` | M5 | Done | Verified |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Master Data & UI Shell | Screens 01-18 | none | Done |
| M2 | Operations & Costing Wizard | Screens 19-26 | M1 | Done |
| M3 | Inventory, Waste & Traceability | Screens 27-31 | M2 | Done |
| M4 | Financial Statements & Banking | Screens 32-36 | M1 | Done |
| M5 | Monitoring & Executive Reports | Screens 37-40 | M2, M4 | Done |

## Interface Contracts
### 7-Step Shipment Wizard Contract
- **Step 1**: Select Customer -> Auto-fill configured customer products & agreement prices.
- **Step 2**: Select Products & Quantities.
- **Step 3**: Select Processing Station -> Auto-fill linked raw/packaging warehouses, default station rate, default contractor & contractor rate.
- **Step 4**: Select Raw Material Lot & Raw Consumption -> Auto-calculate raw waste % & waste quantity.
- **Step 5**: Select Packaging / Carton Lot & Consumption -> Auto-calculate carton waste.
- **Step 6**: Costing Summary & Overrides -> Raw cost + Packaging cost + Station processing fee + Contractor fee + Freight/Shipping = Total Cost.
- **Step 7**: Financial Summary & Profit Margin -> Total Sales Revenue - Total Cost = Net Profit Margin & Margin %.

### Financial Transaction Live Balance Contract
- Input: Current Balance, Transaction Type (Debit/Credit or Collection/Payment), Amount.
- Formula: `New Balance = Current Balance + Amount` (for Credits/Collections) or `Current Balance - Amount` (for Debits/Payments).

## Code Layout
- HTML Pages: `e:/web/exporting_erp/main_prototype/pages/*.html` and `e:/web/exporting_erp/main_prototype/index.html`
- CSS Assets: `e:/web/exporting_erp/main_prototype/css/global.css`, `custom.css`
- JS Logic: `e:/web/exporting_erp/main_prototype/js/interactions.js`, `navigation.js`, `app.js`
