import datetime
import random
import string
from flask import Blueprint, request, jsonify
from db import execute_query, get_db_connection
from mysql.connector import Error

deliveries_bp = Blueprint("deliveries", __name__)

@deliveries_bp.route("/deliveries", methods=["GET"])
def get_deliveries():
    status = request.args.get("status")
    search = request.args.get("q", "").strip()

    conditions = ["1=1"]
    params = []

    if status:
        conditions.append("d.delivery_status = %s")
        params.append(status)

    if search:
        conditions.append("(d.delivery_id = %s OR d.order_id = %s OR d.tracking_number LIKE %s OR d.carrier_name LIKE %s OR c.first_name LIKE %s OR c.last_name LIKE %s)")
        num_val = int(search) if search.isdigit() else -1
        like_term = f"%{search}%"
        params.extend([num_val, num_val, like_term, like_term, like_term, like_term])

    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT 
            d.delivery_id,
            d.order_id,
            d.carrier_name,
            d.carrier_name AS courier_name,
            d.tracking_number,
            d.dispatch_date,
            d.estimated_delivery_date,
            d.actual_delivery_date,
            d.delivery_status,
            o.order_date,
            o.order_status,
            o.total_amount,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            CONCAT(a.street_address, ', ', a.city, ', ', a.state, ' - ', a.postal_code) AS delivery_address
        FROM deliveries d
        JOIN orders o ON d.order_id = o.order_id
        JOIN customers c ON o.customer_id = c.customer_id
        JOIN addresses a ON o.shipping_address_id = a.address_id
        WHERE {where_clause}
        ORDER BY d.delivery_id DESC;
    """

    try:
        deliveries = execute_query(query, tuple(params), fetch_all=True)
        return jsonify(deliveries), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@deliveries_bp.route("/deliveries/<int:delivery_id>", methods=["GET"])
def get_delivery(delivery_id):
    try:
        delivery = execute_query("""
            SELECT 
                d.delivery_id,
                d.order_id,
                d.carrier_name,
                d.carrier_name AS courier_name,
                d.tracking_number,
                d.dispatch_date,
                d.estimated_delivery_date,
                d.actual_delivery_date,
                d.delivery_status,
                o.order_date,
                o.order_status,
                o.total_amount,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone,
                CONCAT(a.street_address, ', ', a.city, ', ', a.state, ' - ', a.postal_code) AS delivery_address
            FROM deliveries d
            JOIN orders o ON d.order_id = o.order_id
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN addresses a ON o.shipping_address_id = a.address_id
            WHERE d.delivery_id = %s;
        """, (delivery_id,), fetch_one=True)

        if not delivery:
            return jsonify({"error": "Delivery record not found"}), 404

        items = execute_query("""
            SELECT oi.quantity, p.product_name, p.sku, oi.unit_price, oi.subtotal
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = %s;
        """, (delivery["order_id"],), fetch_all=True)

        delivery["order_items"] = items
        return jsonify(delivery), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@deliveries_bp.route("/deliveries", methods=["POST"])
def create_delivery():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    carrier_name = data.get("courier_name") or data.get("carrier_name") or "BlueDart Express"
    tracking_number = data.get("tracking_number")
    est_date = data.get("estimated_delivery_date")
    status = data.get("delivery_status", "PENDING")

    if not order_id:
        return jsonify({"error": "order_id is required"}), 400

    if not tracking_number:
        rand_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        tracking_number = f"TRK-{order_id}-{rand_str}"

    if not est_date:
        est_date = (datetime.date.today() + datetime.timedelta(days=4)).isoformat()

    try:
        res = execute_query("""
            INSERT INTO deliveries (order_id, carrier_name, tracking_number, estimated_delivery_date, delivery_status)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                carrier_name = VALUES(carrier_name),
                tracking_number = VALUES(tracking_number),
                estimated_delivery_date = VALUES(estimated_delivery_date),
                delivery_status = VALUES(delivery_status);
        """, (order_id, carrier_name, tracking_number, est_date, status), commit=True)

        return jsonify({
            "message": "Delivery record initialized successfully",
            "tracking_number": tracking_number,
            "order_id": order_id
        }), 201
    except Error as e:
        return jsonify({"error": str(e)}), 400

@deliveries_bp.route("/deliveries/<int:delivery_id>", methods=["PUT"])
def update_delivery(delivery_id):
    data = request.get_json() or {}
    carrier_name = data.get("courier_name") or data.get("carrier_name")
    tracking_number = data.get("tracking_number")
    delivery_status = data.get("delivery_status")
    estimated_delivery_date = data.get("estimated_delivery_date")

    valid_statuses = ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']
    if delivery_status and delivery_status not in valid_statuses:
        return jsonify({"error": f"Invalid delivery status. Must be one of: {', '.join(valid_statuses)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT order_id, delivery_status FROM deliveries WHERE delivery_id = %s FOR UPDATE;", (delivery_id,))
        curr = cursor.fetchone()
        if not curr:
            conn.rollback()
            return jsonify({"error": "Delivery record not found"}), 404

        order_id = curr["order_id"]

        update_fields = []
        params = []

        if carrier_name:
            update_fields.append("carrier_name = %s")
            params.append(carrier_name)
        if tracking_number:
            update_fields.append("tracking_number = %s")
            params.append(tracking_number)
        if estimated_delivery_date:
            update_fields.append("estimated_delivery_date = %s")
            params.append(estimated_delivery_date)
        if delivery_status:
            update_fields.append("delivery_status = %s")
            params.append(delivery_status)
            if delivery_status in ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']:
                update_fields.append("dispatch_date = COALESCE(dispatch_date, NOW())")
            elif delivery_status == 'DELIVERED':
                update_fields.append("actual_delivery_date = COALESCE(actual_delivery_date, NOW())")
                # Synchronize Order Status
                cursor.execute("UPDATE orders SET order_status = 'DELIVERED' WHERE order_id = %s;", (order_id,))

        if not update_fields:
            conn.rollback()
            return jsonify({"error": "No update fields provided"}), 400

        params.append(delivery_id)
        sql = f"UPDATE deliveries SET {', '.join(update_fields)} WHERE delivery_id = %s;"
        cursor.execute(sql, tuple(params))

        conn.commit()
        return jsonify({"message": f"Delivery #{delivery_id} updated successfully"}), 200
    except Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
