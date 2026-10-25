# Database Normalization Analysis

**Course:** Relational Database Management Systems Laboratory  
**Institution:** Manipal University Jaipur  
**Subject:** Formal Schema Normalization from UNF to 3NF  
**Project:** E-Commerce Management System (`ecommerce_db`)

---

## 1. Objective of Normalization

Normalization organizes relational schema data to:
1. **Eliminate Data Redundancy:** Avoid repeating customer addresses, category names, or product details across multiple transactions.
2. **Prevent Modification Anomalies:**
   - **Insertion Anomaly:** Being unable to add a new product without an active customer purchase.
   - **Deletion Anomaly:** Deleting a customer deleting all historical product pricing records.
   - **Update Anomaly:** Modifying a customer's phone number requiring edits across dozens of historical order records.

---

## 2. Unnormalized Form (UNF)

Consider an unnormalized, flat spreadsheet representation:
```text
OrderRecord = (
    order_id, 
    customer_name, 
    customer_email, 
    customer_phone, 
    shipping_street, 
    shipping_city, 
    shipping_state,
    order_date, 
    [product_id, product_name, category_name, unit_price, quantity, subtotal]*,
    total_amount, 
    payment_method, 
    payment_status, 
    carrier_name, 
    tracking_number, 
    delivery_status
)
```
*Note: The asterisk indicates a repeating group of product items.*

---

## 3. First Normal Form (1NF)

### Requirement:
- Each column must contain atomic (indivisible) values.
- There must be no repeating groups or multi-valued attributes.
- Each table must have a primary key.

### Decomposition into 1NF:
1. Extract repeating line-item groups into a separate relation: `ORDER_ITEMS`.
2. Composite Primary Key for `ORDER_ITEMS`: `(order_id, product_id)`.
3. Separate full names into atomic components: `first_name`, `last_name`.
4. Separate addresses into atomic components: `street_address`, `city`, `state`, `postal_code`, `country`.

```text
ORDERS_1NF(order_id, customer_id, first_name, last_name, email, phone, street_address, city, state, postal_code, order_date, total_amount, payment_method, carrier_name, tracking_number)

ORDER_ITEMS_1NF(order_id, product_id, product_name, category_name, unit_price, quantity, subtotal)
```

---

## 4. Second Normal Form (2NF)

### Requirement:
- The schema must be in 1NF.
- No non-prime attribute may be partially functionally dependent on any candidate key (Removal of Partial Dependencies).

### Identifying Partial Dependencies in `ORDER_ITEMS_1NF`:
- In `ORDER_ITEMS_1NF`, candidate key is `(order_id, product_id)`.
- Functional Dependencies:
  - `{order_id, product_id} -> quantity, unit_price, subtotal` (Full dependency)
  - `product_id -> product_name, category_name` (Partial dependency on a subset of the candidate key!)

### 2NF Resolution:
Extract `PRODUCTS` into an independent relation:
```text
PRODUCTS(product_id, product_name, category_name, price, stock_quantity)
ORDER_ITEMS(order_item_id, order_id, product_id, quantity, unit_price, subtotal)
```
Now every non-prime attribute in `ORDER_ITEMS` depends on the whole key.

---

## 5. Third Normal Form (3NF)

### Requirement:
- The schema must be in 2NF.
- No non-prime attribute may be transitively dependent on the primary key (Removal of Transitive Dependencies: $X \to Y$ and $Y \to Z$ where $Z$ is not a candidate key).

### Identifying Transitive Dependencies:
1. In `ORDERS`:
   - `order_id -> customer_id`
   - `customer_id -> first_name, last_name, email, phone`
   - Therefore: `order_id -> email` is transitive through `customer_id`.
2. In `ORDERS`:
   - `order_id -> shipping_address`
   - Multiple orders from the same customer redundantly duplicate address strings.
3. In `PRODUCTS`:
   - `product_id -> category_id`
   - `category_id -> category_name, description`
   - Therefore: `product_id -> category_name` is transitive through `category_id`.
4. In `ORDERS`:
   - `order_id -> payment_id -> payment_method, transaction_reference`
   - `order_id -> delivery_id -> carrier_name, tracking_number`

### 3NF Decomposition Result (Current Implemented Schema):
1. `CUSTOMERS`: Key `customer_id`. Stores only user demographic profile.
2. `ADDRESSES`: Key `address_id`, Foreign Key `customer_id`.
3. `CATEGORIES`: Key `category_id`. Stores classification names once.
4. `PRODUCTS`: Key `product_id`, Foreign Key `category_id`.
5. `ORDERS`: Key `order_id`, Foreign Keys `customer_id`, `shipping_address_id`.
6. `ORDER_ITEMS`: Key `order_item_id`, Foreign Keys `order_id`, `product_id`.
7. `PAYMENTS`: Key `payment_id`, Foreign Key `order_id`.
8. `DELIVERIES`: Key `delivery_id`, Foreign Key `order_id`.

---

## 6. Functional Dependency Proofs

| Relation | Primary Key | Functional Dependencies | Normal Form Verified |
| :--- | :--- | :--- | :--- |
| `customers` | `customer_id` | `customer_id` &rarr; `first_name, last_name, email, phone` | **3NF** |
| `products` | `product_id` | `product_id` &rarr; `category_id, product_name, sku, price, stock` | **3NF** |
| `categories`| `category_id` | `category_id` &rarr; `category_name, description, parent_id` | **3NF** |
| `orders` | `order_id` | `order_id` &rarr; `customer_id, shipping_address_id, total_amount, order_status` | **3NF** |
| `order_items`| `order_item_id` | `order_item_id` &rarr; `order_id, product_id, quantity, unit_price, subtotal` | **3NF** |
| `payments` | `payment_id` | `payment_id` &rarr; `order_id, amount, payment_method, transaction_reference` | **3NF** |
| `deliveries`| `delivery_id` | `delivery_id` &rarr; `order_id, carrier_name, tracking_number, delivery_status` | **3NF** |

**Conclusion:** The database architecture eliminates all partial and transitive functional dependencies, achieving strict **Third Normal Form (3NF)** compliance.
