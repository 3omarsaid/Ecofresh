# مخطط قاعدة البيانات الكامل بصيغة Prisma (Prisma Schema Specification)

> **إشعار للمطور والنموذج المنفّذ:**
> هذا الملف يحتوي على الكود الكامل لملف `prisma/schema.prisma`. يجب نسخه بالكامل دون تعديل أو اختصار للحفاظ على تكامل المفاتيح الأجنبية والعلاقات.

---

## كود ملف `prisma/schema.prisma` الكامل

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ----------------------------------------------------
// 1. الأدوار والمستخدمين (Auth & RBAC)
// ----------------------------------------------------

enum UserRole {
  ADMIN       @map("admin")
  SUPERVISOR  @map("supervisor")
  OPERATOR    @map("operator")
  STOREKEEPER @map("storekeeper")
  VIEWER      @map("viewer")

  @@map("user_role_type")
}

model UserProfile {
  id        String   @id @db.Uuid
  fullName  String   @map("full_name")
  role      UserRole @default(VIEWER)
  title     String?
  stationId String?  @map("station_id")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updated_at DateTime @default(now()) @updated_at

  // العلاقات
  station               Station?               @relation(fields: [stationId], references: [id])
  rawBatchesCreated     RawBatch[]             @relation("RawBatchCreatedBy")
  clientOrdersCreated   ClientOrder[]          @relation("ClientOrderCreatedBy")
  operationsCreated     ProcessingOperation[]  @relation("OperationCreatedBy")
  shipmentsCreated      Shipment[]             @relation("ShipmentCreatedBy")
  transactionsCreated   FinancialTransaction[] @relation("TxnCreatedBy")
  stockTransfersCreated StockTransfer[]        @relation("TransferCreatedBy")
  adjustmentsApproved   StockAdjustment[]      @relation("AdjustmentApprovedBy")
  auditLogs             AuditLog[]

  @@map("user_profiles")
}

// ----------------------------------------------------
// 2. البيانات الأساسية (Master Data)
// ----------------------------------------------------

model Station {
  id                    String   @id @map("id") // STN-01
  name                  String   @unique
  location              String
  coldStorageCapacityKg Int      @default(100000) @map("cold_storage_capacity_kg")
  electricityRatePerKg  Decimal  @default(2.50) @map("electricity_rate_per_kg") @db.Decimal(8, 2)
  supervisorName        String?  @map("supervisor_name")
  phone                 String?
  isActive              Boolean  @default(true) @map("is_active")
  createdAt             DateTime @default(now()) @map("created_at")

  // العلاقات
  userProfiles         UserProfile[]
  contractors          Contractor[]
  rawBatches           RawBatch[]
  operations           ProcessingOperation[]
  finishedGoodsBatches FinishedGoodsBatch[]
  transfersFrom        StockTransfer[]       @relation("TransfersFromStation")
  transfersTo          StockTransfer[]       @relation("TransfersToStation")
  stockAdjustments     StockAdjustment[]

  @@map("stations")
}

model Contractor {
  id               String   @id // CONT-001
  name             String
  tariffRatePerKg  Decimal  @default(2.00) @map("tariff_rate_per_kg") @db.Decimal(8, 2)
  stationId        String?  @map("station_id")
  phone            String?
  specialization   String?
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")

  station          Station?              @relation(fields: [stationId], references: [id])
  operations       ProcessingOperation[]

  @@map("contractors")
}

model Product {
  id               String   @id // PRD-01
  code             String   @unique // PRD-STW-IQF
  name             String
  category         String // فواكه مجمدة / خضار مجمد
  defaultUnit      String   @default("KG") @map("default_unit")
  standardWastePct Decimal  @default(20.0) @map("standard_waste_pct") @db.Decimal(5, 2)
  standardYieldPct Decimal  @default(80.0) @map("standard_yield_pct") @db.Decimal(5, 2)
  createdAt        DateTime @default(now()) @map("created_at")

  agreements       CustomerAgreement[]

  @@map("products")
}

