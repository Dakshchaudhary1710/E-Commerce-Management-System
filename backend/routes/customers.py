import hashlib
from flask import Blueprint, request, jsonify
from db import execute_query, get_db_connection
from mysql.connector import Error

customers_bp = Blueprint("customers", __name__)

def hash_password(pwd):
    if not pwd:
        pwd = "DefaultCustomerPass123"
    salt = "muj_rdbms_salt"
    return f"sha256${hashlib.sha256((pwd + salt).encode('utf-8')).hexdigest()}"

@customers_bp.route("/customers", methods=["GET"])
def get_customers():
    search = request.args.get("q", "").strip()
    try:
        if search:
            query = """
                SELECT 
                    c.customer_id,
                    CONCAT(c.first_name, ' ', c.last_name) AS full_name,
                    c.first_name,
                    c.last_name,
                    c.email,
                    c.phone,
                    c.is_active,
                    c.created_at,
                    COUNT(DISTINCT o.order_id) AS total_orders,
                    COALESCE(SUM(CASE WHEN o.order_status <> 'CANCELLED' THEN o.total_amount ELSE 0 END), 0.00) AS total_spent
                FROM customers c
                LEFT JOIN orders o ON c.customer_id = o.customer_id
                WHERE c.first_name LIKE %s OR c.last_name LIKE %s OR c.email LIKE %s OR c.phone LIKE %s
                GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.phone, c.is_active, c.created_at
                ORDER BY c.customer_id ASC;
            """
            like_term = f"%{search}%"
            customers = execute_query(query, (like_term, like_term, like_term, like_term), fetch_all=True)
        else:
            query = """
                SELECT 
                    c.customer_id,
                    CONCAT(c.first_name, ' ', c.last_name) AS full_name,
                    c.first_name,
                    c.last_name,
                    c.email,
                    c.phone,
                    c.is_active,
                    c.created_at,
                    COUNT(DISTINCT o.order_id) AS total_orders,
                    COALESCE(SUM(CASE WHEN o.order_status <> 'CANCELLED' THEN o.total_amount ELSE 0 END), 0.00) AS total_spent
                FROM customers c
                LEFT JOIN orders o ON c.customer_id = o.customer_id
                GROUP BY c.customer_id, c.first_name, c.last_name, c.email, c.phone, c.is_active, c.created_at
                ORDER BY c.customer_id ASC;
            """
            customers = execute_query(query, fetch_all=True)
        return jsonify(customers), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@customers_bp.route("/customers/<int:customer_id>", methods=["GET"])
def get_customer(customer_id):
    try:
        customer = execute_query("""
            SELECT 
                c.customer_id,
                CONCAT(c.first_name, ' ', c.last_name) AS full_name,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.is_active,
                c.created_at,
                c.updated_at
            FROM customers c
            WHERE c.customer_id = %s;
        """, (customer_id,), fetch_one=True)

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        addresses = execute_query("""
            SELECT address_id, street_address, city, state, postal_code, country, is_default 
            FROM addresses 
            WHERE customer_id = %s;
        """, (customer_id,), fetch_all=True)

        summary = execute_query("""
            SELECT 
                COUNT(order_id) AS total_orders,
                COALESCE(SUM(CASE WHEN order_status <> 'CANCELLED' THEN total_amount ELSE 0 END), 0.00) AS total_spent,
                COALESCE(ROUND(AVG(CASE WHEN order_status <> 'CANCELLED' THEN total_amount ELSE NULL END), 2), 0.00) AS avg_order_value
            FROM orders
            WHERE customer_id = %s;
        """, (customer_id,), fetch_one=True)

        customer["addresses"] = addresses
        customer["order_summary"] = summary
        return jsonify(customer), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@customers_bp.route("/customers", methods=["POST"])
