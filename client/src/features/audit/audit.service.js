import api from '../../services/api';

export const auditService = {
  getLogs: async (params = {}) => {
    const response = await api.get('/audit', { params });
    return response.data;
  },

  getStats: async (days = 7) => {
    const response = await api.get('/audit/stats', { params: { days } });
    return response.data;
  },

  getRecent: async (limit = 20) => {
    const response = await api.get('/audit/recent', { params: { limit } });
    return response.data;
  },

  clearOldLogs: async (days = 90) => {
    const response = await api.delete('/audit/clear', { params: { days } });
    return response.data;
  },
};