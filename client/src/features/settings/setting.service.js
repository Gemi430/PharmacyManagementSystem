import api from '../../services/api';

export const settingService = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/settings/dashboard');
    return response.data;
  },

  update: async (key, data) => {
    const response = await api.put(`/settings/${key}`, data);
    return response.data;
  },

  upsert: async (data) => {
    const response = await api.post('/settings', data);
    return response.data;
  },
};