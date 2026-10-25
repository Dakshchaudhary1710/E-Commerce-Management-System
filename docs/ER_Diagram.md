# Entity-Relationship (ER) Diagram

**Institution:** Manipal University Jaipur  
**Course:** Relational Database Management Systems Laboratory  
**Project:** E-Commerce Management System  
**Database:** `ecommerce_db`

---

## 1. Conceptual & Logical ER Model

The relational architecture models the retail lifecycle from customer registration, multi-address management, hierarchical catalog categorization, cart persistence, transaction-safe order placement, line-item decomposition, payment auditing, and multi-carrier fulfillment tracking.

```mermaid
erDiagram
    CUSTOMERS ||--o{ ADDRESSES : "has multiple (1:N)"
    CUSTOMERS ||--o| CARTS : "owns (1:1)"
    CUSTOMERS ||--o{ ORDERS : "places (1:N)"
    
    CATEGORIES ||--o{ CATEGORIES : "sub-categorizes (1:N)"
    CATEGORIES ||--o{ PRODUCTS : "groups (1:N)"
    
    CARTS ||--o{ CART_ITEMS : "contains (1:N)"
    PRODUCTS ||--o{ CART_ITEMS : "added as (1:N)"
    
    ORDERS ||--|{ ORDER_ITEMS : "composed of (1:N)"
    PRODUCTS ||--o{ ORDER_ITEMS : "ordered in (1:N)"
    
    ADDRESSES ||--o{ ORDERS : "shipped to (1:N)"
    
    ORDERS ||--|| PAYMENTS : "settled by (1:1)"
    ORDERS ||--|| DELIVERIES : "fulfilled by (1:1)"
    
    PRODUCTS ||--o{ INVENTORY_LOGS : "audits (1:N)"
    ORDERS ||--o{ INVENTORY_LOGS : "referenced in (1:N)"

    CUSTOMERS {
        int customer_id PK
        string first_name
        string last_name
        string email UK
        string phone UK
        string password_hash
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    ADDRESSES {
        int address_id PK
        int customer_id FK
        string street_address
        string city
        string state
        string postal_code
        string country
        boolean is_default
        datetime created_at
    }

    CATEGORIES {
        int category_id PK
        string category_name UK
        string description
        int parent_id FK
        datetime created_at
    }

    PRODUCTS {
        int product_id PK
        int category_id FK
        string product_name
        string sku UK
        decimal price
        int stock_quantity
        string description
        string image_url
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    CARTS {
        int cart_id PK
        int customer_id FK,UK
        datetime created_at
        datetime updated_at
    }

    CART_ITEMS {
        int cart_item_id PK
        int cart_id FK
        int product_id FK
        int quantity
        datetime added_at
    }

    ORDERS {
        int order_id PK
        int customer_id FK
        int shipping_address_id FK
        datetime order_date
        decimal total_amount
        string order_status
        text notes
    }

    ORDER_ITEMS {
        int order_item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }

    PAYMENTS {
        int payment_id PK
        int order_id FK,UK
        datetime payment_date
        decimal amount
        string payment_method
        string payment_status
        string transaction_reference UK
    }

    DELIVERIES {
        int delivery_id PK
        int order_id FK,UK
        string carrier_name
        string tracking_number UK
        datetime dispatch_date
        date estimated_delivery_date
        datetime actual_delivery_date
        string delivery_status
    }

    INVENTORY_LOGS {
        int log_id PK
        int product_id FK
        string change_type
        int quantity_changed
        int previous_stock
        int new_stock
        int reference_order_id FK
        datetime log_timestamp
    }
```

---

## 2. Cardinality and Multiplicity Analysis

1. **Customers to Addresses (1 : N):**
   - A customer may maintain zero, one, or multiple delivery addresses (home, office, campus hostel).
   - Each address is associated with exactly one customer.

2. **Categories to Products (1 : N):**
   - Each category contains zero or many catalog products.
   - Each product belongs to exactly one category (foreign key: `category_id`).

3. **Orders to Order_Items to Products (M : N Decomposition):**
   - Many-to-many relationship between `Orders` and `Products` is resolved by the associative entity `Order_Items`.
   - `Order_Items` stores the historical locked price (`unit_price`) at the moment of order placement.

4. **Orders to Payments (1 : 1):**
   - In this implementation, each completed transaction links to a single master payment record via a unique foreign key constraint `payments.order_id`.

5. **Orders to Deliveries (1 : 1):**
   - Each order is assigned to a single shipment tracking record (`deliveries.order_id` is UNIQUE).

6. **Customers to Carts (1 : 1):**
   - Each customer has at most one active cart, holding zero or more `Cart_Items`.
