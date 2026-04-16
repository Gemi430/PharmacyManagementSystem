import api from '../../services/api';

export const alertService = {
  getAll: async (params = {}) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  getCount: async () => {
    const response = await api.get('/alerts/count');
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get('/alerts/low-stock');
    return response.data;
  },

  getExpiring: async (days = 90) => {
    const response = await api.get('/alerts/expiring', { params: { days } });
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.put(`/alerts/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.put('/alerts/read-all');
    return response.data;
  },

  generate: async () => {
    const response = await api.post('/alerts/generate');
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/alerts/${id}`);
    return response.data;
  },
};