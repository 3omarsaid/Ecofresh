# مخطط قاعدة البيانات (Database Schema) — Nilotic Frost ERP

> **ملاحظة مهمة:** النظام الحالي لا يستخدم قاعدة بيانات حقيقية. هذا التوثيق يصف **البنية المنطقية** المستخلصة من `state.js` — وهي المرجع لتصميم قاعدة البيانات الفعلية عند بناء الـ Backend.

---

## الجداول الكاملة

### 1. جدول `users` — المستخدمون

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(10) | PK | معرّف: `usr-01` |
| `name` | VARCHAR(100) | NOT NULL | الاسم الكامل |
| `role` | ENUM | NOT NULL | Admin / Supervisor / Operator / Storekeeper / Viewer |
| `title` | VARCHAR(150) | | المسمى الوظيفي |
| `avatar` | VARCHAR(10) | | emoji للعرض |

---

### 2. جدول `customers` — العملاء

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(15) | PK | معرّف: `CUST-001` |
| `code` | VARCHAR(20) | UNIQUE NOT NULL | كود: `CUST-SAMA-NL` |
| `name` | VARCHAR(200) | NOT NULL | اسم الشركة |
| `country` | VARCHAR(50) | NOT NULL | دولة العميل |
| `destination_port` | VARCHAR(100) | | ميناء الوصول |
| `currency` | VARCHAR(5) | NOT NULL DEFAULT 'EUR' | EUR / USD / GBP |
| `payment_terms` | VARCHAR(100) | | شروط الدفع |
| `credit_limit` | DECIMAL(15,2) | | حد الائتمان (ج.م) |
| `contact_person` | VARCHAR(100) | | جهة الاتصال |
| `phone` | VARCHAR(30) | | |
| `email` | VARCHAR(100) | | |
| `status` | ENUM | DEFAULT 'نشط' | نشط / متوقف |
| `created_at` | TIMESTAMP | DEFAULT NOW() | |

---

### 3. جدول `customer_agreements` — اتفاقيات المنتجات

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | SERIAL | PK | |
| `customer_id` | VARCHAR(15) | FK → customers.id | |
| `product_name` | VARCHAR(100) | NOT NULL | |
| `target_price_eur` | DECIMAL(10,3) | NOT NULL | السعر المتفق بالعملة |
| `packaging_spec` | VARCHAR(100) | | مواصفات التعبئة |

---

### 4. جدول `suppliers` — الموردون

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(15) | PK | معرّف: `SUPP-001` |
| `code` | VARCHAR(20) | UNIQUE NOT NULL | |
| `name` | VARCHAR(200) | NOT NULL | |
| `type` | ENUM | NOT NULL | مورد خام زراعي / مورد بضاعة جاهزة / مورد مستلزمات |
| `product` | VARCHAR(100) | | المنتج الرئيسي الذي يورّده |
| `phone` | VARCHAR(30) | | |
| `location` | VARCHAR(150) | | الموقع الجغرافي |
| `status` | ENUM | DEFAULT 'معتمد' | معتمد / معلّق / موقوف |

---

### 5. جدول `contractors` — المقاولون

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(15) | PK | معرّف: `CONT-001` |
| `name` | VARCHAR(100) | NOT NULL | |
| `tariff_rate_per_kg` | DECIMAL(8,2) | NOT NULL | أتعاب لكل كجم جاهز (ج.م) |
| `phone` | VARCHAR(30) | | |
| `station` | VARCHAR(100) | FK → stations.name | المحطة المرتبطة |
| `specialization` | VARCHAR(200) | | التخصص |
| `status` | ENUM | DEFAULT 'نشط' | نشط / موقوف |

---

### 6. جدول `stations` — محطات التبريد والتجميد

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(10) | PK | معرّف: `STN-01` |
| `name` | VARCHAR(100) | UNIQUE NOT NULL | |
| `location` | VARCHAR(150) | | |
| `cold_storage_capacity_kg` | INTEGER | | السعة الاستيعابية (كجم) |
| `electricity_rate_per_kg` | DECIMAL(8,2) | | رسوم الكيلو بالكجم (ج.م) |
| `supervisor` | VARCHAR(100) | | اسم المشرف |

---

