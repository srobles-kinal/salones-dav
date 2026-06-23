import api from './axiosInstance';

export const list = (params) => api.get('/salones', { params });
export const getById = (id) => api.get(`/salones/${id}`);
export const create = (data) => api.post('/salones', data);
export const update = (id, data) => api.put(`/salones/${id}`, data);
export const remove = (id) => api.delete(`/salones/${id}`);
export const restore = (id) => api.patch(`/salones/${id}/restore`);
