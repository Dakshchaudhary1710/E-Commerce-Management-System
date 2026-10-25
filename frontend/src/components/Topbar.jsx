import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  const [dbStatus, setDbStatus] = useState({ connected: false, version: '', loading: true });

  const checkConnection = async () => {
    try {
      setDbStatus(prev => ({ ...prev, loading: true }));
      const health = await api.getHealth();
      setDbStatus({
        connected: health.database_connected,
        version: health.mysql_version,
        loading: false
      });
    } catch {
      setDbStatus({ connected: false, version: '', loading: false });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-title-section">
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
      </div>

      <div className="topbar-badges">
        {dbStatus.connected ? (
          <div className="badge badge-success" style={{ gap: '5px' }}>
            <CheckCircle2 size={13} />
            <span>MySQL Connected {dbStatus.version ? `(${dbStatus.version})` : ''}</span>
          </div>
        ) : (
          <div className="badge badge-danger" style={{ gap: '5px' }}>
            <AlertCircle size={13} />
            <span>Database Offline</span>
          </div>
        )}

        <button 
          onClick={checkConnection} 
          className="btn btn-secondary btn-sm"
          title="Refresh database connection status"
        >
          <RefreshCw size={13} className={dbStatus.loading ? 'spinner' : ''} />
          <span>Ping</span>
        </button>
      </div>
    </header>
  );
}
