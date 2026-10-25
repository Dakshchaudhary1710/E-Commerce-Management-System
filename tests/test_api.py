import unittest
import json
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app import create_app
from db import execute_query

class TestEcommerceAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def test_01_health_endpoint(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get("status"), "online")
        self.assertTrue(data.get("database_connected"))
        self.assertEqual(data.get("database"), "ecommerce_db")

    def test_02_dashboard_metrics(self):
        response = self.client.get('/api/dashboard')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        metrics = data.get("metrics", {})
        self.assertIn("total_customers", metrics)
        self.assertIn("total_products", metrics)
        self.assertIn("total_orders", metrics)
        self.assertIn("total_sales", metrics)
        self.assertGreater(metrics["total_customers"], 0)
        self.assertGreater(metrics["total_products"], 0)

    def test_03_customer_crud_and_referential_integrity(self):
        # 1. Create customer
        new_cust_payload = {
            "first_name": "TestUser",
            "last_name": "Manipal",
            "email": "testuser.manipal@muj.edu.in",
            "phone": "+91-9999988888",
            "street_address": "MUJ Campus Hostel B",
            "city": "Jaipur",
            "postal_code": "303007"
        }
        res_post = self.client.post('/api/customers', json=new_cust_payload)
        self.assertIn(res_post.status_code, [201, 409])
        
        # 2. List and search
        res_list = self.client.get('/api/customers?q=TestUser')
        self.assertEqual(res_list.status_code, 200)
        custs = res_list.get_json()
        self.assertGreater(len(custs), 0)
        cust_id = custs[0]["customer_id"]

        # 3. Retrieve details
        res_get = self.client.get(f'/api/customers/{cust_id}')
        self.assertEqual(res_get.status_code, 200)

        # 4. Referential integrity: Customer #1 has historical orders and CANNOT be deleted
        res_del_active = self.client.delete('/api/customers/1')
        self.assertEqual(res_del_active.status_code, 409)
        self.assertIn("Referential Integrity Protected", res_del_active.get_json()["error"])

        # 5. Delete newly created customer with 0 orders safely
        res_del = self.client.delete(f'/api/customers/{cust_id}')
        self.assertEqual(res_del.status_code, 200)

    def test_04_product_crud_and_constraints(self):
        # 1. Product creation with invalid price (<= 0)
        res_invalid = self.client.post('/api/products', json={
            "product_name": "Invalid Product",
            "category_id": 2,
            "price": -100.0,
            "stock_quantity": 5
        })
        self.assertEqual(res_invalid.status_code, 400)

        # 2. Valid product creation
        res_valid = self.client.post('/api/products', json={
            "product_name": "MUJ Lab Test Dongle",
            "category_id": 1,
            "price": 1299.00,
            "stock_quantity": 10,
            "description": "USB-C to HDMI Multiport Adapter"
        })
        self.assertEqual(res_valid.status_code, 201)
        prod_data = res_valid.get_json()
        prod_id = prod_data["product_id"]

        # 3. Filter products by category
        res_cat = self.client.get('/api/products?category_id=1')
        self.assertEqual(res_cat.status_code, 200)

        # 4. Safe cleanup of test product
        res_del = self.client.delete(f'/api/products/{prod_id}')
        self.assertEqual(res_del.status_code, 200)

    def test_05_order_transaction_and_stock_reduction(self):
        # Retrieve product #10 (Anker Charger) stock
        prod_before = execute_query("SELECT stock_quantity FROM products WHERE product_id = 10;", fetch_one=True)
        initial_stock = prod_before["stock_quantity"]

        # 1. Attempt order exceeding available stock (Should ROLLBACK)
        excessive_order = {
            "customer_id": 1,
            "items": [{"product_id": 10, "quantity": initial_stock + 9999}]
        }
        res_fail = self.client.post('/api/orders', json=excessive_order)
        self.assertEqual(res_fail.status_code, 400)
        self.assertIn("Insufficient stock", res_fail.get_json()["error"])

        # Stock should remain untouched
        prod_after_fail = execute_query("SELECT stock_quantity FROM products WHERE product_id = 10;", fetch_one=True)
        self.assertEqual(prod_after_fail["stock_quantity"], initial_stock)

        # 2. Valid Order Placement (Must COMMIT and decrement stock)
        valid_order = {
            "customer_id": 1,
            "items": [{"product_id": 10, "quantity": 1}],
            "payment_method": "UPI",
            "notes": "Automated Test Order"
        }
        res_success = self.client.post('/api/orders', json=valid_order)
        self.assertEqual(res_success.status_code, 201)
        order_info = res_success.get_json()
        order_id = order_info["order_id"]

        # Verify stock decremented by 1
        prod_after_success = execute_query("SELECT stock_quantity FROM products WHERE product_id = 10;", fetch_one=True)
        self.assertEqual(prod_after_success["stock_quantity"], initial_stock - 1)

        # Verify order details
        res_order = self.client.get(f'/api/orders/{order_id}')
        self.assertEqual(res_order.status_code, 200)
        order_detail = res_order.get_json()
        self.assertIsNotNone(order_detail.get("payment"))
        self.assertIsNotNone(order_detail.get("delivery"))

        # Clean up test order & restore stock
        execute_query("DELETE FROM deliveries WHERE order_id = %s;", (order_id,), commit=True)
        execute_query("DELETE FROM payments WHERE order_id = %s;", (order_id,), commit=True)
        execute_query("DELETE FROM order_items WHERE order_id = %s;", (order_id,), commit=True)
        execute_query("DELETE FROM orders WHERE order_id = %s;", (order_id,), commit=True)
        execute_query("UPDATE products SET stock_quantity = %s WHERE product_id = 10;", (initial_stock,), commit=True)

    def test_06_reports_endpoints(self):
        endpoints = [
            '/api/reports/sales',
            '/api/reports/top-products',
            '/api/reports/top-customers',
            '/api/reports/order-status',
            '/api/reports/low-stock',
            '/api/reports/monthly'
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 200, f"Endpoint {ep} failed")
            data = res.get_json()
            self.assertIsInstance(data, list)

if __name__ == '__main__':
    unittest.main()
