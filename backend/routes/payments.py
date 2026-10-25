import random
import string
from flask import Blueprint, request, jsonify
from db import execute_query, get_db_connection
from mysql.connector import Error

payments_bp = Blueprint("payments", __name__)

@payments_bp.route("/payments", methods=["GET"])
def get_payments():
    status = request.args.get("status")
    search = request.args.get("q", "").strip()

    conditions = ["1=1"]
    params = []

    if status:
        conditions.append("pay.payment_status = %s")
        params.append(status)

    if search:
        conditions.append("(pay.payment_id = %s OR pay.order_id = %s OR pay.transaction_reference LIKE %s OR c.first_name LIKE %s OR c.last_name LIKE %s)")
        num_val = int(search) if search.isdigit() else -1
        like_term = f"%{search}%"
        params.extend([num_val, num_val, like_term, like_term, like_term])

    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT 
            pay.payment_id,
            pay.order_id,
            pay.payment_date,
            pay.amount,
            pay.payment_method,
            pay.payment_status,
            pay.transaction_reference,
            o.order_date,
            o.total_amount AS order_total,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            c.email AS customer_email
        FROM payments pay
        JOIN orders o ON pay.order_id = o.order_id
        JOIN customers c ON o.customer_id = c.customer_id
        WHERE {where_clause}
        ORDER BY pay.payment_date DESC;
    """

    try:
        payments = execute_query(query, tuple(params), fetch_all=True)
        return jsonify(payments), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@payments_bp.route("/payments/<int:payment_id>", methods=["GET"])
def get_payment(payment_id):
    try:
        payment = execute_query("""
            SELECT 
                pay.payment_id,
                pay.order_id,
                pay.payment_date,
                pay.amount,
                pay.payment_method,
                pay.payment_status,
                pay.transaction_reference,
                o.order_date,
                o.order_status,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email AS customer_email,
                c.phone AS customer_phone
            FROM payments pay
            JOIN orders o ON pay.order_id = o.order_id
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE pay.payment_id = %s;
        """, (payment_id,), fetch_one=True)

        if not payment:
            return jsonify({"error": "Payment record not found"}), 404

        return jsonify(payment), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@payments_bp.route("/payments", methods=["POST"])
def record_payment():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    amount = data.get("amount")
    payment_method = data.get("payment_method", "UPI")
    payment_status = data.get("payment_status", "COMPLETED")
    txn_ref = data.get("transaction_reference")

    if not order_id:
        return jsonify({"error": "order_id is required"}), 400

    valid_methods = ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'CASH_ON_DELIVERY']
    if payment_method not in valid_methods:
        return jsonify({"error": f"Invalid payment method. Must be one of: {', '.join(valid_methods)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check order
        cursor.execute("SELECT order_id, total_amount FROM orders WHERE order_id = %s;", (order_id,))
        order = cursor.fetchone()
        if not order:
            conn.rollback()
            return jsonify({"error": f"Order #{order_id} does not exist"}), 404

        if not amount:
            amount = float(order["total_amount"])

        if not txn_ref:
            rand_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            txn_ref = f"SIM-{order_id}-{rand_str}"

        # Insert or update payment for this order
        cursor.execute("""
            INSERT INTO payments (order_id, amount, payment_method, payment_status, transaction_reference)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                amount = VALUES(amount),
                payment_method = VALUES(payment_method),
                payment_status = VALUES(payment_status),
                transaction_reference = VALUES(transaction_reference),
                payment_date = CURRENT_TIMESTAMP;
        """, (order_id, amount, payment_method, payment_status, txn_ref))

        conn.commit()
        return jsonify({
            "message": "Payment simulation recorded successfully",
            "order_id": order_id,
            "transaction_reference": txn_ref,
            "status": payment_status
        }), 201
    except Error as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()
