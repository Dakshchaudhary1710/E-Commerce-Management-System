import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import { 
  Truck, 
  Search, 
  Edit, 
  Eye, 
  AlertCircle, 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2,
  Package
} from 'lucide-react';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    carrier_name: '',
    tracking_number: '',
    estimated_delivery_date: '',
    delivery_status: ''
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.getDeliveries({ search, status: statusFilter });
      setDeliveries(res);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchDeliveries();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const handleOpenEdit = (d) => {
    setSelectedDelivery(d);
    setFormData({
      carrier_name: d.carrier_name || d.courier_name || '',
      tracking_number: d.tracking_number || '',
      estimated_delivery_date: d.estimated_delivery_date ? d.estimated_delivery_date.split('T')[0] : '',
      delivery_status: d.delivery_status || 'PENDING'
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenView = async (d) => {
    try {
      const details = await api.getDeliveryById(d.delivery_id);
      setSelectedDelivery(details);
      setIsViewModalOpen(true);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.updateDelivery(selectedDelivery.delivery_id, formData);
      setIsEditModalOpen(false);
      setNotification({
        type: 'success',
        message: `Delivery #${selectedDelivery.delivery_id} tracking status updated to ${formData.delivery_status}!`
      });
      fetchDeliveries();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Topbar title="Fulfillment & Delivery Logistics" subtitle="MySQL 'Deliveries' Table & Multi-Carrier Tracking" />
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
                placeholder="Search by Tracking #, Courier, Order ID..."
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
              <option value="PENDING">PENDING</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Courier Partner</th>
                <th>Tracking Number</th>
                <th>Estimated Date</th>
                <th>Delivery Status</th>
                <th>Shipping Destination</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                    <div style={{ color: '#64748b' }}>Querying Deliveries table...</div>
                  </td>
                </tr>
              ) : deliveries.length > 0 ? (
                deliveries.map((d) => (
                  <tr key={d.delivery_id}>
                    <td style={{ fontWeight: 600 }}>#{d.delivery_id}</td>
                    <td>
                      <span className="badge badge-neutral">Order #{d.order_id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{d.customer_phone}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{d.carrier_name}</td>
                    <td>
                      <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>
                        {d.tracking_number}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>
                      {d.estimated_delivery_date ? new Date(d.estimated_delivery_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <StatusBadge status={d.delivery_status} />
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.delivery_address}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleOpenView(d)} 
                          className="btn btn-secondary btn-sm"
                          title="View Delivery Timeline & Line Items"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(d)} 
                          className="btn btn-secondary btn-sm"
                          title="Update Tracking & Status"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <Truck className="empty-state-icon" />
                    <div>No delivery records match query</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* View Delivery Details Modal */}
        {isViewModalOpen && selectedDelivery && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={18} color="#2563eb" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    Consignment #{selectedDelivery.delivery_id}
                  </h3>
                  <StatusBadge status={selectedDelivery.delivery_status} />
                </div>
                <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ORDER NUMBER</div>
                    <div style={{ fontWeight: 600 }}>Order #{selectedDelivery.order_id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CARRIER</div>
                    <div style={{ fontWeight: 600 }}>{selectedDelivery.carrier_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>TRACKING NUMBER</div>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedDelivery.tracking_number}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ESTIMATED ARRIVAL</div>
                    <div style={{ fontWeight: 600 }}>{selectedDelivery.estimated_delivery_date}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ACTUAL DELIVERY</div>
                    <div style={{ fontWeight: 600 }}>{selectedDelivery.actual_delivery_date ? new Date(selectedDelivery.actual_delivery_date).toLocaleString() : 'In Progress'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DESTINATION</div>
                    <div style={{ fontSize: '0.8rem', color: '#334155' }}>{selectedDelivery.delivery_address}</div>
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  Enclosed Products
                </h4>
                {selectedDelivery.order_items?.length > 0 ? (
                  <div className="table-container" style={{ border: '1px solid #e2e8f0' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>SKU</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDelivery.order_items.map((it, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{it.product_name}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{it.sku}</td>
                            <td style={{ fontWeight: 600 }}>{it.quantity}</td>
                            <td>₹{Number(it.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No package items loaded.</div>
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

        {/* Update Delivery Modal */}
        {isEditModalOpen && selectedDelivery && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  Update Delivery #{selectedDelivery.delivery_id} (Order #{selectedDelivery.order_id})
                </h3>
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

                  <div className="form-group">
                    <label className="form-label">Courier Carrier Partner *</label>
                    <select 
                      className="form-select"
                      value={formData.carrier_name}
                      onChange={(e) => setFormData({ ...formData, carrier_name: e.target.value })}
                    >
                      <option value="BlueDart Express">BlueDart Express</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="DTDC Express">DTDC Express</option>
                      <option value="FedEx India">FedEx India</option>
                      <option value="Shadowfax">Shadowfax</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tracking Number (Unique) *</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      value={formData.tracking_number}
                      onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Estimated Delivery Date *</label>
                      <input 
                        type="date" 
                        required
                        className="form-input" 
                        value={formData.estimated_delivery_date}
                        onChange={(e) => setFormData({ ...formData, estimated_delivery_date: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Delivery Status *</label>
                      <select 
                        required
                        className="form-select"
                        value={formData.delivery_status}
                        onChange={(e) => setFormData({ ...formData, delivery_status: e.target.value })}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="DISPATCHED">DISPATCHED</option>
                        <option value="IN_TRANSIT">IN_TRANSIT</option>
                        <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="FAILED">FAILED</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Updating...' : 'Save Logistics Update'}
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
