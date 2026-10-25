/**
 * Centralized API Client for E-Commerce RDBMS Management System
 * Communicates with the Flask REST Backend (port 5001 or proxied /api)
 */

const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = (isJson && data.error) ? data.error : `HTTP Error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMessage);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.status) throw error;
    // Network / connection refused error
    const netErr = new Error(`Cannot connect to Flask backend (${url}). Please ensure the backend server is running on port 5001.`);
    netErr.status = 0;
    throw netErr;
  }
}

export const api = {
  // System Health & Dashboard
  getHealth: () => request('/health'),
  getDashboardMetrics: () => request('/dashboard'),
  getSchemaInfo: () => request('/schema-info'),

  // Customers
  getCustomers: (search = '') => request(`/customers${search ? `?q=${encodeURIComponent(search)}` : ''}`),
  getCustomerById: (id) => request(`/customers/${id}`),
  getCustomerOrders: (id) => request(`/customers/${id}/orders`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: data }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: data }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('q', params.search);
    if (params.categoryId) query.append('category_id', params.categoryId);
    if (params.lowStock) query.append('low_stock', 'true');
    const qs = query.toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: data }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: data }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('q', params.search);
    const qs = query.toString();
    return request(`/orders${qs ? `?${qs}` : ''}`);
  },
  getOrderById: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: data }),
  updateOrderStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: { order_status: status } }),

  // Payments
  getPayments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('q', params.search);
    const qs = query.toString();
    return request(`/payments${qs ? `?${qs}` : ''}`);
  },
  getPaymentById: (id) => request(`/payments/${id}`),
  recordPayment: (data) => request('/payments', { method: 'POST', body: data }),

  // Deliveries
  getDeliveries: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('q', params.search);
    const qs = query.toString();
    return request(`/deliveries${qs ? `?${qs}` : ''}`);
  },
  getDeliveryById: (id) => request(`/deliveries/${id}`),
  createDelivery: (data) => request('/deliveries', { method: 'POST', body: data }),
  updateDelivery: (id, data) => request(`/deliveries/${id}`, { method: 'PUT', body: data }),

  // Analytical Reports
  getSalesReport: () => request('/reports/sales'),
  getTopProducts: () => request('/reports/top-products'),
  getTopCustomers: () => request('/reports/top-customers'),
  getOrderStatusReport: () => request('/reports/order-status'),
  getLowStockReport: () => request('/reports/low-stock'),
  getMonthlyRevenueReport: () => request('/reports/monthly'),
};
