import api from './axiosInstance';
export const dashboard = () => api.get('/reports/dashboard');
export const occupancy = (params) => api.get('/reports/occupancy', { params });
