# E-Commerce Management System (RDBMS Laboratory Project)

**Department of Computer Science & Engineering — Manipal University Jaipur**  
**Student:** Daksh Chaudhary (`daksh.chaudhary@muj.edu.in`)  
**Technology Stack:** React 18 (Vite), Python 3 (Flask REST API), MySQL 8.0+ / 9.x (InnoDB), RESTful JSON APIs  

---

## 1. Project Overview

This project is a functional, full-stack E-Commerce Management System developed for university RDBMS evaluation. It demonstrates:
- **Relational Schema Design:** 10 core & supporting tables normalized to **3rd Normal Form (3NF)**.
- **Data Integrity Constraints:** Primary Keys, Foreign Keys (`RESTRICT` & `CASCADE`), `UNIQUE`, `CHECK` constraints, and `DEFAULT` values.
- **ACID Transactions:** Multi-item order placement with stock row-locking (`SELECT ... FOR UPDATE`), inventory decrementing, and automatic rollback on failure.
- **Advanced SQL:** Inner joins, left joins, correlated subqueries, group by aggregations, 5 pre-compiled views, and B-tree indexes.
- **Full-Stack Implementation:** Modern React administration dashboard with real-time MySQL metrics, and Python Flask REST backend.

---

## 2. Project Directory Structure

```text
Ecommerce-RDBMS-Project/
├── README.md                      # Comprehensive project guide & startup instructions
├── .gitignore                     # Git ignore rules for node_modules, venv, .env
├── backend/                       # Python Flask REST API server
│   ├── app.py                     # Master Flask application & Blueprint registration
│   ├── db.py                      # Thread-safe MySQL connection pool & query executor
│   ├── requirements.txt           # Python package dependencies
│   ├── .env.example               # Database configuration template
│   ├── .env                       # Active environment settings
│   └── routes/                    # Modular API Blueprint endpoints
│       ├── health_dashboard.py    # Health check, metrics, schema-info
│       ├── customers.py           # Customer CRUD & order history
│       ├── products.py            # Product CRUD, category & stock filters
│       ├── categories.py          # Category management
│       ├── orders.py              # Order listing, details & ACID transactions
│       ├── payments.py            # Payment records & simulation
│       ├── deliveries.py          # Logistics & tracking updates
│       └── reports.py             # Analytical views & SQL reports
├── frontend/                      # React 18 Single-Page Application (Vite)
│   ├── package.json               # NPM packages (React, React Router, Lucide)
│   ├── vite.config.js             # Vite configuration with /api backend proxy
│   ├── index.html                 # HTML entry point
│   └── src/
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Router & layout architecture
│       ├── components/            # Sidebar, Topbar, StatusBadge, ConfirmModal
│       ├── pages/                 # 9 Functional Dashboard Pages
│       ├── services/api.js        # Centralized HTTP API client
│       └── styles/index.css       # Clean styling (navy / off-white palette)
├── database/                      # SQL scripts and documentation
│   ├── ecommerce.sql              # Master DDL schema, constraints, views & sample data
│   ├── queries.sql                # Demonstration lab queries (DDL, DML, DQL, Joins, ACID)
│   └── README.md                  # Database architecture & table catalog
├── docs/                          # Academic documentation & diagrams
│   ├── ER_Diagram.md              # Mermaid Entity-Relationship diagram & cardinality
│   ├── Database_Design.md         # Schema constraints, data types & storage engine
│   ├── Normalization.md           # 1NF, 2NF, 3NF mathematical normalization proofs
│   └── Project_Report.md          # 21-section university laboratory project report
└── tests/
    └── test_api.py                # Automated integration test suite
```

---

## 3. macOS Setup & Startup Instructions

Follow these step-by-step terminal instructions to run the project on macOS.

### Step 1: Ensure MySQL is Running
If using Homebrew MySQL on macOS:
```bash
brew services start mysql
```
Verify MySQL connection:
```bash
mysql -u root -e "SELECT VERSION();"
```

### Step 2: Initialize the Database & Populate Sample Data
From the root `Ecommerce-RDBMS-Project/` directory, execute:
```bash
mysql -u root < database/ecommerce.sql
```
*(If your local MySQL root user requires a password, add `-p`)*

To run all academic lab query demonstrations:
```bash
mysql -u root < database/queries.sql
```

---

### Step 3: Configure & Start the Python Flask Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd /Users/dakshchaudhary/Desktop/Ecommerce-RDBMS-Project/backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Verify your `.env` configuration (default assumes `localhost:3306`, user `root`, no password):
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=ecommerce_db
   FLASK_PORT=5001
   FLASK_DEBUG=True
   ```

5. Run the automated integration test suite:
   ```bash
   python3 ../tests/test_api.py
   ```
   *(All 6 unit tests should report `OK`)*

6. Start the Flask API server:
   ```bash
   python3 app.py
   ```
   The backend will be live at: **`http://127.0.0.1:5001`**

---

### Step 4: Install & Start the React Frontend

Open a **new terminal tab or window**:

1. Navigate to the `frontend/` directory:
   ```bash
   cd /Users/dakshchaudhary/Desktop/Ecommerce-RDBMS-Project/frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   👉 **`http://localhost:5173`**

---

## 4. Testing the Five Core Modules

1. **Dashboard (`/`):**
   - Displays live MySQL metrics (Customers: 12, Products: 25, Orders: 18, Gross Revenue: ₹588,727+).
   - Real-time MySQL server connection badge.
2. **Customers (`/customers`):**
   - Search by name or email.
   - Click the Eye icon on any customer to view their complete order history linked via Foreign Key.
   - Click "Add New Customer" to register a new user in the `customers` and `addresses` tables.
   - Delete protection: Try deleting customer #1 (Daksh Chaudhary); foreign key integrity protects the active order history and prevents deletion!
3. **Products (`/products`):**
   - Filter products by category or click "Low Stock Alerts (≤ 5)" to highlight critical items.
   - Add a product with positive price and non-negative stock validation.
4. **Orders (`/orders`):**
   - View orders and line items.
   - Click **"Create New Order (ACID)"**: Select customer and merchandise. The backend locks the catalog rows, decrements stock atomically, and creates linked payment and delivery records.
   - Change order status via the dropdown.
5. **Payments (`/payments`):**
   - View transaction audit logs with payment methods (`UPI`, `CREDIT_CARD`, `DEBIT_CARD`, `CASH_ON_DELIVERY`).
   - Click "Simulate Payment" to record a simulated payment.
6. **Deliveries (`/deliveries`):**
   - Track shipments by courier (BlueDart, Delhivery, DTDC).
   - Update courier and tracking number, and transition delivery status to `DELIVERED`.
7. **SQL Reports (`/reports`):**
   - Switch between tabs to see pre-compiled views: `vw_category_sales`, `vw_customer_spending`, `vw_low_stock_products`, and `vw_monthly_revenue` alongside the exact SQL syntax.
8. **Database Information (`/database-info`):**
   - Inspects live metadata from `information_schema` and presents normalization proofs from 1NF to 3NF.
