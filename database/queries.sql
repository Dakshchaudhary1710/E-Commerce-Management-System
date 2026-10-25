-- ============================================================================
-- E-COMMERCE MANAGEMENT SYSTEM — DEMONSTRATION & LAB EXPERIMENT QUERIES
-- Department of Computer Science & Engineering, Manipal University Jaipur
-- Database: ecommerce_db
-- ============================================================================

USE ecommerce_db;

-- ============================================================================
-- 1. DATA DEFINITION LANGUAGE (DDL)
-- ============================================================================

-- 1.1 CREATE: Demonstrating table creation with constraints on a temporary demo object
CREATE TABLE IF NOT EXISTS `demo_promotions` (
    `promo_id` INT AUTO_INCREMENT PRIMARY KEY,
    `promo_code` VARCHAR(30) NOT NULL UNIQUE,
    `discount_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    CONSTRAINT `chk_discount_range` CHECK (`discount_percentage` BETWEEN 1.00 AND 90.00),
    CONSTRAINT `chk_promo_dates` CHECK (`end_date` >= `start_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1.2 ALTER: Add a column, modify column definition, and add an index
ALTER TABLE `demo_promotions` 
    ADD COLUMN `usage_limit` INT NOT NULL DEFAULT 100 AFTER `discount_percentage`;

ALTER TABLE `demo_promotions` 
    ADD INDEX `idx_promo_active_dates` (`is_active`, `start_date`, `end_date`);

-- 1.3 DROP: Safely drop the temporary demonstration table
DROP TABLE IF EXISTS `demo_promotions`;


-- ============================================================================
-- 2. DATA MANIPULATION LANGUAGE (DML)
-- ============================================================================

-- 2.1 INSERT: Adding a test product
INSERT INTO `products` (`category_id`, `product_name`, `sku`, `price`, `stock_quantity`, `description`, `image_url`)
VALUES (2, 'Mechanical Gaming Keyboard Pro', 'SKU-DEMO-KBD99', 4999.00, 25, 'RGB Backlit Hot-swappable tactile switches', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500');

-- 2.2 UPDATE: Modifying price and stock
UPDATE `products`
SET `price` = 4599.00, `stock_quantity` = 30
WHERE `sku` = 'SKU-DEMO-KBD99';

-- 2.3 DELETE: Removing the test product safely
DELETE FROM `products`
WHERE `sku` = 'SKU-DEMO-KBD99';


-- ============================================================================
-- 3. DATA QUERY LANGUAGE (DQL) FUNDAMENTALS
-- ============================================================================

-- 3.1 SELECT with WHERE, ORDER BY, and LIMIT
SELECT `product_id`, `product_name`, `price`, `stock_quantity`
FROM `products`
WHERE `price` >= 10000.00 AND `stock_quantity` > 0
ORDER BY `price` DESC
LIMIT 5;

-- 3.2 DISTINCT: Unique payment methods utilized by customers
SELECT DISTINCT `payment_method`
FROM `payments`
ORDER BY `payment_method` ASC;


-- ============================================================================
-- 4. JOINS (INNER JOIN, LEFT JOIN, MULTI-TABLE JOINS)
-- ============================================================================

-- 4.1 INNER JOIN: Display orders alongside their customer name and shipping city
SELECT 
    o.order_id,
    o.order_date,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email,
    a.city,
    a.state,
    o.total_amount,
    o.order_status
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
INNER JOIN addresses a ON o.shipping_address_id = a.address_id
ORDER BY o.order_date DESC;

-- 4.2 LEFT JOIN: All categories and their product counts (including categories with 0 products)
SELECT 
    c.category_id,
    c.category_name,
    COUNT(p.product_id) AS product_count,
    COALESCE(AVG(p.price), 0.00) AS avg_product_price
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id
GROUP BY c.category_id, c.category_name
ORDER BY product_count DESC;

-- 4.3 MULTI-TABLE JOIN: Detailed Order Items breakdown
SELECT 
    o.order_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    p.product_name,
    cat.category_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN customers c ON o.customer_id = c.customer_id
JOIN products p ON oi.product_id = p.product_id
JOIN categories cat ON p.category_id = cat.category_id
WHERE o.order_id = 1;


-- ============================================================================
-- 5. AGGREGATE FUNCTIONS, GROUP BY & HAVING
-- ============================================================================

-- 5.1 Comprehensive Category Sales Performance
SELECT 
    c.category_name,
    COUNT(DISTINCT p.product_id) AS total_products,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.subtotal), 0.00) AS total_revenue,
    COALESCE(AVG(oi.unit_price), 0.00) AS avg_selling_price
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status <> 'CANCELLED'
GROUP BY c.category_id, c.category_name
ORDER BY total_revenue DESC;

