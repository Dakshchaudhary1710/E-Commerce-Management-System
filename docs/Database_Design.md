# Database Design Specification

**Course:** Relational Database Management Systems Laboratory  
**Institution:** Manipal University Jaipur  
**Engine:** MySQL 8.0+ / 9.x InnoDB  
**Charset & Collation:** `utf8mb4` / `utf8mb4_unicode_ci`  

---

## 1. Storage Engine Choice: MySQL InnoDB

The database exclusively uses the **InnoDB** storage engine for all entities to guarantee:
- **Full ACID Transaction Compliance** (Atomicity, Consistency, Isolation, Durability)
- **Row-level locking** (`SELECT ... FOR UPDATE`) preventing race conditions during concurrent checkout
- **Foreign Key Enforcement** with declarative cascading and restrict behaviors
- **Crash Recovery** through write-ahead logging (WAL) and redo/undo logs

---

## 2. Table Specifications & Constraints

### 2.1 Table: `customers`
Stores registered customer credentials and profiles.
- `customer_id` (INT, PK, AUTO_INCREMENT)
- `first_name` (VARCHAR(50), NOT NULL)
- `last_name` (VARCHAR(50), NOT NULL)
- `email` (VARCHAR(100), NOT NULL, UNIQUE, CHECK `email LIKE '%_@__%.__%'`)
- `phone` (VARCHAR(20), NOT NULL, UNIQUE)
- `password_hash` (VARCHAR(255), NOT NULL)
- `is_active` (TINYINT(1), NOT NULL, DEFAULT 1)
- `created_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

### 2.2 Table: `addresses`
Allows customers to maintain multiple addresses (1:N).
- `address_id` (INT, PK, AUTO_INCREMENT)
- `customer_id` (INT, NOT NULL, FK &rarr; `customers.customer_id` ON DELETE CASCADE)
- `street_address` (VARCHAR(255), NOT NULL)
- `city` (VARCHAR(100), NOT NULL)
- `state` (VARCHAR(100), NOT NULL)
- `postal_code` (VARCHAR(20), NOT NULL)
- `country` (VARCHAR(100), NOT NULL, DEFAULT 'India')
- `is_default` (TINYINT(1), NOT NULL, DEFAULT 0)
- `created_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### 2.3 Table: `categories`
Hierarchical product taxonomy supporting parent-child categories.
- `category_id` (INT, PK, AUTO_INCREMENT)
- `category_name` (VARCHAR(100), NOT NULL, UNIQUE)
- `description` (TEXT)
- `parent_id` (INT, FK &rarr; `categories.category_id` ON DELETE SET NULL)
- `created_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP)

### 2.4 Table: `products`
The core catalog inventory entity.
- `product_id` (INT, PK, AUTO_INCREMENT)
- `category_id` (INT, NOT NULL, FK &rarr; `categories.category_id` ON DELETE RESTRICT)
- `product_name` (VARCHAR(150), NOT NULL)
- `sku` (VARCHAR(50), NOT NULL, UNIQUE)
- `price` (DECIMAL(10,2), NOT NULL, CHECK `price >= 0.00`)
- `stock_quantity` (INT, NOT NULL, DEFAULT 0, CHECK `stock_quantity >= 0`)
- `description` (TEXT)
- `image_url` (VARCHAR(255))
- `is_active` (TINYINT(1), NOT NULL, DEFAULT 1)
- `created_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

### 2.5 Table: `orders`
Master purchase orders placed by customers.
- `order_id` (INT, PK, AUTO_INCREMENT)
- `customer_id` (INT, NOT NULL, FK &rarr; `customers.customer_id` ON DELETE RESTRICT)
- `shipping_address_id` (INT, NOT NULL, FK &rarr; `addresses.address_id` ON DELETE RESTRICT)
- `order_date` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
- `total_amount` (DECIMAL(10,2), NOT NULL, DEFAULT 0.00, CHECK `total_amount >= 0.00`)
- `order_status` (VARCHAR(20), NOT NULL, DEFAULT 'PENDING', CHECK IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'))
- `notes` (TEXT)

### 2.6 Table: `order_items`
Associative table resolving the M:N relationship between Orders and Products.
- `order_item_id` (INT, PK, AUTO_INCREMENT)
- `order_id` (INT, NOT NULL, FK &rarr; `orders.order_id` ON DELETE CASCADE)
- `product_id` (INT, NOT NULL, FK &rarr; `products.product_id` ON DELETE RESTRICT)
- `quantity` (INT, NOT NULL, CHECK `quantity > 0`)
- `unit_price` (DECIMAL(10,2), NOT NULL, CHECK `unit_price >= 0.00`)
- `subtotal` (DECIMAL(10,2), NOT NULL, CHECK `subtotal >= 0.00`)
- Composite Unique Constraint: `UNIQUE KEY uq_order_item_pair (order_id, product_id)`

### 2.7 Table: `payments`
Financial payment settlement records.
- `payment_id` (INT, PK, AUTO_INCREMENT)
- `order_id` (INT, NOT NULL, UNIQUE, FK &rarr; `orders.order_id` ON DELETE RESTRICT)
- `payment_date` (DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP)
- `amount` (DECIMAL(10,2), NOT NULL, CHECK `amount > 0.00`)
- `payment_method` (VARCHAR(30), NOT NULL, CHECK IN ('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'CASH_ON_DELIVERY'))
- `payment_status` (VARCHAR(20), NOT NULL, DEFAULT 'PENDING', CHECK IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'))
- `transaction_reference` (VARCHAR(100), NOT NULL, UNIQUE)

### 2.8 Table: `deliveries`
Fulfillment logistics and multi-carrier consignment tracking.
- `delivery_id` (INT, PK, AUTO_INCREMENT)
- `order_id` (INT, NOT NULL, UNIQUE, FK &rarr; `orders.order_id` ON DELETE RESTRICT)
- `carrier_name` (VARCHAR(100), NOT NULL, DEFAULT 'BlueDart Express')
- `tracking_number` (VARCHAR(100), NOT NULL, UNIQUE)
- `dispatch_date` (DATETIME, DEFAULT NULL)
- `estimated_delivery_date` (DATE, NOT NULL)
- `actual_delivery_date` (DATETIME, DEFAULT NULL)
- `delivery_status` (VARCHAR(20), NOT NULL, DEFAULT 'PENDING', CHECK IN ('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'))

---

## 3. Indexing Strategy

B-Tree indexes are deployed across high-frequency join attributes, filters, and sorted fields:
1. `idx_products_category` on `products(category_id)` &mdash; Accelerates category-based browsing.
2. `idx_products_price` on `products(price)` &mdash; Accelerates range searches and sort by price.
3. `idx_products_stock` on `products(stock_quantity)` &mdash; Accelerates low-stock inventory alerts.
4. `idx_orders_customer` on `orders(customer_id)` &mdash; Speeds up customer order history retrieval.
5. `idx_orders_date` on `orders(order_date)` &mdash; Speeds up temporal sales queries.
6. `idx_orders_status` on `orders(order_status)` &mdash; Optimizes status filtering.
7. `idx_orders_cust_date` on `orders(customer_id, order_date)` &mdash; Compound index for customer activity reports.
8. `idx_payments_status` on `payments(payment_status)` &mdash; Accelerates pending payment reconciliation.
9. `idx_deliveries_status` on `deliveries(delivery_status)` &mdash; Accelerates fulfillment tracking.
