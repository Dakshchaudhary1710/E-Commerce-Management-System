import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  BarChart3, 
  Database,
  GraduationCap
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/categories', label: 'Categories', icon: FolderTree },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/payments', label: 'Payments', icon: CreditCard },
  { path: '/deliveries', label: 'Deliveries', icon: Truck },
  { path: '/reports', label: 'SQL Reports', icon: BarChart3 },
  { path: '/database-info', label: 'Database Info', icon: Database },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Database size={20} />
        </div>
        <div>
          <div className="sidebar-brand">E-Commerce DB</div>
          <div className="sidebar-subbrand">MUJ RDBMS Lab</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <GraduationCap size={14} color="#60a5fa" />
          <strong style={{ color: '#e2e8f0' }}>Manipal University</strong>
        </div>
        <div>RDBMS Laboratory Project</div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>MySQL 8+ / InnoDB ACID</div>
      </div>
    </aside>
  );
}
