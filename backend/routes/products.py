import random
import string
from flask import Blueprint, request, jsonify
from db import execute_query
from mysql.connector import Error

products_bp = Blueprint("products", __name__)

def generate_sku(name, category_id):
    clean = "".join(filter(str.isalnum, name)).upper()[:3]
    rand = ''.join(random.choices(string.digits, k=4))
    return f"SKU-CAT{category_id}-{clean}-{rand}"

@products_bp.route("/products", methods=["GET"])
def get_products():
    search = request.args.get("q", "").strip()
    category_id = request.args.get("category_id")
    low_stock_only = request.args.get("low_stock", "").lower() in ["1", "true"]

    conditions = ["p.is_active = 1"]
    params = []

    if search:
        conditions.append("(p.product_name LIKE %s OR p.description LIKE %s OR p.sku LIKE %s)")
        like_term = f"%{search}%"
        params.extend([like_term, like_term, like_term])

    if category_id:
        conditions.append("p.category_id = %s")
        params.append(category_id)

    if low_stock_only:
        conditions.append("p.stock_quantity <= 5")

    where_clause = " AND ".join(conditions)

    query = f"""
        SELECT 
            p.product_id,
            p.product_name,
            p.sku,
            p.price,
            p.stock_quantity,
            p.description,
            p.image_url,
            p.is_active,
            p.created_at,
            c.category_id,
            c.category_name,
            CASE 
                WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
                WHEN p.stock_quantity <= 5 THEN 'LOW_STOCK'
                ELSE 'IN_STOCK'
            END AS stock_status,
            COALESCE(SUM(oi.quantity), 0) AS total_units_sold
        FROM products p
        JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        WHERE {where_clause}
        GROUP BY p.product_id, p.product_name, p.sku, p.price, p.stock_quantity, 
                 p.description, p.image_url, p.is_active, p.created_at, c.category_id, c.category_name
        ORDER BY p.product_id ASC;
    """

    try:
        products = execute_query(query, tuple(params), fetch_all=True)
        return jsonify(products), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@products_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    try:
        product = execute_query("""
            SELECT 
                p.product_id,
                p.product_name,
                p.sku,
                p.price,
                p.stock_quantity,
                p.description,
                p.image_url,
                p.is_active,
                p.created_at,
                c.category_id,
                c.category_name,
                CASE 
                    WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
                    WHEN p.stock_quantity <= 5 THEN 'LOW_STOCK'
                    ELSE 'IN_STOCK'
                END AS stock_status
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = %s;
        """, (product_id,), fetch_one=True)

        if not product:
            return jsonify({"error": "Product not found"}), 404

        # Recent orders involving this product
        orders = execute_query("""
            SELECT 
                o.order_id,
                o.order_date,
                oi.quantity,
                oi.unit_price,
                oi.subtotal,
                o.order_status,
                CONCAT(c.first_name, ' ', c.last_name) AS customer_name
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE oi.product_id = %s
            ORDER BY o.order_date DESC
            LIMIT 5;
        """, (product_id,), fetch_all=True)

        product["order_history"] = orders
        return jsonify(product), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@products_bp.route("/products", methods=["POST"])
def create_product():
    data = request.get_json() or {}
    product_name = data.get("product_name", "").strip()
    category_id = data.get("category_id")
    price = data.get("price")
    stock_quantity = data.get("stock_quantity", 0)
    description = data.get("description", "").strip()
    sku = data.get("sku", "").strip()
    image_url = data.get("image_url", "").strip()

    if not product_name or category_id is None or price is None:
        return jsonify({"error": "Product name, category, and price are required"}), 400

    try:
        price = float(price)
        stock_quantity = int(stock_quantity)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid price or stock value"}), 400

    if price <= 0:
        return jsonify({"error": "Price must be a positive number"}), 400

    if stock_quantity < 0:
        return jsonify({"error": "Stock quantity cannot be negative"}), 400

    if not sku:
        sku = generate_sku(product_name, category_id)

    if not image_url:
        image_url = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500"

    try:
        res = execute_query("""
            INSERT INTO products (category_id, product_name, sku, price, stock_quantity, description, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """, (category_id, product_name, sku, price, stock_quantity, description, image_url), commit=True)

        return jsonify({
            "message": "Product created successfully",
            "product_id": res["last_id"],
            "sku": sku
        }), 201
    except Error as e:
        if e.errno == 1062:
            return jsonify({"error": f"SKU '{sku}' already exists"}), 409
        return jsonify({"error": str(e)}), 400

@products_bp.route("/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.get_json() or {}
    product_name = data.get("product_name", "").strip()
    category_id = data.get("category_id")
    price = data.get("price")
    stock_quantity = data.get("stock_quantity")
    description = data.get("description", "").strip()
    image_url = data.get("image_url")

    if not product_name or category_id is None or price is None or stock_quantity is None:
        return jsonify({"error": "Product name, category, price, and stock quantity are required"}), 400

    try:
        price = float(price)
        stock_quantity = int(stock_quantity)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numeric values for price or stock"}), 400

    if price <= 0:
        return jsonify({"error": "Price must be positive"}), 400
    if stock_quantity < 0:
        return jsonify({"error": "Stock cannot be negative"}), 400

    try:
        res = execute_query("""
            UPDATE products
            SET product_name = %s, category_id = %s, price = %s, stock_quantity = %s, 
                description = %s, image_url = COALESCE(%s, image_url)
            WHERE product_id = %s;
        """, (product_name, category_id, price, stock_quantity, description, image_url, product_id), commit=True)

        if res["row_count"] == 0:
            prod = execute_query("SELECT product_id FROM products WHERE product_id = %s;", (product_id,), fetch_one=True)
            if not prod:
                return jsonify({"error": "Product not found"}), 404

        return jsonify({"message": "Product updated successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 400

@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    """
    Safely delete product or protect referential integrity if it has historical orders.
    """
    try:
        items = execute_query("SELECT COUNT(*) AS cnt FROM order_items WHERE product_id = %s;", (product_id,), fetch_one=True)
        if items and items["cnt"] > 0:
            return jsonify({
                "error": f"Referential Integrity Protected: Cannot delete product #{product_id} because it appears in {items['cnt']} order item(s). Deactivate instead."
            }), 409

        res = execute_query("DELETE FROM products WHERE product_id = %s;", (product_id,), commit=True)
        if res["row_count"] == 0:
            return jsonify({"error": "Product not found"}), 404

        return jsonify({"message": f"Product #{product_id} deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 400