### 7. جدول `products` — كتالوج المنتجات

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(10) | PK | معرّف: `PRD-01` |
| `name` | VARCHAR(100) | NOT NULL | |
| `code` | VARCHAR(20) | UNIQUE | |
| `category` | VARCHAR(50) | | فواكه مجمدة / خضار مجمد |
| `default_unit` | VARCHAR(10) | DEFAULT 'KG' | |
| `standard_waste_pct` | DECIMAL(5,2) | | نسبة الهالك المعيارية % |
| `standard_yield_pct` | DECIMAL(5,2) | | نسبة الإنتاجية المعيارية % |

---

### 8. جدول `supplies` — المستلزمات والتغليف

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(10) | PK | معرّف: `SUP-01` |
| `code` | VARCHAR(20) | UNIQUE | |
| `name` | VARCHAR(150) | NOT NULL | |
| `category` | ENUM | | كرتونة / أكياس / بالتات / لاصق / تغليف |
| `capacity_kg` | DECIMAL(8,2) | | للكراتين فقط |
| `unit` | VARCHAR(20) | | كرتونة / كيس / بكرة / رول |
| `stock` | DECIMAL(12,2) | DEFAULT 0 | الرصيد الحالي |
| `unit_price` | DECIMAL(10,2) | | سعر الوحدة (ج.م) |

---

### 9. جدول `raw_batches` — لوطات المواد الخام

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `batch_id` | VARCHAR(30) | PK | مثال: `LOT-RAW-20260815-01` |
| `station_id` | VARCHAR(10) | FK → stations.id | المحطة المستلِمة |
| `raw_product` | VARCHAR(50) | NOT NULL | فراولة / مانجو / بامية |
| `supplier_id` | VARCHAR(15) | FK → suppliers.id | |
| `initial_qty` | DECIMAL(12,2) | NOT NULL | الكمية الأولية (كجم) |
| `available_qty` | DECIMAL(12,2) | NOT NULL | الرصيد المتبقي |
| `unit_cost` | DECIMAL(10,2) | NOT NULL | تكلفة الكيلو الموزونة (ج.م) |
| `received_date` | DATE | NOT NULL | |
| `qc_status` | ENUM | DEFAULT 'APPROVED' | APPROVED / REJECTED / PENDING |
| `brix_degree` | DECIMAL(5,2) | | درجة البريكس |
| `truck_plate` | VARCHAR(20) | | لوحة السيارة |

---

### 10. جدول `processing_operations` — عمليات الإنتاج

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(15) | PK | مثال: `PR-2026-001` |
| `date` | DATE | NOT NULL | |
| `station_id` | VARCHAR(10) | FK → stations.id | |
| `raw_product` | VARCHAR(50) | | |
| `finished_product` | VARCHAR(100) | | |
| `contractor_id` | VARCHAR(15) | FK → contractors.id | |
| `locked` | BOOLEAN | DEFAULT TRUE | |
| `raw_input_kg` | DECIMAL(12,2) | | إجمالي الخام المدخل |
| `finished_output_kg` | DECIMAL(12,2) | | الناتج الجاهز |
| `secondary_output_kg` | DECIMAL(12,2) | DEFAULT 0 | الناتج الثانوي |
| `raw_waste_kg` | DECIMAL(12,2) | | الهالك الفعلي |
| `yield_percent` | DECIMAL(5,2) | | نسبة الإنتاجية % |
| `raw_cost` | DECIMAL(15,2) | | |
| `supplies_consumed_cost` | DECIMAL(15,2) | | |
| `supplies_waste_cost` | DECIMAL(15,2) | | |
| `contractor_cost` | DECIMAL(15,2) | | |
| `station_cost` | DECIMAL(15,2) | | |
| `other_cost` | DECIMAL(15,2) | DEFAULT 0 | |
| `grand_total_cost` | DECIMAL(15,2) | | |
| `cost_per_kg` | DECIMAL(10,2) | | |
| `generated_batch_id` | VARCHAR(20) | FK → finished_goods_batches.id | |
| `notes` | TEXT | | |
| `created_by` | VARCHAR(10) | FK → users.id | |

---

### 11. جدول `operation_raw_issues` — سحب الخام للإنتاج

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | SERIAL | PK | |
| `operation_id` | VARCHAR(15) | FK → processing_operations.id | |
| `batch_id` | VARCHAR(30) | FK → raw_batches.batch_id | |
| `supplier_name` | VARCHAR(200) | | (denormalized للتتبع) |
| `qty` | DECIMAL(12,2) | NOT NULL | الكمية المسحوبة |
| `unit_cost` | DECIMAL(10,2) | | |
| `total_cost` | DECIMAL(15,2) | | |

---

