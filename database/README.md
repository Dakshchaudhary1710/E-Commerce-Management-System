# E-Commerce Management System — Database Documentation

**Institution:** Manipal University Jaipur  
**Course:** Relational Database Management Systems (RDBMS) Laboratory  
**Database Name:** `ecommerce_db`  
**Storage Engine:** MySQL InnoDB (ACID Compliant)  
**Default Collation:** `utf8mb4_unicode_ci`

---

## 1. Relational Schema Architecture

The database is modeled to **3rd Normal Form (3NF)** to eliminate redundancy and maintain referential integrity.

### Tables & Relational Roles

| Table Name | Primary Key | Foreign Keys | Purpose |
| :--- | :--- | :--- | :--- |
| `customers` | `customer_id` | None | Stores user profile, email (unique), contact, and password hash. |
| `addresses` | `address_id` | `customer_id` &rarr; `customers` | Multi-address support per customer (1:N). |
| `categories` | `category_id` | `parent_id` &rarr; `categories` | Product hierarchy and taxonomic grouping. |
| `products` | `product_id` | `category_id` &rarr; `categories` | Product catalog, pricing, SKU (unique), and stock. |
| `carts` | `cart_id` | `customer_id` &rarr; `customers` (unique) | Persistent shopping carts (1:1 with customer). |
| `cart_items` | `cart_item_id` | `cart_id`, `product_id` | Line items residing in a customer's active cart. |
| `orders` | `order_id` | `customer_id`, `shipping_address_id` | Customer order transactions and master financial totals. |
| `order_items` | `order_item_id` | `order_id`, `product_id` | Specific products, quantities, and lock-in price per order. |
| `payments` | `payment_id` | `order_id` &rarr; `orders` (unique) | Financial audit trail (UPI, Cards, COD, NetBanking). |
| `deliveries` | `delivery_id` | `order_id` &rarr; `orders` (unique) | Logistics tracking, courier partners, and fulfillment state. |
| `inventory_logs` | `log_id` | `product_id`, `reference_order_id` | Real-time stock audit ledger capturing deductions/restocks. |

---

## 2. Integrity Constraints & Business Logic

1. **Entity Integrity:**
   - All primary keys are `AUTO_INCREMENT` integers.
2. **Referential Integrity:**
   - `ON DELETE RESTRICT` on `orders.customer_id` and `order_items.product_id` prevents deleting customers or catalog items with historical financial records.
   - `ON DELETE CASCADE` on `order_items.order_id` and `addresses.customer_id`.
3. **Domain & Check Constraints:**
   - `chk_product_price`: `price >= 0.00`
   - `chk_product_stock`: `stock_quantity >= 0` (guarantees negative inventory cannot occur)
   - `chk_order_items_qty`: `quantity > 0`
   - `chk_orders_status`: `order_status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')`
   - `chk_payments_method`: `payment_method IN ('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'CASH_ON_DELIVERY')`
   - `chk_payments_status`: `payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`
   - `chk_deliveries_status`: `delivery_status IN ('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED')`
   - `chk_customer_email_format`: `email LIKE '%_@__%.__%'`
4. **Unique Constraints:**
   - `customers.email`, `customers.phone`
   - `products.sku`
   - `cart_items(cart_id, product_id)`
   - `order_items(order_id, product_id)`
   - `payments.transaction_reference`
   - `deliveries.tracking_number`

---

## 3. Database Views

The database includes 5 pre-compiled views for real-time reporting and administrative dashboards:

1. `vw_order_summary`: Joins `orders`, `customers`, `addresses`, `order_items`, `payments`, and `deliveries`.
2. `vw_category_sales`: Aggregates sold units and gross sales revenue per category.
3. `vw_customer_spending`: Customer lifetime spending, order count, and average order value.
4. `vw_low_stock_products`: Immediate low-stock alerts (`<= 5` units) with calculated reorder suggestions.
5. `vw_monthly_revenue`: Monthly breakdown of gross orders, delivered orders, cancelled orders, and settled amounts.

---

## 4. Setup & Execution Instructions

### Importing the Schema and Sample Data
Run from your terminal:
```bash
mysql -u root -p < database/ecommerce.sql
```
*(If your local MySQL root user has no password, omit `-p`)*

### Executing Demonstration Queries
```bash
mysql -u root -p < database/queries.sql
```