model Supply {
  id          String   @id // SUP-01
  code        String   @unique // CTN-EXP-10K
  name        String
  category    String // كرتونة / أكياس / بالتات / لاصق / تغليف
  capacityKg  Decimal? @map("capacity_kg") @db.Decimal(8, 2)
  unit        String   @default("كرتونة")
  stock       Decimal  @default(0.0) @db.Decimal(12, 2)
  unitPrice   Decimal  @default(0.0) @map("unit_price") @db.Decimal(10, 2)
  createdAt   DateTime @default(now()) @map("created_at")

  supplyIssues OperationSupplyIssue[]

  @@map("supplies")
}

model Customer {
  id              String   @id // CUST-001
  code            String   @unique
  name            String
  country         String
  destinationPort String   @map("destination_port")
  currency        String   @default("EUR")
  paymentTerms    String   @map("payment_terms")
  creditLimit     Decimal  @default(500000.00) @map("credit_limit") @db.Decimal(15, 2)
  contactPerson   String?  @map("contact_person")
  phone           String?
  email           String?
  status          String   @default("نشط")
  createdAt       DateTime @default(now()) @map("created_at")

  agreements      CustomerAgreement[]
  orders          ClientOrder[]
  shipments       Shipment[]

  @@map("customers")
}

model CustomerAgreement {
  id             Int      @id @default(autoincrement())
  customerId     String   @map("customer_id")
  productId      String   @map("product_id")
  targetPriceEur Decimal  @map("target_price_eur") @db.Decimal(10, 3)
  packagingSpec  String   @map("packaging_spec")
  createdAt      DateTime @default(now()) @map("created_at")

  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  product        Product  @relation(fields: [productId], references: [id], onDelete: Restrict)

  @@unique([customerId, productId])
  @@map("customer_agreements")
}

enum SupplierCategory {
  RAW_AGRICULTURAL @map("مورد خام زراعي")
  FINISHED_GOODS   @map("مورد بضاعة جاهزة")
  PACKAGING        @map("مورد مستلزمات")

  @@map("supplier_category")
}

model Supplier {
  id          String           @id // SUPP-001
  code        String           @unique
  name        String
  type        SupplierCategory
  mainProduct String?          @map("main_product")
  phone       String?
  location    String?
  status      String           @default("معتمد")
  createdAt   DateTime         @default(now()) @map("created_at")

  rawBatches  RawBatch[]
  deals       DirectPurchaseDeal[]

  @@map("suppliers")
}

// ----------------------------------------------------
// 3. المشتريات والطلبيات (Procurement & Orders)
// ----------------------------------------------------

enum QcStatus {
  APPROVED @map("APPROVED")
  PENDING  @map("PENDING")
  REJECTED @map("REJECTED")

  @@map("qc_status_type")
}

model RawBatch {
  batchId          String   @id @map("batch_id") // LOT-RAW-20260815-01
  stationId        String   @map("station_id")
  rawProduct       String   @map("raw_product")
  supplierId       String   @map("supplier_id")
  grossQtyKg       Decimal  @map("gross_qty_kg") @db.Decimal(12, 2)
  tareQtyKg        Decimal  @default(0.0) @map("tare_qty_kg") @db.Decimal(12, 2)
  initialQty       Decimal  @map("initial_qty") @db.Decimal(12, 2)
  availableQty     Decimal  @map("available_qty") @db.Decimal(12, 2)
  unitPriceEgp     Decimal  @map("unit_price_egp") @db.Decimal(10, 2)
  transportCostEgp Decimal  @default(0.0) @map("transport_cost_egp") @db.Decimal(12, 2)
  unitCost         Decimal  @map("unit_cost") @db.Decimal(10, 2)
  totalPayableEgp  Decimal  @map("total_payable_egp") @db.Decimal(15, 2)
  receivedDate     DateTime @default(now()) @map("received_date") @db.Date
  qcStatus         QcStatus @default(APPROVED) @map("qc_status")
  brixDegree       Decimal? @map("brix_degree") @db.Decimal(5, 2)
  truckPlate       String?  @map("truck_plate")
  driverName       String?  @map("driver_name")
  notes            String?
  createdById      String?  @map("created_by") @db.Uuid
  createdAt        DateTime @default(now()) @map("created_at")

  station          Station              @relation(fields: [stationId], references: [id], onDelete: Restrict)
  supplier         Supplier             @relation(fields: [supplierId], references: [id], onDelete: Restrict)
  createdBy        UserProfile?         @relation("RawBatchCreatedBy", fields: [createdById], references: [id])
  operationIssues  OperationRawIssue[]

  @@index([stationId])
  @@index([supplierId])
  @@index([availableQty])
  @@map("raw_batches")
}

