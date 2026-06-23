import axios from 'axios';
import { env } from '../config/env';

const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
  timeout: 15000,
});

let accessToken = null;
let onUnauthorized = () => {};

export const setAccessToken = (t) => { accessToken = t; };
export const getAccessToken = () => accessToken;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let isRefreshing = false;
let waitingQueue = [];

const processQueue = (err, token) => {
  waitingQueue.forEach(p => err ? p.reject(err) : p.resolve(token));
  waitingQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/login')) {
      if (original.url.includes('/auth/refresh')) {
        onUnauthorized();
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => waitingQueue.push({ resolve, reject }))
          .then(t => { original.headers.Authorization = `Bearer ${t}`; return api(original); });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const r = await axios.post(`${env.API_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = r.data.data.accessToken;
        accessToken = newToken;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        onUnauthorized();
        return Promise.reject(err);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(error);
  }
);

export default api;
