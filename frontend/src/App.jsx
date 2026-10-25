import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Deliveries from './pages/Deliveries';
import Reports from './pages/Reports';
import DatabaseInfo from './pages/DatabaseInfo';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/deliveries" element={<Deliveries />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/database-info" element={<DatabaseInfo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