model ClientOrder {
  orderId          String   @id @map("order_id") // ORD-2026-001
  orderDate        DateTime @default(now()) @map("order_date") @db.Date
  customerId       String   @map("customer_id")
  productName      String   @map("product_name")
  packagingSpec    String   @map("packaging_spec")
  orderedQtyKg     Decimal  @map("ordered_qty_kg") @db.Decimal(12, 2)
  unfulfilledQtyKg Decimal  @map("unfulfilled_qty_kg") @db.Decimal(12, 2)
  unitPriceEur     Decimal  @map("unit_price_eur") @db.Decimal(10, 3)
  fxRate           Decimal  @default(53.20) @map("fx_rate") @db.Decimal(10, 4)
  deliveryTerms    String   @default("FOB") @map("delivery_terms")
  targetShipDate   DateTime? @map("target_ship_date") @db.Date
  destinationPort  String   @map("destination_port")
  status           String   @default("جديدة")
  notes            String?
  createdById      String?  @map("created_by") @db.Uuid
  createdAt        DateTime @default(now()) @map("created_at")

  customer         Customer     @relation(fields: [customerId], references: [id], onDelete: Restrict)
  createdBy        UserProfile? @relation("ClientOrderCreatedBy", fields: [createdById], references: [id])
  shipments        Shipment[]

  @@index([customerId])
  @@index([status])
  @@map("client_orders")
}

// ----------------------------------------------------
// 4. الإنتاج والتدوير (Production & Processing)
// ----------------------------------------------------

enum FgSourceType {
  MANUFACTURED    @map("MANUFACTURED")
  DIRECT_PURCHASE @map("DIRECT_PURCHASE")

  @@map("fg_source_type")
}

model FinishedGoodsBatch {
  fgBatchId        String       @id @map("fg_batch_id") // FG-PR-2026-001
  sourceType       FgSourceType @map("source_type")
  sourceOpId       String?      @map("source_op_id")
  dealRef          String?      @map("deal_ref")
  stationId        String       @map("station_id")
  productName      String       @map("product_name")
  productionDate   DateTime     @default(now()) @map("production_date") @db.Date
  expiryDate       DateTime?    @map("expiry_date") @db.Date
  initialQty       Decimal      @map("initial_qty") @db.Decimal(12, 2)
  availableQty     Decimal      @map("available_qty") @db.Decimal(12, 2)
  costPerKg        Decimal      @map("cost_per_kg") @db.Decimal(10, 2)
  totalValue       Decimal      @map("total_value") @db.Decimal(15, 2)
  qualityStatus    String       @default("مطابق للمواصفات التصديرية") @map("quality_status")
  rawSources       Json?        @map("raw_sources")
  suppliersSummary Json?        @map("suppliers_summary")
  createdById      String?      @map("created_by") @db.Uuid
  createdAt        DateTime     @default(now()) @map("created_at")

  station          Station                  @relation(fields: [stationId], references: [id], onDelete: Restrict)
  operation        ProcessingOperation?     @relation("OperationGeneratedBatch", fields: [sourceOpId], references: [id])
  deal             DirectPurchaseDeal?      @relation(fields: [dealRef], references: [dealId])
  allocatedShipments ShipmentAllocatedBatch[]
  stockTransfers   StockTransfer[]

  @@index([stationId])
  @@index([availableQty])
  @@map("finished_goods_batches")
}