def create_customer():
    data = request.get_json() or {}
    
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    full_name = data.get("full_name", "").strip()

    if not first_name and full_name:
        parts = full_name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    password = data.get("password", "")

    if not first_name or not email or not phone:
        return jsonify({"error": "First name, valid email, and phone are required"}), 400

    if "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email address format"}), 400

    pwd_hash = hash_password(password)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO customers (first_name, last_name, email, phone, password_hash)
            VALUES (%s, %s, %s, %s, %s);
        """, (first_name, last_name, email, phone, pwd_hash))
        new_id = cursor.lastrowid

        # If initial address provided
        street = data.get("street_address")
        city = data.get("city")
        state = data.get("state")
        postal_code = data.get("postal_code")
        if street and city and postal_code:
            cursor.execute("""
                INSERT INTO addresses (customer_id, street_address, city, state, postal_code, country, is_default)
                VALUES (%s, %s, %s, %s, %s, 'India', 1);
            """, (new_id, street, city, state or "Rajasthan", postal_code))

        conn.commit()
        return jsonify({
            "message": "Customer created successfully",
            "customer_id": new_id
        }), 201
    except Error as e:
        conn.rollback()
        if e.errno == 1062:
            return jsonify({"error": "Email or phone number already registered"}), 409
        return jsonify({"error": f"Database error: {str(e)}"}), 400
    finally:
        cursor.close()
        conn.close()

@customers_bp.route("/customers/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):
    data = request.get_json() or {}
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()

    if not first_name or not email or not phone:
        return jsonify({"error": "First name, email, and phone are required"}), 400

    try:
        res = execute_query("""
            UPDATE customers
            SET first_name = %s, last_name = %s, email = %s, phone = %s
            WHERE customer_id = %s;
        """, (first_name, last_name, email, phone, customer_id), commit=True)

        if res["row_count"] == 0:
            # Check if customer exists
            cust = execute_query("SELECT customer_id FROM customers WHERE customer_id = %s;", (customer_id,), fetch_one=True)
            if not cust:
                return jsonify({"error": "Customer not found"}), 404

        return jsonify({"message": "Customer updated successfully"}), 200
    except Error as e:
        if e.errno == 1062:
            return jsonify({"error": "Email or phone already in use by another customer"}), 409
        return jsonify({"error": str(e)}), 400

@customers_bp.route("/customers/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    """
    Safely delete customer verifying referential integrity.
    If the customer has historical orders, prevent deletion to maintain audit consistency.
    """
    try:
        # Check active or past orders
        orders = execute_query("SELECT COUNT(*) AS cnt FROM orders WHERE customer_id = %s;", (customer_id,), fetch_one=True)
        if orders and orders["cnt"] > 0:
            return jsonify({
                "error": f"Referential Integrity Protected: Cannot delete customer #{customer_id} because they have {orders['cnt']} associated order(s). Consider deactivating instead."
            }), 409

        res = execute_query("DELETE FROM customers WHERE customer_id = %s;", (customer_id,), commit=True)
        if res["row_count"] == 0:
            return jsonify({"error": "Customer not found"}), 404

        return jsonify({"message": f"Customer #{customer_id} deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": f"Database integrity violation: {str(e)}"}), 400

@customers_bp.route("/customers/<int:customer_id>/orders", methods=["GET"])
def get_customer_orders(customer_id):
    try:
        orders = execute_query("""
            SELECT 
                o.order_id,
                o.order_date,
                o.total_amount,
                o.order_status,
                d.tracking_number,
                d.delivery_status,
                pay.payment_method,
                pay.payment_status,
                COUNT(oi.order_item_id) AS distinct_items
            FROM orders o
            LEFT JOIN deliveries d ON o.order_id = d.order_id
            LEFT JOIN payments pay ON o.order_id = pay.order_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.customer_id = %s
            GROUP BY o.order_id, o.order_date, o.total_amount, o.order_status, 
                     d.tracking_number, d.delivery_status, pay.payment_method, pay.payment_status
            ORDER BY o.order_date DESC;
        """, (customer_id,), fetch_all=True)
        return jsonify(orders), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
