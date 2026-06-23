import api from './axiosInstance';
export const list = (params) => api.get('/audit/logs', { params });
