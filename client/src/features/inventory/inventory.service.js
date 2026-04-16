import api from '../../services/api';

export const inventoryService = {
  getAdjustments: async (params = {}) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  createAdjustment: async (data) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/inventory/summary');
    return response.data;
  },
};