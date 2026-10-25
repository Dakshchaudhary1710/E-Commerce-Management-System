import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Topbar from '../components/Topbar';
import ConfirmModal from '../components/ConfirmModal';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  AlertCircle, 
  X 
} from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ category_name: '', description: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      setCategories(res);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ category_name: '', description: '' });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setSelectedCategory(c);
    setFormData({ category_name: c.category_name, description: c.description || '' });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (c) => {
    setSelectedCategory(c);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.createCategory(formData);
      setIsAddModalOpen(false);
      setNotification({ type: 'success', message: 'Category created successfully!' });
      fetchCategories();
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
      await api.updateCategory(selectedCategory.category_id, formData);
      setIsEditModalOpen(false);
      setNotification({ type: 'success', message: 'Category details updated!' });
      fetchCategories();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    try {
      await api.deleteCategory(selectedCategory.category_id);
      setIsDeleteModalOpen(false);
      setNotification({ type: 'success', message: `Category '${selectedCategory.category_name}' removed.` });
      fetchCategories();
    } catch (err) {
      setIsDeleteModalOpen(false);
      setNotification({ type: 'error', message: err.message });
    }
  };

  return (
    <>
      <Topbar title="Category Classification" subtitle="MySQL 'Categories' Entity & Hierarchical Grouping" />
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

        <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Catalog Products</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
                    <div style={{ color: '#64748b' }}>Querying categories...</div>
                  </td>
                </tr>
              ) : categories.length > 0 ? (
                categories.map((c) => (
                  <tr key={c.category_id}>
                    <td style={{ fontWeight: 600 }}>#{c.category_id}</td>
                    <td style={{ fontWeight: 600 }}>{c.category_name}</td>
                    <td style={{ color: '#64748b', maxWidth: '350px' }}>{c.description || '—'}</td>
                    <td>
                      <span className="badge badge-info">
                        {c.product_count} products
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleOpenEdit(c)} 
                          className="btn btn-secondary btn-sm"
                          title="Edit Category"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(c)} 
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#dc2626' }}
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <FolderTree className="empty-state-icon" />
                    <div>No categories found in database</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Category Modal */}
        {isAddModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Add Category</h3>
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
                    <label className="form-label">Category Name *</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      value={formData.category_name}
                      onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                      placeholder="e.g. Gaming Gear"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Details regarding this product category..."
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Creating...' : 'Save Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {isEditModalOpen && selectedCategory && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Edit Category #{selectedCategory.category_id}</h3>
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
                    <label className="form-label">Category Name *</label>
                    <input 
                      type="text" 
                      required
                      className="form-input" 
                      value={formData.category_name}
                      onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                    />
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

        {/* Delete Modal */}
        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          title="Confirm Category Deletion"
          message={`Are you sure you want to delete '${selectedCategory?.category_name}'? Notice: If products are currently linked to this category, MySQL referential integrity will prevent deletion.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      </div>
    </>
  );
}
