import axios from 'axios';
import Logger from './utils/logger';

const API_URL = import.meta.env.VITE_API_URL;

// OPTIMIZED: Create axios instance with keep-alive for connection reuse
// This reduces TCP handshake overhead for multiple API calls
const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ Essential for sending/receiving cookies
  headers: { 'Content-Type': 'application/json' }
});

// Keep references to defaults for interceptors
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

const refreshAccessToken = async () => {
  try {
    const response = await axios.post('/users/refresh-token');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Response interceptor to handle token expiration and automatic refresh
// Apply to both global axios and our instance for consistency
const responseInterceptor = (response) => response;
const errorInterceptor = async (error) => {
  const originalRequest = error.config;

  if (error.response?.status === 401 && !originalRequest._retry) {
    if (error.response?.data?.code === 'TOKEN_EXPIRED') {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => {
            resolve(instance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed();
        return instance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        Logger.error('Token refresh failed:', refreshError);
        localStorage.removeItem('user');
        return Promise.reject(refreshError);
      }
    }

    Logger.warn('Unauthorized request');
    localStorage.removeItem('user');
  }

  return Promise.reject(error);
};

// Apply interceptors to both global axios and our instance
axios.interceptors.response.use(responseInterceptor, errorInterceptor);
instance.interceptors.response.use(responseInterceptor, errorInterceptor);

// OPTIMIZED: Export the configured instance as default
// Services should import from this file to get keep-alive benefits
export default instance;

// Also export global axios for backward compatibility
export { axios as globalAxios };
