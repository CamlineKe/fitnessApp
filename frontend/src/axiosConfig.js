import axios from 'axios';
import Logger from './utils/logger';

const API_URL = import.meta.env.VITE_API_URL;

// Configure axios defaults for cookie-based auth
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true; // ✅ Essential for sending/receiving cookies
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
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh(() => {
              resolve(axios(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await refreshAccessToken();
          isRefreshing = false;
          onTokenRefreshed();
          return axios(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          Logger.error('Token refresh failed:', refreshError);
          localStorage.removeItem('user');
          // Don't auto-redirect - let components handle auth state
          return Promise.reject(refreshError);
        }
      }

      Logger.warn('Unauthorized request');
      localStorage.removeItem('user');
      // Don't auto-redirect - let components handle auth state
    }

    return Promise.reject(error);
  }
);

export default axios;
