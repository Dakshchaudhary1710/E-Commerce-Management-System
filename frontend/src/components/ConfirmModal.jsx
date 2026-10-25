import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isDanger ? '#dc2626' : '#1e293b' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