model ProcessingOperation {
  id                   String   @id // PR-2026-001
  date                 DateTime @default(now()) @db.Date
  stationId            String   @map("station_id")
  rawProduct           String   @map("raw_product")
  finishedProduct      String   @map("finished_product")
  contractorId         String   @map("contractor_id")
  locked               Boolean  @default(true)
  rawInputKg           Decimal  @map("raw_input_kg") @db.Decimal(12, 2)
  finishedOutputKg     Decimal  @map("finished_output_kg") @db.Decimal(12, 2)
  secondaryOutputKg    Decimal  @default(0.0) @map("secondary_output_kg") @db.Decimal(12, 2)
  rawWasteKg           Decimal  @map("raw_waste_kg") @db.Decimal(12, 2)
  yieldPercent         Decimal  @map("yield_percent") @db.Decimal(5, 2)
  rawCost              Decimal  @map("raw_cost") @db.Decimal(15, 2)
  suppliesConsumedCost Decimal  @map("supplies_consumed_cost") @db.Decimal(15, 2)
  suppliesWasteCost    Decimal  @map("supplies_waste_cost") @db.Decimal(15, 2)
  contractorCost       Decimal  @map("contractor_cost") @db.Decimal(15, 2)
  stationCost          Decimal  @map("station_cost") @db.Decimal(15, 2)
  otherCost            Decimal  @default(0.0) @map("other_cost") @db.Decimal(15, 2)
  grandTotalCost       Decimal  @map("grand_total_cost") @db.Decimal(15, 2)
  costPerKg            Decimal  @map("cost_per_kg") @db.Decimal(10, 2)
  generatedBatchId     String?  @unique @map("generated_batch_id")
  notes                String?
  createdById          String?  @map("created_by") @db.Uuid
  createdAt            DateTime @default(now()) @map("created_at")

  station              Station                  @relation(fields: [stationId], references: [id], onDelete: Restrict)
  contractor           Contractor               @relation(fields: [contractorId], references: [id], onDelete: Restrict)
  createdBy            UserProfile?             @relation("OperationCreatedBy", fields: [createdById], references: [id])
  rawIssues            OperationRawIssue[]
  supplyIssues         OperationSupplyIssue[]
  generatedBatches     FinishedGoodsBatch[]     @relation("OperationGeneratedBatch")

  @@map("processing_operations")
}

model OperationRawIssue {
  id           Int                 @id @default(autoincrement())
  operationId  String              @map("operation_id")
  batchId      String              @map("batch_id")
  supplierName String              @map("supplier_name")
  qtyKg        Decimal             @map("qty_kg") @db.Decimal(12, 2)
  unitCost     Decimal             @map("unit_cost") @db.Decimal(10, 2)
  totalCost    Decimal             @map("total_cost") @db.Decimal(15, 2)

  operation    ProcessingOperation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  rawBatch     RawBatch            @relation(fields: [batchId], references: [batchId], onDelete: Restrict)

  @@map("operation_raw_issues")
}

model OperationSupplyIssue {
  id           Int                 @id @default(autoincrement())
  operationId  String              @map("operation_id")
  supplyId     String              @map("supply_id")
  consumedQty  Decimal             @map("consumed_qty") @db.Decimal(12, 2)
  wasteQty     Decimal             @default(0.0) @map("waste_qty") @db.Decimal(12, 2)
  withdrawnQty Decimal             @map("withdrawn_qty") @db.Decimal(12, 2)
  unitCost     Decimal             @map("unit_cost") @db.Decimal(10, 2)
  consumedCost Decimal             @map("consumed_cost") @db.Decimal(15, 2)
  wasteCost    Decimal             @map("waste_cost") @db.Decimal(15, 2)

  operation    ProcessingOperation @relation(fields: [operationId], references: [id], onDelete: Cascade)
  supply       Supply              @relation(fields: [supplyId], references: [id], onDelete: Restrict)

  @@map("operation_supply_issues")
}

