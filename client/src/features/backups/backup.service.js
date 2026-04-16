import api from '../../services/api';

export const backupService = {
  getAll: async () => {
    const response = await api.get('/backups');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/backups', data);
    return response.data;
  },

  restore: async (id) => {
    const response = await api.post(`/backups/${id}/restore`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/backups/${id}`);
    return response.data;
  },

  download: async (id) => {
    const response = await api.get(`/backups/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};