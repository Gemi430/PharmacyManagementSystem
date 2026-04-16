import api from '../../services/api';

export const reportService = {
  getDashboard: async () => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getInventory: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params });
    return response.data;
  },

  getSales: async (params = {}) => {
    const response = await api.get('/reports/sales', { params });
    return response.data;
  },

  getExpiry: async (params = {}) => {
    const response = await api.get('/reports/expiry', { params });
    return response.data;
  },

  getSuppliers: async () => {
    const response = await api.get('/reports/suppliers');
    return response.data;
  },
};