import api from '../../services/api';

export const salesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/sales', data);
    return response.data;
  },

  getStats: async (period = 'today') => {
    const response = await api.get('/sales/stats', { params: { period } });
    return response.data;
  },

  cancel: async (id, reason) => {
    const response = await api.post(`/sales/${id}/cancel`, { reason });
    return response.data;
  },
};