import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Mail, 
  X,
  AlertCircle
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected customer for view / edit / delete
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    street_address: '',
    city: '',
    state: 'Rajasthan',
    postal_code: ''
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.getCustomers(query);
      setCustomers(res);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers(search);
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleOpenAdd = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      street_address: '',
      city: 'Jaipur',
      state: 'Rajasthan',
      postal_code: '303007'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setSelectedCustomer(c);
    setFormData({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (c) => {
    setSelectedCustomer(c);
    setIsViewModalOpen(true);
    setLoadingOrders(true);
    try {
      const orders = await api.getCustomerOrders(c.customer_id);
      setCustomerOrders(orders);
    } catch (err) {
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenDelete = (c) => {
    setSelectedCustomer(c);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.createCustomer(formData);
      setIsAddModalOpen(false);
      setNotification({ type: 'success', message: 'Customer account registered successfully!' });
      fetchCustomers(search);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.updateCustomer(selectedCustomer.customer_id, formData);
      setIsEditModalOpen(false);
      setNotification({ type: 'success', message: 'Customer profile updated successfully!' });
      fetchCustomers(search);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await api.deleteCustomer(selectedCustomer.customer_id);
      setIsDeleteModalOpen(false);
      setNotification({ type: 'success', message: `Customer #${selectedCustomer.customer_id} deleted successfully!` });
      fetchCustomers(search);
    } catch (err) {
      setIsDeleteModalOpen(false);
      setNotification({ type: 'error', message: err.message });
    }
  };

  return (
    <>
      <Topbar title="Customer Management" subtitle="MySQL 'Customers' & 'Addresses' Entity Maintenance" />
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
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text"
              placeholder="Search by name, email, or phone..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Add New Customer</span>
          </button>
        </div>

        {/* Customers Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                    <div style={{ color: '#64748b' }}>Querying Customers table...</div>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.customer_id}>
                    <td style={{ fontWeight: 600 }}>#{c.customer_id}</td>
                    <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 600 }}>
                        {c.total_orders} orders
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: c.total_spent > 0 ? '#059669' : '#64748b' }}>
                      ₹{Number(c.total_spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleOpenView(c)} 
                          className="btn btn-secondary btn-sm"
                          title="View Details & Order History"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(c)} 
                          className="btn btn-secondary btn-sm"
                          title="Edit Customer"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(c)} 
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626' }}
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    <Users className="empty-state-icon" />
                    <div>No customer records found matching "{search}"</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* View Customer & Order History Modal */}
        {isViewModalOpen && selectedCustomer && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '680px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#2563eb" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    Customer Details: {selectedCustomer.full_name}
                  </h3>
                </div>
                <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>EMAIL</div>
                    <div style={{ fontWeight: 600 }}>{selectedCustomer.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>PHONE</div>
                    <div style={{ fontWeight: 600 }}>{selectedCustomer.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>LIFETIME SPENT</div>
                    <div style={{ fontWeight: 600, color: '#059669' }}>
                      ₹{Number(selectedCustomer.total_spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={16} />
                  <span>Order History (Referenced by Foreign Key: customer_id)</span>
                </h4>

                {loadingOrders ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner"></div>
                  </div>
                ) : customerOrders.length > 0 ? (
                  <div className="table-container" style={{ border: '1px solid #e2e8f0' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Total Amount</th>
                          <th>Order Status</th>
                          <th>Payment Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerOrders.map((ord) => (
                          <tr key={ord.order_id}>
                            <td style={{ fontWeight: 600 }}>#{ord.order_id}</td>
                            <td>{new Date(ord.order_date).toLocaleDateString()}</td>
                            <td style={{ fontWeight: 600 }}>₹{Number(ord.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td><StatusBadge status={ord.order_status} /></td>
                            <td>{ord.payment_method || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                    No order history recorded for this customer yet.
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Register New Customer</h3>
                <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd}>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger">
                      <AlertCircle size={16} />
                      <div>{formError}</div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="e.g. Daksh"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="e.g. Chaudhary"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email (Unique) *</label>
                      <input 
                        type="email" 
                        required
                        className="form-input" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. daksh.chaudhary@muj.edu.in"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone (Unique) *</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91-9876543210"
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                      Primary Address (Addresses Table)
                    </div>

                    <div className="form-group">
                      <label className="form-label">Street Address</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={formData.street_address}
                        onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                        placeholder="e.g. Flat 402, Royal Palms, MUJ Road"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Postal Code</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Registering...' : 'Save Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {isEditModalOpen && selectedCustomer && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Edit Customer #{selectedCustomer.customer_id}</h3>
                <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit}>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger">
                      <AlertCircle size={16} />
                      <div>{formError}</div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name *</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email (Unique) *</label>
                      <input 
                        type="email" 
                        required
                        className="form-input" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone (Unique) *</label>
                      <input 
                        type="text" 
                        required
                        className="form-input" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal with Referential Integrity Alert */}
        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          title="Confirm Customer Deletion"
          message={`Are you sure you want to permanently delete customer #${selectedCustomer?.customer_id} (${selectedCustomer?.full_name})? Notice: If this customer has existing orders, foreign key constraints (ON DELETE RESTRICT) will protect the audit trail and reject deletion.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </div>
    </>
  );
}
