import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Eye, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Clock, 
  RefreshCw 
} from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    order_id: '',
    amount: '',
    payment_method: 'UPI',
    payment_status: 'COMPLETED'
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.getPayments({ search, status: statusFilter });
      setPayments(res);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const handleOpenSimulate = () => {
    setFormData({
      order_id: '',
      amount: '',
      payment_method: 'UPI',
      payment_status: 'COMPLETED'
    });
    setFormError(null);
    setIsSimulateModalOpen(true);
  };

  const handleOpenView = (p) => {
    setSelectedPayment(p);
    setIsViewModalOpen(true);
  };

  const handleSubmitSimulate = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.order_id) {
      setFormError('Order ID is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.recordPayment({
        ...formData,
        order_id: parseInt(formData.order_id),
        amount: formData.amount ? parseFloat(formData.amount) : undefined
      });
      setIsSimulateModalOpen(false);
      setNotification({
        type: 'success',
        message: `Simulated payment recorded for Order #${res.order_id}! Reference: ${res.transaction_reference}`
      });
      fetchPayments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Topbar title="Payment Transaction Ledger" subtitle="MySQL 'Payments' Audit Trail & Gateway Simulation" />
      <div className="page-container">
        {notification && (
          <div className={`alert ${notification.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
            <AlertCircle size={18} />
            <div style={{ flex: 1 }}>{notification.message}</div>
            <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="toolbar">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                type="text"
                placeholder="Search by Payment ID, Order ID, Txn Ref..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select 
              className="form-select"
              style={{ width: 'auto', minWidth: '170px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>

          <button onClick={handleOpenSimulate} className="btn btn-primary">
            <Plus size={16} />
            <span>Simulate Payment</span>
          </button>
        </div>

        {/* Payments Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Transaction Reference</th>
                <th>Payment Date</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                    <div style={{ color: '#64748b' }}>Querying Payments ledger...</div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((pay) => (
                  <tr key={pay.payment_id}>
                    <td style={{ fontWeight: 600 }}>#{pay.payment_id}</td>
                    <td style={{ fontWeight: 600 }}>
                      <span className="badge badge-neutral">Order #{pay.order_id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{pay.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{pay.customer_email}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>
                      ₹{Number(pay.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{pay.payment_method}</span>
                    </td>
                    <td>
                      <StatusBadge status={pay.payment_status} />
                    </td>
                    <td>
                      <code style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>
                        {pay.transaction_reference}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {new Date(pay.payment_date).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleOpenView(pay)} 
                        className="btn btn-secondary btn-sm"
                        title="View Payment Breakdown"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <CreditCard className="empty-state-icon" />
                    <div>No payment records found</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* View Payment Modal */}
        {isViewModalOpen && selectedPayment && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '520px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="#2563eb" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    Payment Details #{selectedPayment.payment_id}
                  </h3>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Order ID:</span>
                    <strong>#{selectedPayment.order_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Customer:</span>
                    <strong>{selectedPayment.customer_name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Payment Method:</span>
                    <strong>{selectedPayment.payment_method}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Settlement Amount:</span>
                    <strong style={{ color: '#059669', fontSize: '1.1rem' }}>
                      ₹{Number(selectedPayment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Status:</span>
                    <StatusBadge status={selectedPayment.payment_status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Transaction Reference:</span>
                    <code>{selectedPayment.transaction_reference}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Timestamp:</span>
                    <span>{new Date(selectedPayment.payment_date).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simulate Payment Modal */}
        {isSimulateModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Simulate Order Payment</h3>
                <button onClick={() => setIsSimulateModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitSimulate}>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger">
                      <AlertCircle size={16} />
                      <div>{formError}</div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Order ID (FK &rarr; Orders) *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="form-input" 
                      value={formData.order_id}
                      onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Payment Method *</label>
                      <select 
                        required
                        className="form-select"
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      >
                        <option value="UPI">UPI</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="NET_BANKING">Net Banking</option>
                        <option value="CASH_ON_DELIVERY">Cash On Delivery</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Payment Status *</label>
                      <select 
                        required
                        className="form-select"
                        value={formData.payment_status}
                        onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                      >
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="FAILED">FAILED</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Amount (₹ INR, leave blank to use Order total)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-input" 
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="e.g. 134999.00"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsSimulateModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Recording...' : 'Record Payment Simulation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
