import api from './axiosInstance';

export const getActive = () => api.get('/lactation/active');
export const getById = (id) => api.get(`/lactation/${id}`);
export const history = (params) => api.get('/lactation/history', { params });
export const checkIn = (data) => api.post('/lactation/check-in', data);
export const checkOut = (id) => api.patch(`/lactation/${id}/check-out`);
export const update = (id, data) => api.put(`/lactation/${id}`, data);
export const remove = (id) => api.delete(`/lactation/${id}`);
