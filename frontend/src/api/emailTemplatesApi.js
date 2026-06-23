import api from './axiosInstance';

export const list = () => api.get('/email-templates');
export const get = (codigo) => api.get(`/email-templates/${codigo}`);
export const update = (codigo, data) => api.put(`/email-templates/${codigo}`, data);
export const reset = (codigo) => api.post(`/email-templates/${codigo}/reset`);
export const preview = (data) => api.post('/email-templates/preview', data);
export const sendTest = (codigo, to) => api.post('/email-templates/send-test', { codigo, to });
