import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  IndianRupee, 
  Clock, 
  Truck, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardMetrics();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <>
        <Topbar title="Operational Dashboard" subtitle="Real-time MySQL Metrics & Order Velocity" />
        <div className="page-container">
          <div className="loading-container">
            <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            <p>Connecting to MySQL database & calculating metrics...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Topbar title="Operational Dashboard" subtitle="Real-time MySQL Metrics & Order Velocity" />
        <div className="page-container">
          <div className="alert alert-danger">
            <AlertTriangle size={18} />
            <div>
              <strong>Failed to load dashboard metrics:</strong> {error}
            </div>
          </div>
          <button onClick={fetchDashboard} className="btn btn-primary">Try Reconnecting</button>
        </div>
      </>
    );
  }

  const { metrics, recent_orders, category_sales } = data || {};

  return (
    <>
      <Topbar title="Operational Dashboard" subtitle="Live Real-time MySQL-Backed Analytics & Key Performance Indicators" />
      <div className="page-container">
        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Total Customers</span>
              <span className="metric-value">{metrics?.total_customers ?? 0}</span>
            </div>
            <div className="metric-icon-wrap" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Catalog Products</span>
              <span className="metric-value">{metrics?.total_products ?? 0}</span>
            </div>
            <div className="metric-icon-wrap" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Package size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Total Orders</span>
              <span className="metric-value">{metrics?.total_orders ?? 0}</span>
            </div>
            <div className="metric-icon-wrap" style={{ backgroundColor: '#fdf4ff', color: '#9333ea' }}>
              <ShoppingCart size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Gross Revenue</span>
              <span className="metric-value">₹{(metrics?.total_sales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="metric-icon-wrap" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
              <IndianRupee size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Pending Payments</span>
              <span className="metric-value">{metrics?.pending_payments ?? 0}</span>
            </div>
            <div className="metric-icon-wrap" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <Clock size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Deliveries In Transit</span>
              <span className="metric-value">{metrics?.deliveries_in_transit ?? 0}</span>
            </div>
            <div className="metric-icon-wrap" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
              <Truck size={22} />
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Low Stock Alerts</span>
              <span className="metric-value" style={{ color: metrics?.low_stock_count > 0 ? '#dc2626' : 'inherit' }}>
                {metrics?.low_stock_count ?? 0}
              </span>
            </div>
            <div className="metric-icon-wrap" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Recent Orders & Top Categories */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          {/* Recent Orders Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShoppingCart size={18} />
                <span>Recent Customer Orders</span>
              </div>
              <Link to="/orders" className="btn btn-secondary btn-sm" style={{ gap: '4px' }}>
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_orders && recent_orders.length > 0 ? (
                    recent_orders.map((o) => (
                      <tr key={o.order_id}>
                        <td style={{ fontWeight: 600 }}>#{o.order_id}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{o.customer_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.customer_email}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>₹{Number(o.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td><StatusBadge status={o.order_status} /></td>
                        <td><StatusBadge status={o.payment_status} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state">No recent orders found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Categories Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Package size={18} />
                <span>Sales by Category (View: vw_category_sales)</span>
              </div>
              <Link to="/reports" className="btn btn-secondary btn-sm" style={{ gap: '4px' }}>
                <span>Full Report</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="table-container" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Catalog Count</th>
                    <th>Units Sold</th>
                    <th>Gross Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {category_sales && category_sales.length > 0 ? (
                    category_sales.map((cat) => (
                      <tr key={cat.category_id}>
                        <td style={{ fontWeight: 600 }}>{cat.category_name}</td>
                        <td>{cat.total_catalog_products} items</td>
                        <td>{cat.total_units_sold}</td>
                        <td style={{ fontWeight: 600, color: '#16a34a' }}>
                          ₹{Number(cat.total_revenue_generated).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="empty-state">No category sales records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
