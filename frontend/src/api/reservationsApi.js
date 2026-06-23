import api from './axiosInstance';

export const list = (params) => api.get('/reservations', { params });
export const calendar = (params) => api.get('/reservations/calendar', { params });
export const getById = (id) => api.get(`/reservations/${id}`);
export const create = (data) => api.post('/reservations', data);
export const update = (id, data) => api.put(`/reservations/${id}`, data);
export const approve = (id) => api.patch(`/reservations/${id}/approve`);
export const reject = (id, motivo) => api.patch(`/reservations/${id}/reject`, { motivo });
export const cancel = (id) => api.delete(`/reservations/${id}`);
