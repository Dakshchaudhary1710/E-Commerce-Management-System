import datetime
import random
import string
from flask import Blueprint, request, jsonify
from db import get_db_connection, execute_query
from mysql.connector import Error

orders_bp = Blueprint("orders", __name__)

def generate_tracking_number(order_id):
    rand_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"BD-MUJ-{order_id:04d}-{rand_chars}"

def generate_txn_reference(order_id):
    rand_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"TXN-MUJ-{order_id:04d}-{rand_chars}"

@orders_bp.route("/orders", methods=["GET"])
def get_orders():
    status = request.args.get("status")
    search = request.args.get("q", "").strip()

    conditions = ["1=1"]
    params = []

    if status:
        conditions.append("o.order_status = %s")
        params.append(status)

    if search:
        conditions.append("(o.order_id = %s OR c.first_name LIKE %s OR c.last_name LIKE %s OR c.email LIKE %s OR d.tracking_number LIKE %s)")
        search_id = int(search) if search.isdigit() else -1
        like_search = f"%{search}%"
        params.extend([search_id, like_search, like_search, like_search, like_search])

    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT 
            o.order_id,
            o.order_date,
            o.customer_id,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            o.total_amount,
            o.order_status,
            COUNT(oi.order_item_id) AS items_count,
            COALESCE(SUM(oi.quantity), 0) AS total_units,
            pay.payment_id,
            pay.payment_method,
            pay.payment_status,
            d.delivery_id,
            d.carrier_name,
            d.tracking_number,
            d.delivery_status
        FROM orders o
        JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN payments pay ON o.order_id = pay.order_id
        LEFT JOIN deliveries d ON o.order_id = d.order_id
        WHERE {where_clause}
        GROUP BY o.order_id, o.order_date, o.customer_id, c.first_name, c.last_name, 
                 c.email, c.phone, o.total_amount, o.order_status, 
                 pay.payment_id, pay.payment_method, pay.payment_status,
                 d.delivery_id, d.carrier_name, d.tracking_number, d.delivery_status
        ORDER BY o.order_date DESC;
    """

    try:
        orders = execute_query(query, tuple(params), fetch_all=True)
        return jsonify(orders), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders/<int:order_id>", methods=["GET"])
def get_order(order_id):
    try:
        order = execute_query("""
            SELECT 
                o.order_id,
                o.order_date,
                o.customer_id,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone,
                o.shipping_address_id,
                CONCAT(a.street_address, ', ', a.city, ', ', a.state, ' - ', a.postal_code, ', ', a.country) AS formatted_shipping_address,
                o.total_amount,
                o.order_status,
                o.notes
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN addresses a ON o.shipping_address_id = a.address_id
            WHERE o.order_id = %s;
        """, (order_id,), fetch_one=True)

        if not order:
            return jsonify({"error": "Order not found"}), 404

        items = execute_query("""
            SELECT 
                oi.order_item_id,
                oi.product_id,
                p.product_name,
                p.sku,
                p.image_url,
                c.category_name,
                oi.quantity,
                oi.unit_price,
                oi.subtotal
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            WHERE oi.order_id = %s
            ORDER BY oi.order_item_id ASC;
        """, (order_id,), fetch_all=True)

        payment = execute_query("""
            SELECT payment_id, amount, payment_method, payment_status, transaction_reference, payment_date
            FROM payments
            WHERE order_id = %s;
        """, (order_id,), fetch_one=True)

        delivery = execute_query("""
            SELECT delivery_id, carrier_name, tracking_number, dispatch_date, estimated_delivery_date, actual_delivery_date, delivery_status
            FROM deliveries
            WHERE order_id = %s;
        """, (order_id,), fetch_one=True)

        order["items"] = items
        order["payment"] = payment
        order["delivery"] = delivery

        return jsonify(order), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@orders_bp.route("/orders", methods=["POST"])
def create_order():
    """
    Academic RDBMS Order Placement Workflow with strict ACID Transaction:
    1. Validate customer and requested products
    2. Lock stock rows safely with SELECT ... FOR UPDATE
    3. Check stock availability against requested quantities
    4. Calculate precise monetary values using MySQL decimals
    5. Insert master Order record
    6. Insert Order_Items records
    7. Atomically reduce product stock
    8. Record audit trail in inventory_logs
    9. Initialize linked Payment and Delivery records
    10. Commit transaction (or Rollback on any failure)
    """
    data = request.get_json() or {}
    customer_id = data.get("customer_id")
    shipping_address_id = data.get("shipping_address_id")
    items = data.get("items", [])
    payment_method = data.get("payment_method", "UPI")
    notes = data.get("notes", "Order placed via Web Dashboard")

    if not customer_id or not items:
        return jsonify({"error": "Customer ID and at least one order item are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Step 1: Validate Customer
        cursor.execute("SELECT customer_id FROM customers WHERE customer_id = %s AND is_active = 1;", (customer_id,))
        cust = cursor.fetchone()
        if not cust:
            conn.rollback()
            return jsonify({"error": f"Customer #{customer_id} does not exist or is inactive"}), 404

        # Address handling
        if not shipping_address_id:
            cursor.execute("SELECT address_id FROM addresses WHERE customer_id = %s ORDER BY is_default DESC LIMIT 1;", (customer_id,))
            addr = cursor.fetchone()
            if addr:
                shipping_address_id = addr["address_id"]
            else:
                # Create a default address
                cursor.execute("""
                    INSERT INTO addresses (customer_id, street_address, city, state, postal_code, is_default)
                    VALUES (%s, 'Academic Campus, MUJ Road', 'Jaipur', 'Rajasthan', '303007', 1);
                """, (customer_id,))
                shipping_address_id = cursor.lastrowid

        calculated_total = 0.0
        validated_items = []

        # Step 2 & 3: Lock rows and validate inventory
        for it in items:
            p_id = it.get("product_id")
            qty = int(it.get("quantity", 1))

            if qty <= 0:
                conn.rollback()
                return jsonify({"error": f"Invalid quantity {qty} requested for product #{p_id}"}), 400

            cursor.execute("""
                SELECT product_id, product_name, price, stock_quantity 
                FROM products 
                WHERE product_id = %s AND is_active = 1 
                FOR UPDATE;
            """, (p_id,))
            prod = cursor.fetchone()

            if not prod:
                conn.rollback()
                return jsonify({"error": f"Product #{p_id} not found or inactive"}), 404

            if prod["stock_quantity"] < qty:
                conn.rollback()
                return jsonify({
                    "error": f"Insufficient stock for '{prod['product_name']}'. Requested: {qty}, Available: {prod['stock_quantity']}"
                }), 400

            unit_price = float(prod["price"])
            subtotal = round(unit_price * qty, 2)
            calculated_total += subtotal

            validated_items.append({
                "product_id": p_id,
                "product_name": prod["product_name"],
                "quantity": qty,
                "unit_price": unit_price,
                "subtotal": subtotal,
                "previous_stock": prod["stock_quantity"]
            })

        calculated_total = round(calculated_total, 2)

        # Step 4: Insert Order Master
        cursor.execute("""
            INSERT INTO orders (customer_id, shipping_address_id, total_amount, order_status, notes)
            VALUES (%s, %s, %s, 'PENDING', %s);
        """, (customer_id, shipping_address_id, calculated_total, notes))
        new_order_id = cursor.lastrowid

        # Step 5 & 6: Insert Order Items and Update Inventory
        for v in validated_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                VALUES (%s, %s, %s, %s, %s);
            """, (new_order_id, v["product_id"], v["quantity"], v["unit_price"], v["subtotal"]))

            # Decrement stock
            cursor.execute("""
                UPDATE products 
                SET stock_quantity = stock_quantity - %s 
                WHERE product_id = %s;
            """, (v["quantity"], v["product_id"]))

            # Audit in inventory_logs
            new_stock = v["previous_stock"] - v["quantity"]
            cursor.execute("""
                INSERT INTO inventory_logs (product_id, change_type, quantity_changed, previous_stock, new_stock, reference_order_id)
                VALUES (%s, 'ORDER_DEDUCT', %s, %s, %s, %s);
            """, (v["product_id"], -v["quantity"], v["previous_stock"], new_stock, new_order_id))

        # Step 7: Create Linked Simulated Payment Record
        txn_ref = generate_txn_reference(new_order_id)
        cursor.execute("""
            INSERT INTO payments (order_id, amount, payment_method, payment_status, transaction_reference)
            VALUES (%s, %s, %s, 'COMPLETED', %s);
        """, (new_order_id, calculated_total, payment_method, txn_ref))

        # Step 8: Create Linked Delivery Record
        trk_num = generate_tracking_number(new_order_id)
        est_delivery = datetime.date.today() + datetime.timedelta(days=4)
        cursor.execute("""
            INSERT INTO deliveries (order_id, carrier_name, tracking_number, estimated_delivery_date, delivery_status)
            VALUES (%s, 'BlueDart Express', %s, %s, 'PENDING');
        """, (new_order_id, trk_num, est_delivery))

        # Step 9: Commit Transaction atomically!
        conn.commit()

        return jsonify({
            "message": "Order processed and committed successfully",
            "order_id": new_order_id,
            "total_amount": calculated_total,
            "transaction_reference": txn_ref,
            "tracking_number": trk_num
        }), 201

    except Error as e:
        conn.rollback()
        return jsonify({"error": f"Order transaction rolled back due to error: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@orders_bp.route("/orders/<int:order_id>/status", methods=["PUT"])
def update_order_status(order_id):
    data = request.get_json() or {}
    new_status = data.get("order_status", "").upper().strip()

    valid_statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Get current order status
        cursor.execute("SELECT order_status FROM orders WHERE order_id = %s FOR UPDATE;", (order_id,))
        curr = cursor.fetchone()
        if not curr:
            conn.rollback()
            return jsonify({"error": "Order not found"}), 404

        old_status = curr["order_status"]
        if old_status == new_status:
            conn.rollback()
            return jsonify({"message": f"Order #{order_id} is already in {new_status} status"}), 200

        # Update order status
        cursor.execute("UPDATE orders SET order_status = %s WHERE order_id = %s;", (new_status, order_id))

        # Synchronize delivery status where appropriate
        if new_status == 'SHIPPED':
            cursor.execute("""
                UPDATE deliveries 
                SET delivery_status = 'IN_TRANSIT', dispatch_date = COALESCE(dispatch_date, NOW()) 
                WHERE order_id = %s;
            """, (order_id,))
        elif new_status == 'DELIVERED':
            cursor.execute("""
                UPDATE deliveries 
                SET delivery_status = 'DELIVERED', actual_delivery_date = COALESCE(actual_delivery_date, NOW()) 
                WHERE order_id = %s;
            """, (order_id,))
        elif new_status == 'CANCELLED' and old_status != 'CANCELLED':
            # Restock items if order cancelled
            cursor.execute("SELECT product_id, quantity FROM order_items WHERE order_id = %s;", (order_id,))
            items = cursor.fetchall()
            for it in items:
                cursor.execute("""
                    UPDATE products 
                    SET stock_quantity = stock_quantity + %s 
                    WHERE product_id = %s;
                """, (it["quantity"], it["product_id"]))

        conn.commit()
        return jsonify({"message": f"Order #{order_id} updated to {new_status}"}), 200
    except Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
