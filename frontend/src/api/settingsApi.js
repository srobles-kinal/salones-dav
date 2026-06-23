import api from './axiosInstance';

export const get = () => api.get('/settings');
export const update = (data) => api.put('/settings', data);
export const testEmail = () => api.post('/settings/test-email');
export const publicConfig = () => api.get('/settings/public');
