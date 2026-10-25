from flask import Blueprint, request, jsonify
from db import execute_query
from mysql.connector import Error

categories_bp = Blueprint("categories", __name__)

@categories_bp.route("/categories", methods=["GET"])
def get_categories():
    try:
        categories = execute_query("""
            SELECT 
                c.category_id,
                c.category_name,
                c.description,
                c.parent_id,
                c.created_at,
                COUNT(p.product_id) AS product_count
            FROM categories c
            LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
            GROUP BY c.category_id, c.category_name, c.description, c.parent_id, c.created_at
            ORDER BY c.category_name ASC;
        """, fetch_all=True)
        return jsonify(categories), 200
    except Error as e:
        return jsonify({"error": str(e)}), 500

@categories_bp.route("/categories", methods=["POST"])
def create_category():
    data = request.get_json() or {}
    category_name = data.get("category_name", "").strip()
    description = data.get("description", "").strip()
    parent_id = data.get("parent_id")

    if not category_name:
        return jsonify({"error": "Category name is required"}), 400

    try:
        res = execute_query("""
            INSERT INTO categories (category_name, description, parent_id)
            VALUES (%s, %s, %s);
        """, (category_name, description, parent_id if parent_id else None), commit=True)
        return jsonify({
            "message": "Category created successfully",
            "category_id": res["last_id"]
        }), 201
    except Error as e:
        if e.errno == 1062:
            return jsonify({"error": f"Category '{category_name}' already exists"}), 409
        return jsonify({"error": str(e)}), 400

@categories_bp.route("/categories/<int:category_id>", methods=["PUT"])
def update_category(category_id):
    data = request.get_json() or {}
    category_name = data.get("category_name", "").strip()
    description = data.get("description", "").strip()

    if not category_name:
        return jsonify({"error": "Category name cannot be empty"}), 400

    try:
        res = execute_query("""
            UPDATE categories
            SET category_name = %s, description = %s
            WHERE category_id = %s;
        """, (category_name, description, category_id), commit=True)

        if res["row_count"] == 0:
            cat = execute_query("SELECT category_id FROM categories WHERE category_id = %s;", (category_id,), fetch_one=True)
            if not cat:
                return jsonify({"error": "Category not found"}), 404

        return jsonify({"message": "Category updated successfully"}), 200
    except Error as e:
        if e.errno == 1062:
            return jsonify({"error": f"Category name '{category_name}' already taken"}), 409
        return jsonify({"error": str(e)}), 400

@categories_bp.route("/categories/<int:category_id>", methods=["DELETE"])
def delete_category(category_id):
    try:
        # Check if products exist in this category
        products = execute_query("SELECT COUNT(*) AS cnt FROM products WHERE category_id = %s;", (category_id,), fetch_one=True)
        if products and products["cnt"] > 0:
            return jsonify({
                "error": f"Referential Integrity Protected: Cannot delete category #{category_id} because it contains {products['cnt']} product(s)."
            }), 409

        res = execute_query("DELETE FROM categories WHERE category_id = %s;", (category_id,), commit=True)
        if res["row_count"] == 0:
            return jsonify({"error": "Category not found"}), 404

        return jsonify({"message": f"Category #{category_id} deleted successfully"}), 200
    except Error as e:
        return jsonify({"error": str(e)}), 400
