-- ============================================================================
-- E-COMMERCE MANAGEMENT SYSTEM — RELATIONAL DATABASE MANAGEMENT SYSTEM PROJECT
-- Department of Computer Science & Engineering, Manipal University Jaipur
-- Database Name: ecommerce_db
-- Target Engine: MySQL 8.0+ / 9.x (InnoDB Engine with ACID Compliance)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. TABLE DEFINITIONS (DDL WITH CONSTRAINTS & INDEXES)
-- ============================================================================
-- ----------------------------------------------------------------------------
-- Table: `categories`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (

  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `parent_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_name` (`category_name`),
  KEY `fk_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `customers`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (

  `customer_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `uq_customer_email` (`email`),
  UNIQUE KEY `uq_customer_phone` (`phone`),
  CONSTRAINT `chk_customer_email_format` CHECK ((`email` like _utf8mb4'%_@__%.__%'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `addresses`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses` (

  `address_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `street_address` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `postal_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'India',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `fk_addresses_customer` (`customer_id`),
  CONSTRAINT `fk_addresses_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `products`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (

  `product_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `product_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  UNIQUE KEY `uq_product_sku` (`sku`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_price` (`price`),
  KEY `idx_products_stock` (`stock_quantity`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_product_price` CHECK ((`price` >= 0.00)),
  CONSTRAINT `chk_product_stock` CHECK ((`stock_quantity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `carts`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts` (

  `cart_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_id`),
  UNIQUE KEY `uq_cart_customer` (`customer_id`),
  CONSTRAINT `fk_carts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `cart_items`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (

  `cart_item_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_item_id`),
  UNIQUE KEY `uq_cart_item_pair` (`cart_id`,`product_id`),
  KEY `fk_cart_items_product` (`product_id`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`cart_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_cart_item_qty` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `orders`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (

  `order_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `shipping_address_id` int NOT NULL,
  `order_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `order_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_address` (`shipping_address_id`),
  KEY `idx_orders_customer` (`customer_id`),
  KEY `idx_orders_date` (`order_date`),
  KEY `idx_orders_status` (`order_status`),
  KEY `idx_orders_cust_date` (`customer_id`,`order_date`),
  CONSTRAINT `fk_orders_address` FOREIGN KEY (`shipping_address_id`) REFERENCES `addresses` (`address_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_orders_status` CHECK ((`order_status` in (_utf8mb4'PENDING',_utf8mb4'PROCESSING',_utf8mb4'SHIPPED',_utf8mb4'DELIVERED',_utf8mb4'CANCELLED'))),
  CONSTRAINT `chk_orders_total` CHECK ((`total_amount` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `order_items`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (

  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  UNIQUE KEY `uq_order_item_pair` (`order_id`,`product_id`),
  KEY `idx_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_order_items_qty` CHECK ((`quantity` > 0)),
  CONSTRAINT `chk_order_items_subtotal` CHECK ((`subtotal` >= 0.00)),
  CONSTRAINT `chk_order_items_unit_price` CHECK ((`unit_price` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `payments`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (

  `payment_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `payment_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `transaction_reference` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_payment_order` (`order_id`),
  UNIQUE KEY `uq_payment_ref` (`transaction_reference`),
  KEY `idx_payments_status` (`payment_status`),
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_payments_amount` CHECK ((`amount` > 0.00)),
  CONSTRAINT `chk_payments_method` CHECK ((`payment_method` in (_utf8mb4'CREDIT_CARD',_utf8mb4'DEBIT_CARD',_utf8mb4'UPI',_utf8mb4'NET_BANKING',_utf8mb4'CASH_ON_DELIVERY'))),
  CONSTRAINT `chk_payments_status` CHECK ((`payment_status` in (_utf8mb4'PENDING',_utf8mb4'COMPLETED',_utf8mb4'FAILED',_utf8mb4'REFUNDED')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `deliveries`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `deliveries`;
CREATE TABLE `deliveries` (

  `delivery_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `carrier_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BlueDart Express',
  `tracking_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispatch_date` datetime DEFAULT NULL,
  `estimated_delivery_date` date NOT NULL,
  `actual_delivery_date` datetime DEFAULT NULL,
  `delivery_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (`delivery_id`),
  UNIQUE KEY `uq_delivery_order` (`order_id`),
  UNIQUE KEY `uq_delivery_tracking` (`tracking_number`),
  KEY `idx_deliveries_status` (`delivery_status`),
  CONSTRAINT `fk_deliveries_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_deliveries_status` CHECK ((`delivery_status` in (_utf8mb4'PENDING',_utf8mb4'DISPATCHED',_utf8mb4'IN_TRANSIT',_utf8mb4'OUT_FOR_DELIVERY',_utf8mb4'DELIVERED',_utf8mb4'FAILED')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Table: `inventory_logs`
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (

  `log_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `change_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity_changed` int NOT NULL,
  `previous_stock` int NOT NULL,
  `new_stock` int NOT NULL,
  `reference_order_id` int DEFAULT NULL,
  `log_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_inv_log_product` (`product_id`),
  KEY `fk_inv_log_order` (`reference_order_id`),
  CONSTRAINT `fk_inv_log_order` FOREIGN KEY (`reference_order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_inv_log_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_inv_log_type` CHECK ((`change_type` in (_utf8mb4'RESTOCK',_utf8mb4'ORDER_DEDUCT',_utf8mb4'ORDER_CANCEL_RETURN',_utf8mb4'ADJUSTMENT')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. SAMPLE DATA POPULATION (REALISTIC E-COMMERCE RECORDS)
-- ============================================================================

-- Sample records for `categories`
INSERT INTO `categories` VALUES
(1,'Electronics','Electronic devices, computer hardware and consumer gadgets',NULL,'2026-10-23 14:33:30'),(2,'Laptops & Computers','Laptops, desktops, workstation machines and peripherals',1,'2026-10-23 14:33:30'),(3,'Smartphones & Mobile','Smartphones, feature phones, smartwatches and wearables',1,'2026-10-23 14:33:30'),(4,'Audio & Accessories','Headphones, earbuds, Bluetooth speakers and soundbars',1,'2026-10-23 14:33:30'),(5,'Fashion & Apparel','Men and women apparel, footwear, accessories and watches',NULL,'2026-10-23 14:33:30'),(6,'Books & Academic Notes','Technical textbooks, reference manuals and university guides',NULL,'2026-10-23 14:33:30'),(7,'Home & Living','Smart home appliances, desk accessories and lifestyle items',NULL,'2026-10-23 14:33:30');

-- Sample records for `customers`
INSERT INTO `customers` VALUES
(1,'Daksh','Chaudhary','daksh.chaudhary@muj.edu.in','+91-9876543210','pbkdf2_sha256$600000$mockhash_daksh$Pass1234',1,'2026-06-01 10:00:00','2026-10-23 14:33:30'),(2,'Aarav','Sharma','aarav.sharma@gmail.com','+91-9876543211','pbkdf2_sha256$600000$mockhash_aarav$Pass1234',1,'2026-06-05 11:15:00','2026-10-23 14:33:30'),(3,'Priya','Patel','priya.patel@yahoo.com','+91-9876543212','pbkdf2_sha256$600000$mockhash_priya$Pass1234',1,'2026-06-10 14:30:00','2026-10-23 14:33:30'),(4,'Rohan','Gupta','rohan.gupta@outlook.com','+91-9876543213','pbkdf2_sha256$600000$mockhash_rohan$Pass1234',1,'2026-06-15 09:45:00','2026-10-23 14:33:30'),(5,'Ananya','Singh','ananya.singh@gmail.com','+91-9876543214','pbkdf2_sha256$600000$mockhash_ananya$Pass1234',1,'2026-06-20 16:20:00','2026-10-23 14:33:30'),(6,'Vikram','Malhotra','vikram.m@gmail.com','+91-9876543215','pbkdf2_sha256$600000$mockhash_vikram$Pass1234',1,'2026-07-01 12:00:00','2026-10-23 14:33:30'),(7,'Sneha','Reddy','sneha.reddy@gmail.com','+91-9876543216','pbkdf2_sha256$600000$mockhash_sneha$Pass1234',1,'2026-07-10 15:10:00','2026-10-23 14:33:30'),(8,'Rahul','Verma','rahul.verma@techmail.in','+91-9876543217','pbkdf2_sha256$600000$mockhash_rahul$Pass1234',1,'2026-07-15 18:05:00','2026-10-23 14:33:30'),(9,'Ishita','Joshi','ishita.joshi@gmail.com','+91-9876543218','pbkdf2_sha256$600000$mockhash_ishita$Pass1234',1,'2026-08-01 10:40:00','2026-10-23 14:33:30'),(10,'Karan','Mehta','karan.mehta@gmail.com','+91-9876543219','pbkdf2_sha256$600000$mockhash_karan$Pass1234',1,'2026-08-10 13:25:00','2026-10-23 14:33:30'),(11,'Meera','Iyer','meera.iyer@gmail.com','+91-9876543220','pbkdf2_sha256$600000$mockhash_meera$Pass1234',1,'2026-09-01 09:00:00','2026-10-23 14:33:30'),(12,'Aditya','Nair','aditya.nair@gmail.com','+91-9876543221','pbkdf2_sha256$600000$mockhash_aditya$Pass1234',1,'2026-09-05 17:30:00','2026-10-23 14:33:30');

-- Sample records for `addresses`
INSERT INTO `addresses` VALUES
(1,1,'Flat 402, Royal Palms, MUJ Road, Dehmi Kalan','Jaipur','Rajasthan','303007','India',1,'2026-10-23 14:33:30'),(2,1,'B-12, Malviya Nagar, Near Gaurav Tower','Jaipur','Rajasthan','302017','India',0,'2026-10-23 14:33:30'),(3,2,'A-45, Sector 62','Noida','Uttar Pradesh','201309','India',1,'2026-10-23 14:33:30'),(4,3,'704, Silver Oak Heights, Powai','Mumbai','Maharashtra','400076','India',1,'2026-10-23 14:33:30'),(5,4,'12/A, Koramangala 4th Block','Bengaluru','Karnataka','560034','India',1,'2026-10-23 14:33:30'),(6,5,'Flat 101, Banjara Hills Road No 12','Hyderabad','Telangana','500034','India',1,'2026-10-23 14:33:30'),(7,6,'402, Deccan Gymkhana','Pune','Maharashtra','411004','India',1,'2026-10-23 14:33:30'),(8,7,'Plot 88, Anna Nagar West','Chennai','Tamil Nadu','600040','India',1,'2026-10-23 14:33:30'),(9,8,'B-303, Aliganj','Lucknow','Uttar Pradesh','226024','India',1,'2026-10-23 14:33:30'),(10,9,'Flat 5B, Salt Lake Sector 5','Kolkata','West Bengal','700091','India',1,'2026-10-23 14:33:30');

-- Sample records for `products`
INSERT INTO `products` VALUES
(1,2,'Dell XPS 15 Laptop','SKU-DEL-XPS15',134999.00,15,'Intel Core i7 13th Gen, 16GB RAM, 512GB SSD, OLED Display','https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(2,2,'Apple MacBook Air M3','SKU-APP-MBA-M3',114900.00,20,'Apple M3 Chip, 8-Core CPU, 10-Core GPU, 16GB RAM, 512GB','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(3,2,'Lenovo Legion 5 Gaming Laptop','SKU-LEN-LEG5',89990.00,8,'AMD Ryzen 7, RTX 4060, 16GB DDR5, 1TB NVMe SSD','https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(4,2,'Logitech MX Master 3S Mouse','SKU-LOG-MXM3S',7995.00,44,'Quiet clicks, 8K DPI tracking on glass, electromagnetic wheel','https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:36:13'),(5,2,'Keychron K2 Mechanical Keyboard','SKU-KEY-K2V2',6499.00,3,'Wireless mechanical keyboard with Gateron Brown Switches (LOW STOCK)','https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(6,2,'Dell UltraSharp 27 4K Monitor','SKU-DEL-U2723',45000.00,2,'4K UHD IPS Black Monitor with USB-C Hub (CRITICAL LOW STOCK)','https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(7,3,'Apple iPhone 15 Pro','SKU-APP-IP15P',129900.00,12,'Titanium design, A17 Pro Chip, 48MP camera, 128GB Storage','https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(8,3,'Samsung Galaxy S24 Ultra','SKU-SAM-S24U',119999.00,10,'Snapdragon 8 Gen 3, 200MP Quad Camera, S-Pen included','https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(9,3,'OnePlus 12 5G','SKU-1PL-12-5G',64999.00,18,'Hasselblad Camera, Snapdragon 8 Gen 3, 100W SuperVOOC','https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(10,3,'Anker 65W GaN Fast Charger','SKU-ANK-65W',2999.00,60,'Ultra-compact 3-port fast wall charger for laptop and mobile','https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(11,3,'Spigen Armor Case for iPhone 15','SKU-SPG-IP15',1499.00,0,'Military-grade drop protection slim case (OUT OF STOCK)','https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(12,4,'Sony WH-1000XM5 Headphones','SKU-SNY-WHXM5',28990.00,14,'Industry-leading Active Noise Cancelling with 8 microphones','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(13,4,'Apple AirPods Pro 2nd Gen','SKU-APP-APP2',22900.00,22,'H2 chip, Adaptive Audio, USB-C MagSafe charging case','https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(14,4,'JBL Flip 6 Bluetooth Speaker','SKU-JBL-FLP6',8999.00,30,'IP67 waterproof and dustproof portable 2-way speaker system','https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(15,4,'Sennheiser HD 560S Audiophile','SKU-SNN-560S',14990.00,4,'Open-back reference headphones for sound reproduction (LOW STOCK)','https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(16,5,'Men Oxford Cotton Casual Shirt','SKU-FSH-OXSH',1999.00,50,'100% Breathable premium combed cotton button-down shirt','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(17,5,'Levi 511 Slim Fit Jeans','SKU-LEV-511J',3499.00,35,'Classic slim silhouette with comfort stretch denim fabric','https://images.unsplash.com/photo-1542272604-780c96856592?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(18,5,'Nike Air Zoom Pegasus 40','SKU-NIK-PEG40',8995.00,16,'Responsive running shoe with engineered mesh upper','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(19,5,'Fossil Gen 6 Hybrid Watch','SKU-FOS-GEN6',15495.00,8,'Classic analog look with smartwatch notifications and battery life','https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(20,6,'Database System Concepts (Korth)','SKU-BOK-KORTH',1199.00,40,'7th Edition - Silberschatz, Korth, Sudarshan. The standard RDBMS book','https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(21,6,'Designing Data-Intensive Apps','SKU-BOK-DDIA',1850.00,25,'Martin Kleppmann. Distributed systems and database internals','https://images.unsplash.com/photo-1532012164546-f432f2e37b73?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(22,6,'Learning SQL (Alan Beaulieu)','SKU-BOK-LSQL',899.00,30,'Master SQL Fundamentals, subqueries, joins and indexes','https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(23,7,'Ergonomic Desk Chair Mesh Back','SKU-HOM-ERGOC',12499.00,12,'High-back ergonomic lumbar support chair with 3D armrests','https://images.unsplash.com/photo-1580481077195-c3a821a5060f?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(24,7,'Philips Hue Smart Light Kit','SKU-HOM-HUEK',7999.00,0,'Starter kit with 3 color ambiance bulbs and wireless bridge (OUT OF STOCK)','https://images.unsplash.com/photo-1550985616-10810253b84d?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30'),(25,7,'Dyson V12 Cordless Vacuum','SKU-DYS-V12C',48900.00,7,'Slim lightweight cordless vacuum cleaner with laser detection','https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500',1,'2026-10-23 14:33:30','2026-10-23 14:33:30');

-- Sample records for `carts`
INSERT INTO `carts` VALUES
(1,1,'2026-10-20 08:30:00','2026-10-23 14:33:30'),(2,2,'2026-10-21 11:15:00','2026-10-23 14:33:30'),(3,3,'2026-10-22 09:40:00','2026-10-23 14:33:30'),(4,4,'2026-10-22 14:00:00','2026-10-23 14:33:30'),(5,5,'2026-10-23 10:20:00','2026-10-23 14:33:30');

-- Sample records for `cart_items`
INSERT INTO `cart_items` VALUES
(1,1,4,1,'2026-10-20 08:35:00'),(2,1,20,2,'2026-10-20 08:36:00'),(3,2,13,1,'2026-10-21 11:20:00'),(4,3,18,1,'2026-10-22 09:45:00'),(5,4,10,2,'2026-10-22 14:05:00'),(6,4,22,1,'2026-10-22 14:10:00'),(7,5,2,1,'2026-10-23 10:25:00');

-- Sample records for `orders`
INSERT INTO `orders` VALUES
(1,1,1,'2026-07-02 10:30:00',134999.00,'DELIVERED','Please deliver to front security desk'),(2,2,3,'2026-07-15 14:20:00',16994.00,'DELIVERED','Deliver between 10am and 4pm'),(3,3,4,'2026-07-28 16:45:00',129900.00,'DELIVERED','Urgent birthday gift for family'),(4,4,5,'2026-08-03 09:15:00',28990.00,'DELIVERED','Call before arrival'),(5,5,6,'2026-08-14 11:50:00',5498.00,'DELIVERED','Leave package at doorstep if not available'),(6,1,2,'2026-08-22 15:30:00',3049.00,'DELIVERED','Academic textbooks for university coursework'),(7,6,7,'2026-08-29 18:10:00',114900.00,'DELIVERED','Handle with care fragile electronics'),(8,7,8,'2026-09-02 12:00:00',8999.00,'DELIVERED','Standard shipment'),(9,8,9,'2026-09-10 13:40:00',64999.00,'DELIVERED','High value gadget delivery'),(10,1,1,'2026-09-18 17:25:00',45000.00,'DELIVERED','Home office monitor setup'),(11,2,3,'2026-09-25 10:10:00',12499.00,'SHIPPED','Ergonomic chair shipment'),(12,3,4,'2026-10-01 14:05:00',22900.00,'SHIPPED','AirPods Pro replacement'),(13,9,10,'2026-10-08 16:30:00',8995.00,'PROCESSING','Sports festival running shoes'),(14,10,1,'2026-10-14 11:20:00',89990.00,'PROCESSING','Engineering lab gaming station'),(15,4,5,'2026-10-18 19:00:00',6499.00,'CANCELLED','Customer requested cancellation'),(16,5,6,'2026-10-22 09:30:00',7995.00,'PENDING','Awaiting payment gateway confirmation'),(17,2,3,'2026-10-23 14:36:13',7995.00,'PROCESSING','Transaction test order - atomic placement'),(18,1,1,'2026-10-23 14:36:13',1199.00,'PROCESSING','Savepoint demonstration order');

-- Sample records for `order_items`
INSERT INTO `order_items` VALUES
(1,1,1,1,134999.00,134999.00),(2,2,4,1,7995.00,7995.00),(3,2,18,1,8999.00,8999.00),(4,3,7,1,129900.00,129900.00),(5,4,12,1,28990.00,28990.00),(6,5,16,1,1999.00,1999.00),(7,5,17,1,3499.00,3499.00),(8,6,20,1,1199.00,1199.00),(9,6,21,1,1850.00,1850.00),(10,7,2,1,114900.00,114900.00),(11,8,14,1,8999.00,8999.00),(12,9,9,1,64999.00,64999.00),(13,10,6,1,45000.00,45000.00),(14,11,23,1,12499.00,12499.00),(15,12,13,1,22900.00,22900.00),(16,13,18,1,8995.00,8995.00),(17,14,3,1,89990.00,89990.00),(18,15,5,1,6499.00,6499.00),(19,16,4,1,7995.00,7995.00),(20,17,4,1,7995.00,7995.00);

-- Sample records for `payments`
INSERT INTO `payments` VALUES
(1,1,'2026-07-02 10:32:00',134999.00,'CREDIT_CARD','COMPLETED','TXN-HDFC-20260702-001'),(2,2,'2026-07-15 14:22:00',16994.00,'UPI','COMPLETED','TXN-UPI-20260715-002'),(3,3,'2026-07-28 16:47:00',129900.00,'NET_BANKING','COMPLETED','TXN-ICICI-20260728-003'),(4,4,'2026-08-03 09:17:00',28990.00,'DEBIT_CARD','COMPLETED','TXN-SBI-20260803-004'),(5,5,'2026-08-14 11:52:00',5498.00,'UPI','COMPLETED','TXN-UPI-20260814-005'),(6,6,'2026-08-22 15:32:00',3049.00,'UPI','COMPLETED','TXN-UPI-20260822-006'),(7,7,'2026-08-29 18:12:00',114900.00,'CREDIT_CARD','COMPLETED','TXN-AXIS-20260829-007'),(8,8,'2026-09-02 12:02:00',8999.00,'CASH_ON_DELIVERY','COMPLETED','TXN-COD-20260902-008'),(9,9,'2026-09-10 13:42:00',64999.00,'UPI','COMPLETED','TXN-UPI-20260910-009'),(10,10,'2026-09-18 17:27:00',45000.00,'CREDIT_CARD','COMPLETED','TXN-HDFC-20260918-010'),(11,11,'2026-09-25 10:12:00',12499.00,'UPI','COMPLETED','TXN-UPI-20260925-011'),(12,12,'2026-10-01 14:07:00',22900.00,'CREDIT_CARD','COMPLETED','TXN-AMEX-20261001-012'),(13,13,'2026-10-08 16:32:00',8995.00,'UPI','COMPLETED','TXN-UPI-20261008-013'),(14,14,'2026-10-14 11:22:00',89990.00,'NET_BANKING','COMPLETED','TXN-KOTAK-20261014-014'),(15,15,'2026-10-18 19:05:00',6499.00,'UPI','REFUNDED','TXN-UPI-20261018-015'),(16,16,'2026-10-22 09:32:00',7995.00,'UPI','PENDING','TXN-UPI-20261022-016'),(17,17,'2026-10-23 14:36:13',7995.00,'UPI','COMPLETED','TXN-DEMO-1792746373');

-- Sample records for `deliveries`
INSERT INTO `deliveries` VALUES
(1,1,'BlueDart Express','BD-IN-78901234','2026-07-03 09:00:00','2026-07-06','2026-07-05 16:30:00','DELIVERED'),(2,2,'Delhivery','DLV-IN-55667788','2026-07-16 11:00:00','2026-07-19','2026-07-18 14:15:00','DELIVERED'),(3,3,'BlueDart Express','BD-IN-99887766','2026-07-29 10:00:00','2026-08-01','2026-07-31 17:45:00','DELIVERED'),(4,4,'DTDC Express','DTDC-KA-112233','2026-08-04 14:00:00','2026-08-07','2026-08-06 12:10:00','DELIVERED'),(5,5,'Delhivery','DLV-TS-44332211','2026-08-15 10:30:00','2026-08-18','2026-08-17 15:20:00','DELIVERED'),(6,6,'BlueDart Express','BD-RJ-66778899','2026-08-23 09:15:00','2026-08-25','2026-08-24 11:00:00','DELIVERED'),(7,7,'FedEx India','FDX-MH-88990011','2026-08-30 11:45:00','2026-09-02','2026-09-01 13:30:00','DELIVERED'),(8,8,'DTDC Express','DTDC-TN-334455','2026-09-03 14:00:00','2026-09-06','2026-09-05 16:00:00','DELIVERED'),(9,9,'BlueDart Express','BD-UP-12345678','2026-09-11 10:00:00','2026-09-14','2026-09-13 14:40:00','DELIVERED'),(10,10,'BlueDart Express','BD-RJ-44556677','2026-09-19 12:00:00','2026-09-22','2026-09-21 18:20:00','DELIVERED'),(11,11,'Delhivery','DLV-UP-99001122','2026-09-26 15:30:00','2026-09-30',NULL,'IN_TRANSIT'),(12,12,'BlueDart Express','BD-MH-33221100','2026-10-02 10:15:00','2026-10-05',NULL,'OUT_FOR_DELIVERY'),(13,13,'Delhivery','DLV-WB-77889900',NULL,'2026-10-12',NULL,'PENDING'),(14,14,'BlueDart Express','BD-RJ-11229988',NULL,'2026-10-17',NULL,'PENDING'),(15,15,'DTDC Express','DTDC-KA-998800',NULL,'2026-10-21',NULL,'FAILED'),(16,16,'Delhivery','DLV-TS-11223344',NULL,'2026-10-26',NULL,'PENDING'),(17,17,'BlueDart Express','BD-DEMO-1792746373',NULL,'2026-10-27',NULL,'PENDING');

-- Sample records for `inventory_logs`
INSERT INTO `inventory_logs` VALUES
(1,1,'RESTOCK',20,0,20,NULL,'2026-06-25 10:00:00'),(2,1,'ORDER_DEDUCT',-1,20,19,1,'2026-07-02 10:30:00'),(3,4,'ORDER_DEDUCT',-1,50,49,2,'2026-07-15 14:20:00'),(4,18,'ORDER_DEDUCT',-1,20,19,2,'2026-07-15 14:20:00'),(5,7,'ORDER_DEDUCT',-1,15,14,3,'2026-07-28 16:45:00'),(6,6,'ORDER_DEDUCT',-1,3,2,10,'2026-09-18 17:25:00'),(7,5,'ORDER_CANCEL_RETURN',1,2,3,15,'2026-10-18 19:10:00'),(8,4,'ORDER_DEDUCT',-1,45,44,17,'2026-10-23 14:36:13');

-- ============================================================================
-- 3. ANALYTICAL REPORTING VIEWS (DQL DEMONSTRATIONS)
-- ============================================================================

-- View 1: Order Summary with 5-Table Join
CREATE OR REPLACE VIEW `vw_order_summary` AS 
SELECT 
    o.order_id,
    o.order_date,
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    CONCAT(a.street_address, ', ', a.city, ', ', a.state, ' - ', a.postal_code) AS shipping_address,
    o.total_amount,
    o.order_status,
    COUNT(oi.order_item_id) AS total_distinct_items,
    COALESCE(SUM(oi.quantity), 0) AS total_items_quantity,
    pay.payment_method,
    pay.payment_status,
    pay.transaction_reference,
    d.carrier_name,
    d.tracking_number,
    d.delivery_status,
    d.estimated_delivery_date
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN addresses a ON o.shipping_address_id = a.address_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN payments pay ON o.order_id = pay.order_id
LEFT JOIN deliveries d ON o.order_id = d.order_id
GROUP BY 
    o.order_id, o.order_date, c.customer_id, c.first_name, c.last_name, 
    c.email, c.phone, a.street_address, a.city, a.state, a.postal_code, 
    o.total_amount, o.order_status, pay.payment_method, pay.payment_status, 
    pay.transaction_reference, d.carrier_name, d.tracking_number, 
    d.delivery_status, d.estimated_delivery_date;

-- View 2: Category Sales Performance (Aggregations and Joins)
CREATE OR REPLACE VIEW `vw_category_sales` AS 
SELECT 
    c.category_id,
    c.category_name,
    COUNT(DISTINCT p.product_id) AS total_catalog_products,
    COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
    COALESCE(SUM(oi.subtotal), 0.00) AS total_revenue_generated
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status <> 'CANCELLED'
GROUP BY c.category_id, c.category_name;

-- View 3: Customer Spending Analysis & Loyalty Tier
CREATE OR REPLACE VIEW `vw_customer_spending` AS 
SELECT 
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email,
    c.phone,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(CASE WHEN o.order_status <> 'CANCELLED' THEN o.total_amount ELSE 0 END), 0.00) AS total_spent,
    COALESCE(ROUND(AVG(CASE WHEN o.order_status <> 'CANCELLED' THEN o.total_amount ELSE NULL END), 2), 0.00) AS average_order_value,
    MAX(o.order_date) AS most_recent_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.phone;

-- View 4: Low Stock Alert & Reorder Urgency Monitor
CREATE OR REPLACE VIEW `vw_low_stock_products` AS 
SELECT 
    p.product_id,
    p.product_name,
    p.sku,
    c.category_name,
    p.price,
    p.stock_quantity,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'OUT OF STOCK - URGENT RESTOCK'
        WHEN p.stock_quantity <= 2 THEN 'CRITICAL DEPLETION'
        ELSE 'LOW STOCK'
    END AS urgency_level,
    (20 - p.stock_quantity) AS recommended_reorder_quantity
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.stock_quantity <= 5 AND p.is_active = 1;

-- View 5: Monthly Revenue Breakdown
CREATE OR REPLACE VIEW `vw_monthly_revenue` AS 
SELECT 
    DATE_FORMAT(o.order_date, '%Y-%m') AS order_month,
    COUNT(o.order_id) AS total_orders,
    SUM(CASE WHEN o.order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
    SUM(CASE WHEN o.order_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
    SUM(CASE WHEN o.order_status <> 'CANCELLED' THEN o.total_amount ELSE 0 END) AS gross_revenue,
    SUM(CASE WHEN pay.payment_status = 'COMPLETED' THEN pay.amount ELSE 0 END) AS settled_revenue
FROM orders o
LEFT JOIN payments pay ON o.order_id = pay.order_id
GROUP BY DATE_FORMAT(o.order_date, '%Y-%m');
