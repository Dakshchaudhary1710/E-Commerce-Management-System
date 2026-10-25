from flask import Blueprint, jsonify
from db import execute_query
from mysql.connector import Error

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/reports/sales", methods=["GET"])
def get_sales_report():
    try:
        report = execute_query("""
            SELECT 
                category_id,
                category_name,
                total_catalog_products,
                total_units_sold,
                total_revenue_generated
            FROM vw_category_sales
            ORDER BY total_revenue_generated DESC;
        """, fetch_all=True)
        return jsonify(report), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/reports/top-products", methods=["GET"])
def get_top_products():
    try:
        report = execute_query("""
            SELECT 
                p.product_id,
                p.product_name,
                p.sku,
                c.category_name,
                p.price,
                p.stock_quantity,
                SUM(oi.quantity) AS total_sold,
                SUM(oi.subtotal) AS gross_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.order_status <> 'CANCELLED'
            GROUP BY p.product_id, p.product_name, p.sku, c.category_name, p.price, p.stock_quantity
            ORDER BY gross_revenue DESC
            LIMIT 10;
        """, fetch_all=True)
        return jsonify(report), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/reports/top-customers", methods=["GET"])
def get_top_customers():
    try:
        report = execute_query("""
            SELECT 
                customer_id,
                customer_name,
                email,
                phone,
                total_orders,
                total_spent,
                average_order_value,
                most_recent_order_date
            FROM vw_customer_spending
            WHERE total_orders > 0
            ORDER BY total_spent DESC
            LIMIT 10;
        """, fetch_all=True)
        return jsonify(report), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/reports/order-status", methods=["GET"])
def get_order_status_report():
    try:
        report = execute_query("""
            SELECT 
                order_status,
                COUNT(order_id) AS order_count,
                COALESCE(SUM(total_amount), 0.00) AS total_value,
                ROUND(COUNT(order_id) * 100.0 / (SELECT COUNT(*) FROM orders), 1) AS percentage
            FROM orders
            GROUP BY order_status
            ORDER BY order_count DESC;
        """, fetch_all=True)
        return jsonify(report), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/reports/low-stock", methods=["GET"])
def get_low_stock_report():
    try:
        report = execute_query("""
            SELECT 
                product_id,
                product_name,
                sku,
                category_name,
                price,
                stock_quantity,
                urgency_level,
                recommended_reorder_quantity
            FROM vw_low_stock_products
            ORDER BY stock_quantity ASC;
        """, fetch_all=True)
        return jsonify(report), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@reports_bp.route("/reports/monthly", methods=["GET"])
def get_monthly_revenue_report():
    try:
        report = execute_query("""
            SELECT 
                order_month,
                total_orders,
                delivered_orders,
                cancelled_orders,
                gross_revenue,
                settled_revenue
            FROM vw_monthly_revenue
            ORDER BY order_month ASC;
        """, fetch_all=True)
        return jsonify(report), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