### 12. جدول `operation_supply_issues` — استهلاك المستلزمات

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | SERIAL | PK | |
| `operation_id` | VARCHAR(15) | FK → processing_operations.id | |
| `supply_id` | VARCHAR(10) | FK → supplies.id | |
| `consumed` | DECIMAL(12,2) | | الكمية المستهلكة |
| `waste` | DECIMAL(12,2) | | الكمية الهالكة |
| `withdrawn` | DECIMAL(12,2) | | consumed + waste |
| `unit_cost` | DECIMAL(10,2) | | |
| `consumed_cost` | DECIMAL(15,2) | | |
| `waste_cost` | DECIMAL(15,2) | | |

---

### 13. جدول `finished_goods_batches` — باتشات المنتج الجاهز

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `fg_batch_id` | VARCHAR(25) | PK | FG-PR-XXXX أو FG-DIR-XXXX |
| `source_type` | ENUM | NOT NULL | MANUFACTURED / DIRECT_PURCHASE |
| `source_op_id` | VARCHAR(15) | FK → processing_operations.id | للـ MANUFACTURED فقط |
| `deal_ref` | VARCHAR(15) | FK → direct_purchases.deal_id | للـ DIRECT_PURCHASE فقط |
| `station_id` | VARCHAR(10) | FK → stations.id | |
| `product_name` | VARCHAR(100) | NOT NULL | |
| `production_date` | DATE | NOT NULL | |
| `expiry_date` | DATE | | |
| `initial_qty` | DECIMAL(12,2) | NOT NULL | |
| `available_qty` | DECIMAL(12,2) | NOT NULL | |
| `cost_per_kg` | DECIMAL(10,2) | | |
| `total_value` | DECIMAL(15,2) | | |
| `quality_status` | VARCHAR(100) | | |
| `notes` | TEXT | | |

---

### 14. جدول `direct_purchases` — صفقات البضاعة الجاهزة

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `deal_id` | VARCHAR(15) | PK | مثال: `DEAL-2026-001` |
| `date` | DATE | NOT NULL | |
| `supplier_id` | VARCHAR(15) | FK → suppliers.id | |
| `product_name` | VARCHAR(100) | NOT NULL | |
| `station_id` | VARCHAR(10) | FK → stations.id | |
| `qty_kg` | DECIMAL(12,2) | NOT NULL | |
| `package_type` | VARCHAR(100) | | |
| `package_count` | INTEGER | | |
| `purchase_price_per_kg` | DECIMAL(10,2) | | |
| `transport_cost` | DECIMAL(12,2) | DEFAULT 0 | |
| `total_cost` | DECIMAL(15,2) | | |
| `cost_per_kg` | DECIMAL(10,2) | | |
| `generated_batch_id` | VARCHAR(25) | FK → finished_goods_batches.id | |
| `invoice_no` | VARCHAR(50) | | |
| `status` | VARCHAR(50) | | |
| `notes` | TEXT | | |

---

### 15. جدول `client_orders` — طلبيات العملاء

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `order_id` | VARCHAR(15) | PK | مثال: `ORD-2026-001` |
| `order_date` | DATE | NOT NULL | |
| `customer_id` | VARCHAR(15) | FK → customers.id | |
| `product_name` | VARCHAR(100) | NOT NULL | |
| `packaging_spec` | VARCHAR(100) | | |
| `ordered_qty_kg` | DECIMAL(12,2) | NOT NULL | |
| `unfulfilled_qty_kg` | DECIMAL(12,2) | | الكمية المتبقية غير المشحونة |
| `unit_price_eur` | DECIMAL(10,3) | | السعر المتفق |
| `fx_rate` | DECIMAL(10,4) | | سعر الصرف عند الطلبية |
| `delivery_terms` | VARCHAR(50) | | FOB / CIF / CFR |
| `target_ship_date` | DATE | | |
| `destination_port` | VARCHAR(100) | | |
| `status` | VARCHAR(50) | | جديدة / قيد التجهيز / مشحونة / مكتملة |

---