-- 5.2 GROUP BY with HAVING: High-volume customers (spent over ₹20,000)
SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email,
    COUNT(o.order_id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_status <> 'CANCELLED'
GROUP BY c.customer_id, c.first_name, c.last_name, c.email
HAVING total_spent > 20000.00
ORDER BY total_spent DESC;


-- ============================================================================
-- 6. SUBQUERIES (CORRELATED & NESTED)
-- ============================================================================

-- 6.1 Subquery in WHERE: Products priced higher than the overall catalog average
SELECT 
    p.product_id,
    p.product_name,
    p.price,
    cat.category_name,
    (SELECT ROUND(AVG(price), 2) FROM products) AS catalog_avg_price
FROM products p
JOIN categories cat ON p.category_id = cat.category_id
WHERE p.price > (SELECT AVG(price) FROM products)
ORDER BY p.price DESC;

-- 6.2 Correlated Subquery: Customers whose spending exceeds their own average order value
SELECT 
    o.order_id,
    o.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    o.total_amount,
    (SELECT ROUND(AVG(o2.total_amount), 2) FROM orders o2 WHERE o2.customer_id = o.customer_id) AS customer_avg_order
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.total_amount > (
    SELECT AVG(o2.total_amount) 
    FROM orders o2 
    WHERE o2.customer_id = o.customer_id
)
ORDER BY o.total_amount DESC;


-- ============================================================================
-- 7. REQUIRED CORE ANALYTICAL QUERIES
-- ============================================================================

-- 7.1 Best-Selling Products (Top 5 by Revenue)
SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.subtotal) AS gross_sales,
    p.stock_quantity AS current_stock
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_status <> 'CANCELLED'
GROUP BY p.product_id, p.product_name, c.category_name, p.stock_quantity
ORDER BY gross_sales DESC
LIMIT 5;

-- 7.2 Orders Grouped by Status
SELECT 
    order_status,
    COUNT(order_id) AS order_count,
    SUM(total_amount) AS status_total_value
FROM orders
GROUP BY order_status
ORDER BY order_count DESC;

-- 7.3 Products with Low Stock (<= 5 units)
SELECT 
    p.product_id,
    p.product_name,
    p.sku,
    c.category_name,
    p.price,
    p.stock_quantity,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'OUT OF STOCK'
        WHEN p.stock_quantity <= 2 THEN 'CRITICAL'
        ELSE 'LOW'
    END AS alert_level
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.stock_quantity <= 5
ORDER BY p.stock_quantity ASC;

-- 7.4 Payment and Delivery Summaries
SELECT 
    pay.payment_method,
    COUNT(pay.payment_id) AS total_transactions,
    SUM(CASE WHEN pay.payment_status = 'COMPLETED' THEN pay.amount ELSE 0 END) AS settled_amount,
    SUM(CASE WHEN pay.payment_status = 'PENDING' THEN pay.amount ELSE 0 END) AS pending_amount,
    SUM(CASE WHEN pay.payment_status = 'FAILED' THEN pay.amount ELSE 0 END) AS failed_amount
FROM payments pay
GROUP BY pay.payment_method;

SELECT 
    delivery_status,
    carrier_name,
    COUNT(delivery_id) AS parcel_count
FROM deliveries
GROUP BY delivery_status, carrier_name
ORDER BY carrier_name, parcel_count DESC;


-- ============================================================================
-- 8. VIEW USAGE (PRE-COMPILED ANALYTICS)
-- ============================================================================

-- Querying the sales reporting view
SELECT * FROM `vw_category_sales` ORDER BY total_revenue_generated DESC;

-- Querying the customer spending view
SELECT * FROM `vw_customer_spending` WHERE total_orders > 0 ORDER BY total_spent DESC LIMIT 5;

-- Querying the low-stock alert view
SELECT * FROM `vw_low_stock_products`;


-- ============================================================================
-- 9. TRANSACTION INTEGRITY DEMONSTRATION (ACID COMPLIANCE)
-- ============================================================================

-- 9.1 Successful Order Creation with Stock Decrement (COMMIT)
START TRANSACTION;

-- Step A: Validate stock availability and lock row
SELECT product_id, stock_quantity, price 
FROM products 
WHERE product_id = 10 AND stock_quantity >= 1
FOR UPDATE;

-- Step B: Insert the master order
INSERT INTO orders (customer_id, shipping_address_id, total_amount, order_status, notes)
VALUES (1, 1, 2999.00, 'PENDING', 'Transaction test order - commit');

SET @new_order_id = LAST_INSERT_ID();

-- Step C: Insert the order item
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
VALUES (@new_order_id, 10, 1, 2999.00, 2999.00);

-- Step D: Atomically decrement stock
UPDATE products 
SET stock_quantity = stock_quantity - 1 
WHERE product_id = 10;

-- Step E: Create delivery and payment placeholders
INSERT INTO payments (order_id, amount, payment_method, payment_status, transaction_reference)
VALUES (@new_order_id, 2999.00, 'UPI', 'COMPLETED', CONCAT('TXN-TEST-', @new_order_id));

INSERT INTO deliveries (order_id, carrier_name, tracking_number, estimated_delivery_date, delivery_status)
VALUES (@new_order_id, 'BlueDart Express', CONCAT('TRACK-TEST-', @new_order_id), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'PENDING');

-- Step F: Commit the entire atomic unit of work
COMMIT;


-- 9.2 Failed Order Demonstration with Stock Protection (ROLLBACK)
START TRANSACTION;

-- Suppose product #11 has 0 stock (Spigen Armor Case)
SELECT product_id, product_name, stock_quantity 
FROM products 
WHERE product_id = 11;

-- If stock is insufficient, application aborts and rolls back:
-- ROLLBACK;
-- Clean up test records:
DELETE FROM deliveries WHERE tracking_number LIKE 'TRACK-TEST-%';
DELETE FROM payments WHERE transaction_reference LIKE 'TXN-TEST-%';
DELETE FROM order_items WHERE order_id = @new_order_id;
DELETE FROM orders WHERE order_id = @new_order_id;
UPDATE products SET stock_quantity = stock_quantity + 1 WHERE product_id = 10;
