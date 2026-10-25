import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Filter, 
  X, 
  AlertCircle,
  IndianRupee,
  Eye
} from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    product_name: '',
    category_id: '',
    price: '',
    stock_quantity: 0,
    description: '',
    sku: '',
    image_url: ''
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch {
      // ignore
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({
        search,
        categoryId: selectedCategory,
        lowStock: lowStockFilter
      });
      setProducts(res);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory, lowStockFilter]);

  const handleOpenAdd = () => {
    setFormData({
      product_name: '',
      category_id: categories.length > 0 ? categories[0].category_id : '',
      price: '',
      stock_quantity: 15,
      description: '',
      sku: '',
      image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500'
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setFormData({
      product_name: p.product_name,
      category_id: p.category_id,
      price: p.price,
      stock_quantity: p.stock_quantity,
      description: p.description || '',
      sku: p.sku,
      image_url: p.image_url || ''
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (p) => {
    setSelectedProduct(p);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (Number(formData.price) <= 0) {
      setFormError('Price must be greater than zero.');
      return;
    }
    if (Number(formData.stock_quantity) < 0) {
      setFormError('Stock quantity cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createProduct(formData);
      setIsAddModalOpen(false);
      setNotification({ type: 'success', message: 'Product successfully added to MySQL catalog!' });
      fetchProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (Number(formData.price) <= 0) {
      setFormError('Price must be greater than zero.');
      return;
    }
    if (Number(formData.stock_quantity) < 0) {
      setFormError('Stock quantity cannot be negative.');
      return;
    }

    setSubmitting(true);
    try {
      await api.updateProduct(selectedProduct.product_id, formData);
      setIsEditModalOpen(false);
      setNotification({ type: 'success', message: 'Product catalog information updated!' });
      fetchProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await api.deleteProduct(selectedProduct.product_id);
      setIsDeleteModalOpen(false);
      setNotification({ type: 'success', message: `Product #${selectedProduct.product_id} removed successfully.` });
      fetchProducts();
    } catch (err) {
      setIsDeleteModalOpen(false);
      setNotification({ type: 'error', message: err.message });
    }
  };

  return (
    <>
      <Topbar title="Product Catalog Management" subtitle="MySQL 'Products' Table & Inventory Control" />
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
                placeholder="Search products by name, SKU, or desc..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select 
              className="form-select" 
              style={{ width: 'auto', minWidth: '180px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.category_name} ({c.product_count})
                </option>
              ))}
            </select>

            <button 
              onClick={() => setLowStockFilter(!lowStockFilter)} 
              className={`btn btn-sm ${lowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
              style={{ gap: '6px' }}
            >
              <AlertTriangle size={14} />
              <span>Low Stock Alerts (≤ 5)</span>
            </button>
          </div>

          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Products Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Category</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Units Sold</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                    <div style={{ color: '#64748b' }}>Executing product catalog query...</div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isCritical = p.stock_quantity === 0;
                  const isLow = p.stock_quantity > 0 && p.stock_quantity <= 5;

                  return (
                    <tr key={p.product_id} style={{ backgroundColor: isCritical ? '#fffafb' : isLow ? '#fffdf7' : 'inherit' }}>
                      <td style={{ fontWeight: 600 }}>#{p.product_id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {p.image_url && (
                            <img 
                              src={p.image_url} 
                              alt={p.product_name} 
                              style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.product_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{p.category_name}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku}</td>
                      <td style={{ fontWeight: 600 }}>
                        ₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ color: isCritical ? '#dc2626' : isLow ? '#d97706' : 'inherit' }}>
                          {p.stock_quantity} units
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={p.stock_status} />
                      </td>
                      <td style={{ fontWeight: 500 }}>{p.total_units_sold}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleOpenEdit(p)} 
                            className="btn btn-secondary btn-sm"
                            title="Edit Product"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleOpenDelete(p)} 
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#dc2626' }}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <Package className="empty-state-icon" />
                    <div>No products found matching active filters</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Product Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Add New Catalog Product</h3>
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

                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                      placeholder="e.g. Wireless Ergonomic Mouse"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select 
                        required
                        className="form-select"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">SKU (Leave blank to auto-generate)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="e.g. SKU-ACC-MS-01"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Price (₹ INR, positive) *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="form-input" 
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="e.g. 2499.00"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Stock Quantity (≥ 0) *</label>
                      <input 
                        type="number" 
                        min="0"
                        required
                        className="form-input" 
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Specifications, features, and key details..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Image URL</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Adding...' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {isEditModalOpen && selectedProduct && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Edit Product #{selectedProduct.product_id}</h3>
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
                    <label className="form-label">Product Name *</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      value={formData.product_name}
                      onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select 
                        required
                        className="form-select"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      >
                        {categories.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">SKU (Immutable)</label>
                      <input 
                        type="text" 
                        disabled
                        className="form-input" 
                        value={formData.sku}
                        style={{ backgroundColor: '#f1f5f9' }}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Price (₹ INR, positive) *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        className="form-input" 
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Stock Quantity (≥ 0) *</label>
                      <input 
                        type="number" 
                        min="0"
                        required
                        className="form-input" 
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
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

        {/* Delete Confirmation Modal */}
        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          title="Confirm Product Deletion"
          message={`Are you sure you want to delete '${selectedProduct?.product_name}'? Notice: If this product has appeared in historical order items, MySQL's foreign key constraint (ON DELETE RESTRICT) will protect historical audit records and block deletion.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </div>
    </>
  );
}
