import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Clock, 
  Trash2,
  PackageCheck,
  ShieldCheck
} from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status update
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Create Order Form State
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState('UPI');
  const [orderNotes, setOrderNotes] = useState('Order placed from Admin Dashboard');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, available_stock: 0, unit_price: 0 }
  ]);
  const [createError, setCreateError] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({ search, status: statusFilter });
      setOrders(res);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custs, prods] = await Promise.all([
        api.getCustomers(),
        api.getProducts()
      ]);
      setCustomers(custs);
      setProducts(prods);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const handleOpenView = async (orderId) => {
    try {
      const details = await api.getOrderById(orderId);
      setSelectedOrder(details);
      setIsViewModalOpen(true);
    } catch (err) {
      setNotification({ type: 'error', message: `Failed to load order #${orderId}: ${err.message}` });
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setNotification({ type: 'success', message: `Order #${orderId} status updated to ${newStatus}` });
      fetchOrders();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenCreate = () => {
    setOrderCustomer(customers.length > 0 ? customers[0].customer_id : '');
    setOrderPaymentMethod('UPI');
    setOrderNotes('Lab transaction test order');
    setOrderItems([
      { product_id: products.length > 0 ? products[0].product_id : '', quantity: 1, available_stock: products.length > 0 ? products[0].stock_quantity : 0, unit_price: products.length > 0 ? products[0].price : 0 }
    ]);
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    setOrderItems([
      ...orderItems,
      { product_id: '', quantity: 1, available_stock: 0, unit_price: 0 }
    ]);
  };

  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemProductChange = (index, prodId) => {
    const prod = products.find((p) => String(p.product_id) === String(prodId));
    const newItems = [...orderItems];
    newItems[index] = {
      product_id: prodId,
      quantity: 1,
      available_stock: prod ? prod.stock_quantity : 0,
      unit_price: prod ? prod.price : 0
    };
    setOrderItems(newItems);
  };

  const handleItemQuantityChange = (index, qty) => {
    const newItems = [...orderItems];
    newItems[index].quantity = Math.max(1, parseInt(qty) || 1);
    setOrderItems(newItems);
  };

  // Compute total
  const calculatedGrandTotal = orderItems.reduce((acc, it) => {
    return acc + (Number(it.unit_price || 0) * Number(it.quantity || 1));
  }, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setCreateError(null);

    // Validate
    if (!orderCustomer) {
      setCreateError('Please select a customer.');
      return;
    }

    for (const it of orderItems) {
      if (!it.product_id) {
        setCreateError('Please select a product for all rows.');
        return;
      }
      if (it.quantity > it.available_stock) {
        setCreateError(`Insufficient stock for product. Available: ${it.available_stock}, Requested: ${it.quantity}. Please lower quantity to prevent ACID transaction rollback.`);
        return;
      }
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        customer_id: orderCustomer,
        payment_method: orderPaymentMethod,
        notes: orderNotes,
        items: orderItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity
        }))
      };

      const res = await api.createOrder(payload);
      setIsCreateModalOpen(false);
      setNotification({
        type: 'success',
        message: `Order #${res.order_id} committed successfully! Txn: ${res.transaction_reference}, Tracking: ${res.tracking_number}`
      });
      fetchOrders();
      fetchDependencies(); // refresh stock numbers
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <>
      <Topbar title="Order Management" subtitle="MySQL Transactions, Row Locking, Inventory Deduction & Status Flow" />
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
                placeholder="Search by order ID, customer name, email..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select 
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ gap: '6px' }}>
            <Plus size={16} />
            <span>Create New Order (ACID)</span>
          </button>
        </div>

        {/* Orders Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Distinct Items</th>
                <th>Total Units</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Update Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                    <div style={{ color: '#64748b' }}>Querying orders from MySQL...</div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => (
                  <tr key={o.order_id}>
                    <td style={{ fontWeight: 600 }}>#{o.order_id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.customer_email}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                      {new Date(o.order_date).toLocaleString()}
                    </td>
                    <td>{o.items_count} items</td>
                    <td>{o.total_units} units</td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>
                      ₹{Number(o.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <StatusBadge status={o.order_status} />
                    </td>
                    <td>
                      <select 
                        className="form-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                        value={o.order_status}
                        disabled={updatingOrderId === o.order_id}
                        onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleOpenView(o.order_id)} 
                        className="btn btn-secondary btn-sm"
                        title="View Detailed Order & Order Items"
                      >
                        <Eye size={14} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <ShoppingCart className="empty-state-icon" />
                    <div>No orders found matching search criteria</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* View Order Details Modal */}
        {isViewModalOpen && selectedOrder && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '780px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={18} color="#2563eb" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    Order Details #{selectedOrder.order_id}
                  </h3>
                  <StatusBadge status={selectedOrder.order_status} />
                </div>
                <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {/* Meta summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CUSTOMER</div>
                    <div style={{ fontWeight: 600 }}>{selectedOrder.customer_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedOrder.customer_phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ORDER DATE</div>
                    <div style={{ fontWeight: 600 }}>{new Date(selectedOrder.order_date).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SHIPPING DESTINATION</div>
                    <div style={{ fontSize: '0.825rem', color: '#334155' }}>{selectedOrder.formatted_shipping_address}</div>
                  </div>
                </div>

                {/* Order Items Table */}
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                  Order Line Items (MySQL Table: Order_Items)
                </h4>
                <div className="table-container" style={{ border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item ID</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.order_item_id}>
                          <td style={{ fontWeight: 600 }}>#{item.order_item_id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>{item.sku}</div>
                          </td>
                          <td>{item.category_name}</td>
                          <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                          <td>₹{Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ fontWeight: 600, color: '#059669' }}>
                            ₹{Number(item.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                        <td colSpan="5" style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>
                          Grand Total (Calculated):
                        </td>
                        <td style={{ color: '#059669', fontSize: '1rem', padding: '0.75rem 1rem' }}>
                          ₹{Number(selectedOrder.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Payment & Delivery Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                      Payment Audit Record (Payments Table)
                    </div>
                    {selectedOrder.payment ? (
                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Method:</strong> {selectedOrder.payment.payment_method}</div>
                        <div><strong>Status:</strong> <StatusBadge status={selectedOrder.payment.payment_status} /></div>
                        <div><strong>Txn Ref:</strong> <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>{selectedOrder.payment.transaction_reference}</code></div>
                        <div><strong>Amount:</strong> ₹{Number(selectedOrder.payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      </div>
                    ) : (
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No payment record associated.</div>
                    )}
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                      Delivery Tracking (Deliveries Table)
                    </div>
                    {selectedOrder.delivery ? (
                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><strong>Courier:</strong> {selectedOrder.delivery.carrier_name}</div>
                        <div><strong>Status:</strong> <StatusBadge status={selectedOrder.delivery.delivery_status} /></div>
                        <div><strong>Tracking #:</strong> <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>{selectedOrder.delivery.tracking_number}</code></div>
                        <div><strong>Estimated Date:</strong> {selectedOrder.delivery.estimated_delivery_date}</div>
                      </div>
                    ) : (
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No delivery record initialized.</div>
                    )}
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

        {/* Create Order Modal (Academic Transaction Workflow) */}
        {isCreateModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '720px' }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={20} color="#2563eb" />
                    <span>Create Order via MySQL Transaction</span>
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    ACID Unit of Work: Stock Lock &rarr; Validation &rarr; Insert Orders & Items &rarr; Decrement Stock &rarr; Commit
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitOrder}>
                <div className="modal-body">
                  {createError && (
                    <div className="alert alert-danger">
                      <AlertCircle size={16} />
                      <div>{createError}</div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Customer *</label>
                      <select 
                        required
                        className="form-select"
                        value={orderCustomer}
                        onChange={(e) => setOrderCustomer(e.target.value)}
                      >
                        <option value="">Select Customer</option>
                        {customers.map((c) => (
                          <option key={c.customer_id} value={c.customer_id}>
                            #{c.customer_id} — {c.full_name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Payment Method *</label>
                      <select 
                        required
                        className="form-select"
                        value={orderPaymentMethod}
                        onChange={(e) => setOrderPaymentMethod(e.target.value)}
                      >
                        <option value="UPI">UPI</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="NET_BANKING">Net Banking</option>
                        <option value="CASH_ON_DELIVERY">Cash On Delivery (COD)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Order Notes / Delivery Instructions</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                    />
                  </div>

                  {/* Line Items Selection */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>
                        Order Line Items
                      </label>
                      <button 
                        type="button" 
                        onClick={handleAddItemRow} 
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '4px' }}
                      >
                        <Plus size={13} />
                        <span>Add Item</span>
                      </button>
                    </div>

                    {orderItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 2 }}>
                          <select 
                            required
                            className="form-select"
                            value={item.product_id}
                            onChange={(e) => handleItemProductChange(idx, e.target.value)}
                          >
                            <option value="">Select Catalog Product</option>
                            {products.map((p) => (
                              <option key={p.product_id} value={p.product_id}>
                                {p.product_name} (₹{p.price} | Stock: {p.stock_quantity})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ width: '90px' }}>
                          <input 
                            type="number" 
                            min="1"
                            max={item.available_stock || 999}
                            required
                            className="form-input" 
                            value={item.quantity}
                            onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                            title={`Max available: ${item.available_stock}`}
                          />
                        </div>

                        <div style={{ width: '130px', textAlign: 'right', paddingTop: '0.55rem', fontWeight: 600 }}>
                          ₹{((item.unit_price || 0) * (item.quantity || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>

                        <button 
                          type="button" 
                          onClick={() => handleRemoveItemRow(idx)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626', padding: '0.6rem 0.6rem' }}
                          disabled={orderItems.length === 1}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    <div style={{ textAlign: 'right', marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
                      <span style={{ color: '#64748b', marginRight: '0.75rem' }}>Calculated Total:</span>
                      <strong style={{ fontSize: '1.25rem', color: '#059669' }}>
                        ₹{calculatedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingOrder} className="btn btn-primary" style={{ gap: '6px' }}>
                    <PackageCheck size={16} />
                    <span>{submittingOrder ? 'Committing Transaction...' : 'Place Order & Commit'}</span>
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
