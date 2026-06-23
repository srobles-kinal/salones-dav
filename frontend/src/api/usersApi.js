import api from './axiosInstance';
export const list = () => api.get('/users');
export const getById = (id) => api.get(`/users/${id}`);
export const create = (data) => api.post('/users', data);
export const update = (id, data) => api.put(`/users/${id}`, data);
export const changeRole = (id, rol) => api.patch(`/users/${id}/role`, { rol });
export const setActive = (id, activo) => api.patch(`/users/${id}/activate`, { activo });
export const remove = (id) => api.delete(`/users/${id}`);