### 16. جدول `shipments` — الشحنات التصديرية

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `shipment_id` | VARCHAR(15) | PK | مثال: `SHP-2026-001` |
| `order_id` | VARCHAR(15) | FK → client_orders.order_id | |
| `dispatch_date` | DATE | NOT NULL | |
| `container_no` | VARCHAR(30) | | رقم الحاوية |
| `seal_no` | VARCHAR(30) | | رقم الختم |
| `shipping_line` | VARCHAR(100) | | شركة الشحن |
| `booking_no` | VARCHAR(30) | | رقم الحجز |
| `shipped_qty_kg` | DECIMAL(12,2) | NOT NULL | |
| `production_cost` | DECIMAL(15,2) | | |
| `inland_trucking` | DECIMAL(12,2) | | شحن بري |
| `ocean_freight` | DECIMAL(12,2) | | شحن بحري |
| `customs_clearance` | DECIMAL(12,2) | | تخليص جمركي |
| `inspection_certificates` | DECIMAL(12,2) | | شهادات |
| `port_terminal_charges` | DECIMAL(12,2) | | رسوم ميناء |
| `total_shipment_cost` | DECIMAL(15,2) | | |
| `selling_price_eur` | DECIMAL(10,3) | | |
| `fx_rate` | DECIMAL(10,4) | | |
| `gross_revenue_egp` | DECIMAL(15,2) | | |
| `net_profit_egp` | DECIMAL(15,2) | | |
| `margin_percent` | DECIMAL(5,2) | | |
| `status` | VARCHAR(50) | | |
| `destination_port` | VARCHAR(100) | | |
| `created_by` | VARCHAR(10) | FK → users.id | |

---

### 17. جدول `shipment_allocated_batches` — تخصيص الباتشات للشحنات

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | SERIAL | PK | |
| `shipment_id` | VARCHAR(15) | FK → shipments.id | |
| `fg_batch_id` | VARCHAR(25) | FK → finished_goods_batches.id | |
| `qty` | DECIMAL(12,2) | NOT NULL | |
| `cost_per_kg` | DECIMAL(10,2) | | |

---

### 18. جدول `treasury_accounts` — الخزينة والبنوك

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | VARCHAR(10) | PK | مثال: `ACC-01` |
| `name` | VARCHAR(150) | NOT NULL | |
| `currency` | VARCHAR(5) | NOT NULL | EGP / EUR / USD |
| `balance` | DECIMAL(15,2) | DEFAULT 0 | الرصيد الحالي |
| `account_no` | VARCHAR(50) | | رقم الحساب |

---

### 19. جدول `financial_transactions` — القيود المالية

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `txn_id` | VARCHAR(15) | PK | مثال: `TXN-2026-001` |
| `date` | DATE | NOT NULL | |
| `type` | VARCHAR(100) | NOT NULL | نوع القيد |
| `party_type` | VARCHAR(50) | | عميل / مورد / مقاول / محطة |
| `party_name` | VARCHAR(200) | | |
| `amount_egp` | DECIMAL(15,2) | NOT NULL | المبلغ بالجنيه |
| `amount_currency` | DECIMAL(15,2) | | بالعملة الأجنبية |
| `currency` | VARCHAR(5) | | |
| `account_id` | VARCHAR(10) | FK → treasury_accounts.id | |
| `ref_doc` | VARCHAR(50) | | المستند المرجعي |
| `description` | TEXT | | |
| `status` | VARCHAR(20) | DEFAULT 'معتمد' | |
| `created_by` | VARCHAR(10) | FK → users.id | |

---

### 20. جدول `stock_transfers` — التحويلات بين المحطات

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `transfer_id` | VARCHAR(15) | PK | مثال: `TRF-2026-001` |
| `date` | DATE | NOT NULL | |
| `from_station_id` | VARCHAR(10) | FK → stations.id | |
| `to_station_id` | VARCHAR(10) | FK → stations.id | |
| `product_name` | VARCHAR(100) | | |
| `batch_id` | VARCHAR(25) | FK → finished_goods_batches.id | |
| `qty_kg` | DECIMAL(12,2) | NOT NULL | |
| `truck_plate` | VARCHAR(20) | | |
| `driver_name` | VARCHAR(100) | | |
| `status` | VARCHAR(50) | DEFAULT 'تم الاستلام بنجاح' | |

---

### 21. جدول `audit_log` — سجل التدقيق

| العمود | النوع | Constraints | الوصف |
|-------|------|------------|-------|
| `id` | SERIAL | PK | |
| `entity_type` | VARCHAR(50) | NOT NULL | operation / shipment / transaction |
| `entity_id` | VARCHAR(30) | NOT NULL | |
| `action` | VARCHAR(50) | | CREATE / LOCK / DISPATCH / etc |
| `summary` | TEXT | | |
| `performed_by` | VARCHAR(10) | FK → users.id | |
| `performed_at` | TIMESTAMP | DEFAULT NOW() | |
