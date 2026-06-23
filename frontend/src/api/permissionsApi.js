import api from './axiosInstance';

export const catalog = () => api.get('/permissions/catalog');
export const me = () => api.get('/permissions/me');
export const getUserPermissions = (userId) => api.get(`/permissions/users/${userId}`);
export const updateUserPermissions = (userId, selections) =>
  api.put(`/permissions/users/${userId}`, { selections });
