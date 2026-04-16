import api from '../../services/api';

export const medicineService = {
  // Get all medicines with filters
  getAll: async (params = {}) => {
    const response = await api.get('/medicines', { params });
    return response.data;
  },

  // Get single medicine
  getById: async (id) => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
  },

  // Create medicine
  create: async (data) => {
    const response = await api.post('/medicines', data);
    return response.data;
  },

  // Update medicine
  update: async (id, data) => {
    const response = await api.put(`/medicines/${id}`, data);
    return response.data;
  },

  // Delete medicine
  delete: async (id) => {
    const response = await api.delete(`/medicines/${id}`);
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await api.get('/medicines/categories');
    return response.data;
  },

  // Get low stock medicines
  getLowStock: async () => {
    const response = await api.get('/medicines', { params: { low_stock: true } });
    return response.data;
  },

  // Get expiring medicines
  getExpiring: async (days = 90) => {
    const response = await api.get('/medicines', { params: { expiring_soon: true, days } });
    return response.data;
  },
};