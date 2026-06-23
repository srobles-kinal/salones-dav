import api from './axiosInstance';
export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const me = () => api.get('/auth/me');
export const refresh = () => api.post('/auth/refresh');
export const changePassword = (currentPassword, newPassword) =>
  api.post('/auth/change-password', { currentPassword, newPassword });
