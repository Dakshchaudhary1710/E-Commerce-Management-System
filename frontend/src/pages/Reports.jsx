import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  PieChart, 
  AlertTriangle,
  Code2,
  Calendar
} from 'lucide-react';

const tabs = [
  { id: 'sales', label: 'Sales by Category', icon: BarChart3 },
  { id: 'top-products', label: 'Best-Selling Products', icon: TrendingUp },
  { id: 'top-customers', label: 'Highest-Spending Customers', icon: Users },
  { id: 'order-status', label: 'Orders by Status', icon: PieChart },
  { id: 'low-stock', label: 'Low-Stock Products', icon: AlertTriangle },
  { id: 'monthly', label: 'Monthly Revenue', icon: Calendar },
];

const sqlQueries = {
  sales: `-- Querying the pre-compiled Category Sales View
SELECT category_id, category_name, total_catalog_products, 
       total_units_sold, total_revenue_generated
FROM vw_category_sales
ORDER BY total_revenue_generated DESC;`,

  'top-products': `-- Aggregate Sales per Product with Multi-Table Join & Subtotals
SELECT 
    p.product_id, p.product_name, p.sku, c.category_name, p.price, p.stock_quantity,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.subtotal) AS gross_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN categories c ON p.category_id = c.category_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_status <> 'CANCELLED'
GROUP BY p.product_id, p.product_name, p.sku, c.category_name, p.price, p.stock_quantity
ORDER BY gross_revenue DESC LIMIT 10;`,

  'top-customers': `-- Querying Customer Spending Analytical View
SELECT customer_id, customer_name, email, phone, 
       total_orders, total_spent, average_order_value, most_recent_order_date
FROM vw_customer_spending
WHERE total_orders > 0
ORDER BY total_spent DESC LIMIT 10;`,

  'order-status': `-- Status Distribution with Correlated Subquery Percentage
SELECT 
    order_status,
    COUNT(order_id) AS order_count,
    COALESCE(SUM(total_amount), 0.00) AS total_value,
    ROUND(COUNT(order_id) * 100.0 / (SELECT COUNT(*) FROM orders), 1) AS percentage
FROM orders
GROUP BY order_status
ORDER BY order_count DESC;`,

  'low-stock': `-- Querying Low-Stock Alert View (Stock <= 5)
SELECT product_id, product_name, sku, category_name, 
       price, stock_quantity, urgency_level, recommended_reorder_quantity
FROM vw_low_stock_products
ORDER BY stock_quantity ASC;`,

  monthly: `-- Querying Monthly Revenue Trend View
SELECT order_month, total_orders, delivered_orders, 
       cancelled_orders, gross_revenue, settled_revenue
FROM vw_monthly_revenue
ORDER BY order_month ASC;`
};

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = async (tab) => {
    try {
      setLoading(true);
      setError(null);
      let data = [];
      if (tab === 'sales') data = await api.getSalesReport();
      else if (tab === 'top-products') data = await api.getTopProducts();
      else if (tab === 'top-customers') data = await api.getTopCustomers();
      else if (tab === 'order-status') data = await api.getOrderStatusReport();
      else if (tab === 'low-stock') data = await api.getLowStockReport();
      else if (tab === 'monthly') data = await api.getMonthlyRevenueReport();
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  return (
    <>
      <Topbar title="Analytical SQL Reports" subtitle="Predefined Safe SQL Analytical Views & Aggregation Demonstrations" />
      <div className="page-container">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: isActive ? '#2563eb' : '#64748b',
                  borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <Icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live SQL Query Display Card */}
        <div className="card" style={{ backgroundColor: '#0f172a', color: '#f8fafc', border: 'none', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.65rem', color: '#93c5fd', fontSize: '0.8rem', fontWeight: 600 }}>
            <Code2 size={16} />
            <span>EXECUTED SQL QUERY (RDBMS DEMONSTRATION)</span>
          </div>
          <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.825rem', color: '#e2e8f0', overflowX: 'auto', lineHeight: 1.5 }}>
            {sqlQueries[activeTab]}
          </pre>
        </div>

        {/* Results Data Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>Query Results ({reportData.length} records returned)</span>
            </div>
            <button onClick={() => fetchReport(activeTab)} className="btn btn-secondary btn-sm">
              Refresh Query
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
                <div style={{ color: '#64748b', marginTop: '0.5rem' }}>Executing SQL report query...</div>
              </div>
            ) : error ? (
              <div className="alert alert-danger" style={{ margin: '1rem' }}>
                {error}
              </div>
            ) : (
              <table className="data-table">
                {activeTab === 'sales' && (
                  <>
                    <thead>
                      <tr>
                        <th>Category ID</th>
                        <th>Category Name</th>
                        <th>Catalog Items</th>
                        <th>Units Sold</th>
                        <th>Gross Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r) => (
                        <tr key={r.category_id}>
                          <td style={{ fontWeight: 600 }}>#{r.category_id}</td>
                          <td style={{ fontWeight: 600 }}>{r.category_name}</td>
                          <td>{r.total_catalog_products} products</td>
                          <td style={{ fontWeight: 600 }}>{r.total_units_sold}</td>
                          <td style={{ fontWeight: 600, color: '#059669' }}>
                            ₹{Number(r.total_revenue_generated).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'top-products' && (
                  <>
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>SKU</th>
                        <th>Unit Price</th>
                        <th>Units Sold</th>
                        <th>Gross Sales</th>
                        <th>Current Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r) => (
                        <tr key={r.product_id}>
                          <td style={{ fontWeight: 600 }}>#{r.product_id}</td>
                          <td style={{ fontWeight: 600 }}>{r.product_name}</td>
                          <td><span className="badge badge-neutral">{r.category_name}</span></td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.sku}</td>
                          <td>₹{Number(r.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ fontWeight: 700, color: '#2563eb' }}>{r.total_sold} units</td>
                          <td style={{ fontWeight: 700, color: '#059669' }}>
                            ₹{Number(r.gross_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ fontWeight: 500 }}>{r.stock_quantity} remaining</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'top-customers' && (
                  <>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Customer ID</th>
                        <th>Customer Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Total Orders</th>
                        <th>Total Spent</th>
                        <th>Avg Order Value</th>
                        <th>Recent Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r, i) => (
                        <tr key={r.customer_id}>
                          <td style={{ fontWeight: 700, color: '#2563eb' }}>#{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>#{r.customer_id}</td>
                          <td style={{ fontWeight: 600 }}>{r.customer_name}</td>
                          <td>{r.email}</td>
                          <td>{r.phone}</td>
                          <td><span className="badge badge-info">{r.total_orders} orders</span></td>
                          <td style={{ fontWeight: 700, color: '#059669' }}>
                            ₹{Number(r.total_spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            ₹{Number(r.average_order_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {r.most_recent_order_date ? new Date(r.most_recent_order_date).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'order-status' && (
                  <>
                    <thead>
                      <tr>
                        <th>Order Status</th>
                        <th>Orders Count</th>
                        <th>Total Value</th>
                        <th>Percentage Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r) => (
                        <tr key={r.order_status}>
                          <td><StatusBadge status={r.order_status} /></td>
                          <td style={{ fontWeight: 600 }}>{r.order_count}</td>
                          <td style={{ fontWeight: 600, color: '#059669' }}>
                            ₹{Number(r.total_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{r.percentage}%</span>
                              <div style={{ width: '100px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${r.percentage}%`, height: '100%', background: '#2563eb' }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'low-stock' && (
                  <>
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock Remaining</th>
                        <th>Urgency Level</th>
                        <th>Recommended Reorder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r) => (
                        <tr key={r.product_id} style={{ background: r.stock_quantity === 0 ? '#fef2f2' : '#fffbeb' }}>
                          <td style={{ fontWeight: 600 }}>#{r.product_id}</td>
                          <td style={{ fontWeight: 600 }}>{r.product_name}</td>
                          <td style={{ fontFamily: 'monospace' }}>{r.sku}</td>
                          <td>{r.category_name}</td>
                          <td>₹{Number(r.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ fontWeight: 700, color: r.stock_quantity === 0 ? '#dc2626' : '#d97706' }}>
                            {r.stock_quantity} units
                          </td>
                          <td>
                            <span className={`badge ${r.stock_quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                              {r.urgency_level}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#2563eb' }}>
                            +{r.recommended_reorder_quantity} units
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === 'monthly' && (
                  <>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Total Orders</th>
                        <th>Delivered Orders</th>
                        <th>Cancelled Orders</th>
                        <th>Gross Revenue</th>
                        <th>Settled Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r) => (
                        <tr key={r.order_month}>
                          <td style={{ fontWeight: 700 }}>{r.order_month}</td>
                          <td>{r.total_orders}</td>
                          <td style={{ color: '#16a34a', fontWeight: 600 }}>{r.delivered_orders}</td>
                          <td style={{ color: '#dc2626', fontWeight: 600 }}>{r.cancelled_orders}</td>
                          <td style={{ fontWeight: 600 }}>
                            ₹{Number(r.gross_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ fontWeight: 700, color: '#059669' }}>
                            ₹{Number(r.settled_revenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