model DirectPurchaseDeal {
  dealId            String   @id @map("deal_id") // DEAL-2026-001
  date              DateTime @default(now()) @db.Date
  supplierId        String   @map("supplier_id")
  productName       String   @map("product_name")
  stationId         String   @map("station_id")
  qtyKg             Decimal  @map("qty_kg") @db.Decimal(12, 2)
  packageType       String?  @map("package_type")
  packageCount      Int?     @map("package_count")
  purchasePricePerKg Decimal @map("purchase_price_per_kg") @db.Decimal(10, 2)
  transportCost     Decimal  @default(0.0) @map("transport_cost") @db.Decimal(12, 2)
  totalCost         Decimal  @map("total_cost") @db.Decimal(15, 2)
  costPerKg         Decimal  @map("cost_per_kg") @db.Decimal(10, 2)
  generatedBatchId  String?  @unique @map("generated_batch_id")
  invoiceNo         String?  @map("invoice_no")
  status            String   @default("تم الاستلام")
  notes             String?

  supplier          Supplier             @relation(fields: [supplierId], references: [id], onDelete: Restrict)
  generatedBatches  FinishedGoodsBatch[]

  @@map("direct_purchases")
}

// ----------------------------------------------------
// 5. الشحنات والتصدير (Shipments & Export)
// ----------------------------------------------------

model Shipment {
  shipmentId                String   @id @map("shipment_id") // SHP-2026-001
  orderId                   String   @map("order_id")
  customerId                String   @map("customer_id")
  productName               String   @map("product_name")
  dispatchDate              DateTime @default(now()) @map("dispatch_date") @db.Date
  containerNo               String   @map("container_no")
  sealNo                    String   @map("seal_no")
  shippingLine              String   @map("shipping_line")
  bookingNo                 String?  @map("booking_no")
  shippedQtyKg              Decimal  @map("shipped_qty_kg") @db.Decimal(12, 2)
  productionCostEgp         Decimal  @map("production_cost_egp") @db.Decimal(15, 2)
  inlandTruckingEgp         Decimal  @default(6500.0) @map("inland_trucking_egp") @db.Decimal(12, 2)
  oceanFreightEgp           Decimal  @default(22000.0) @map("ocean_freight_egp") @db.Decimal(12, 2)
  customsClearanceEgp       Decimal  @default(4500.0) @map("customs_clearance_egp") @db.Decimal(12, 2)
  inspectionCertificatesEgp Decimal  @default(2500.0) @map("inspection_certificates_egp") @db.Decimal(12, 2)
  portTerminalChargesEgp    Decimal  @default(3500.0) @map("port_terminal_charges_egp") @db.Decimal(12, 2)
  totalShipmentCostEgp      Decimal  @map("total_shipment_cost_egp") @db.Decimal(15, 2)
  sellingPriceEur           Decimal  @map("selling_price_eur") @db.Decimal(10, 3)
  fxRate                    Decimal  @map("fx_rate") @db.Decimal(10, 4)
  grossRevenueEgp           Decimal  @map("gross_revenue_egp") @db.Decimal(15, 2)
  netProfitEgp              Decimal  @map("net_profit_egp") @db.Decimal(15, 2)
  marginPercent             Decimal  @map("margin_percent") @db.Decimal(5, 2)
  status                    String   @default("تم الشحن والإبحار")
  destinationPort           String   @map("destination_port")
  createdById               String?  @map("created_by") @db.Uuid
  createdAt                 DateTime @default(now()) @map("created_at")

  order                     ClientOrder              @relation(fields: [orderId], references: [orderId], onDelete: Restrict)
  customer                  Customer                 @relation(fields: [customerId], references: [id], onDelete: Restrict)
  createdBy                 UserProfile?             @relation("ShipmentCreatedBy", fields: [createdById], references: [id])
  allocatedBatches          ShipmentAllocatedBatch[]

  @@map("shipments")
}

model ShipmentAllocatedBatch {
  id           Int                @id @default(autoincrement())
  shipmentId   String             @map("shipment_id")
  fgBatchId    String             @map("fg_batch_id")
  qtyKg        Decimal            @map("qty_kg") @db.Decimal(12, 2)
  costPerKg    Decimal            @map("cost_per_kg") @db.Decimal(10, 2)
  totalCostEgp Decimal            @map("total_cost_egp") @db.Decimal(15, 2)

  shipment     Shipment           @relation(fields: [shipmentId], references: [shipmentId], onDelete: Cascade)
  batch        FinishedGoodsBatch @relation(fields: [fgBatchId], references: [fgBatchId], onDelete: Restrict)

  @@map("shipment_allocated_batches")
}

