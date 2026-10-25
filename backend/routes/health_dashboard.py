from flask import Blueprint, jsonify
from db import execute_query, get_db_connection
from mysql.connector import Error

health_dashboard_bp = Blueprint("health_dashboard", __name__)

@health_dashboard_bp.route("/health", methods=["GET"])
def health_check():
    try:
        res = execute_query("SELECT VERSION() AS version, DATABASE() AS database_name, CURRENT_TIMESTAMP AS server_time;", fetch_one=True)
        return jsonify({
            "status": "online",
            "database_connected": True,
            "mysql_version": res.get("version"),
            "database": res.get("database_name"),
            "server_time": res.get("server_time")
        }), 200
    except Error as e:
        return jsonify({
            "status": "degraded",
            "database_connected": False,
            "error": str(e)
        }), 500

@health_dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard_metrics():
    try:
        # Core counts and aggregates
        customer_count = execute_query("SELECT COUNT(*) AS total FROM customers WHERE is_active = 1;", fetch_one=True)["total"]
        product_count = execute_query("SELECT COUNT(*) AS total FROM products WHERE is_active = 1;", fetch_one=True)["total"]
        
        order_metrics = execute_query("""
            SELECT 
                COUNT(*) AS total_orders,
                COALESCE(SUM(CASE WHEN order_status <> 'CANCELLED' THEN total_amount ELSE 0 END), 0.00) AS total_sales,
                COUNT(CASE WHEN order_status = 'PENDING' THEN 1 END) AS pending_orders
            FROM orders;
        """, fetch_one=True)
        
        pending_payments = execute_query("SELECT COUNT(*) AS total FROM payments WHERE payment_status = 'PENDING';", fetch_one=True)["total"]
        in_transit_deliveries = execute_query("SELECT COUNT(*) AS total FROM deliveries WHERE delivery_status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DISPATCHED');", fetch_one=True)["total"]
        low_stock_products = execute_query("SELECT COUNT(*) AS total FROM products WHERE stock_quantity <= 5 AND is_active = 1;", fetch_one=True)["total"]
        
        # Recent orders (top 6)
        recent_orders = execute_query("""
            SELECT 
                o.order_id,
                o.order_date,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
                c.email AS customer_email,
                o.total_amount,
                o.order_status,
                d.delivery_status,
                d.carrier_name,
                pay.payment_status,
                pay.payment_method
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            LEFT JOIN deliveries d ON o.order_id = d.order_id
            LEFT JOIN payments pay ON o.order_id = pay.order_id
            ORDER BY o.order_date DESC
            LIMIT 6;
        """, fetch_all=True)

        # Sales by category summary
        category_sales = execute_query("SELECT * FROM vw_category_sales ORDER BY total_revenue_generated DESC LIMIT 5;", fetch_all=True)

        return jsonify({
            "metrics": {
                "total_customers": customer_count,
                "total_products": product_count,
                "total_orders": order_metrics["total_orders"],
                "total_sales": order_metrics["total_sales"],
                "pending_payments": pending_payments,
                "deliveries_in_transit": in_transit_deliveries,
                "low_stock_count": low_stock_products
            },
            "recent_orders": recent_orders,
            "category_sales": category_sales
        }), 200
    except Error as e:
        return jsonify({"error": f"Database query failed: {str(e)}"}), 500

@health_dashboard_bp.route("/schema-info", methods=["GET"])
def get_schema_info():
    """
    Returns actual database tables, column counts, foreign key constraints,
    views, and indexes directly from information_schema.
    """
    try:
        tables = execute_query("""
            SELECT 
                TABLE_NAME AS table_name,
                TABLE_ROWS AS approximate_rows,
                CREATE_TIME AS created_at
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'ecommerce_db' AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME;
        """, fetch_all=True)

        views = execute_query("""
            SELECT TABLE_NAME AS view_name 
            FROM information_schema.VIEWS 
            WHERE TABLE_SCHEMA = 'ecommerce_db'
            ORDER BY TABLE_NAME;
        """, fetch_all=True)

        foreign_keys = execute_query("""
            SELECT 
                TABLE_NAME AS table_name,
                COLUMN_NAME AS column_name,
                CONSTRAINT_NAME AS constraint_name,
                REFERENCED_TABLE_NAME AS referenced_table,
                REFERENCED_COLUMN_NAME AS referenced_column
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = 'ecommerce_db' 
              AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, CONSTRAINT_NAME;
        """, fetch_all=True)

        return jsonify({
            "database_name": "ecommerce_db",
            "tables": tables,
            "views": views,
            "foreign_keys": foreign_keys
        }), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500