// ----------------------------------------------------
// 6. المحاسبة والخزينة والأستاذ العام (Financials & Treasury)
// ----------------------------------------------------

model TreasuryAccount {
  id        String   @id // ACC-01
  name      String
  currency  String   @default("EGP")
  balance   Decimal  @default(0.0) @db.Decimal(15, 2)
  accountNo String?  @map("account_no")
  bankName  String?  @map("bank_name")
  swiftCode String?  @map("swift_code")
  iban      String?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")

  transactions FinancialTransaction[]

  @@map("treasury_accounts")
}

model FinancialTransaction {
  txnId          String   @id @map("txn_id") // TXN-2026-001
  date           DateTime @default(now()) @db.Date
  type           String
  partyType      String   @map("party_type")
  partyId        String   @map("party_id")
  partyName      String   @map("party_name")
  amountEgp      Decimal  @map("amount_egp") @db.Decimal(15, 2)
  amountCurrency Decimal? @map("amount_currency") @db.Decimal(15, 2)
  currency       String?  @default("EGP")
  refDoc         String?  @map("ref_doc")
  accountId      String?  @map("account_id")
  accountName    String?  @map("account_name")
  description    String?
  status         String   @default("معتمد")
  createdById    String?  @map("created_by") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")

  account        TreasuryAccount? @relation(fields: [accountId], references: [id])
  createdBy      UserProfile?     @relation("TxnCreatedBy", fields: [createdById], references: [id])

  @@index([partyId])
  @@index([date])
  @@index([type])
  @@map("financial_transactions")
}

// ----------------------------------------------------
// 7. اللوجستيات والتسويات وسجل التدقيق (Logistics & Audit)
// ----------------------------------------------------

model StockTransfer {
  transferId    String   @id @map("transfer_id") // TRF-2026-001
  date          DateTime @default(now()) @db.Date
  fromStationId String   @map("from_station_id")
  toStationId   String   @map("to_station_id")
  batchId       String   @map("batch_id")
  productName   String   @map("product_name")
  qtyKg         Decimal  @map("qty_kg") @db.Decimal(12, 2)
  truckPlate    String?  @map("truck_plate")
  driverName    String?  @map("driver_name")
  status        String   @default("تم الاستلام بنجاح")
  notes         String?
  createdById   String?  @map("created_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")

  fromStation   Station            @relation("TransfersFromStation", fields: [fromStationId], references: [id])
  toStation     Station            @relation("TransfersToStation", fields: [toStationId], references: [id])
  batch         FinishedGoodsBatch @relation(fields: [batchId], references: [fgBatchId])
  createdBy     UserProfile?       @relation("TransferCreatedBy", fields: [createdById], references: [id])

  @@map("stock_transfers")
}

model StockAdjustment {
  adjustmentId  String   @id @map("adjustment_id") // ADJ-2026-001
  date          DateTime @default(now()) @db.Date
  stationId     String   @map("station_id")
  targetType    String   @map("target_type") // RAW_LOT / FINISHED_BATCH / SUPPLY
  targetId      String   @map("target_id")
  systemQty     Decimal  @map("system_qty") @db.Decimal(12, 2)
  actualQty     Decimal  @map("actual_qty") @db.Decimal(12, 2)
  differenceQty Decimal  @map("difference_qty") @db.Decimal(12, 2)
  reason        String
  approvedById  String?  @map("approved_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")

  station       Station      @relation(fields: [stationId], references: [id])
  approvedBy    UserProfile? @relation("AdjustmentApprovedBy", fields: [approvedById], references: [id])

  @@map("stock_adjustments")
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  entityType  String   @map("entity_type") // operation / shipment / transaction
  entityId    String   @map("entity_id")
  action      String   // CREATE / LOCK / DISPATCH / CANCEL
  summary     String
  performedBy String?  @map("performed_by") @db.Uuid
  performedAt DateTime @default(now()) @map("performed_at")

  user        UserProfile? @relation(fields: [performedBy], references: [id])

  @@index([entityType, entityId])
  @@map("audit_log")
}
```
