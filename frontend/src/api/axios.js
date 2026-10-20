
import axios from "axios";

import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthStorage,
} from "../utils/storage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5001/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeToRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const notifyRefreshSubscribers = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const rejectRefreshSubscribers = (error) => {
  refreshSubscribers.forEach((callback) =>
    callback(null, error)
  );
  refreshSubscribers = [];
};

/*
|--------------------------------------------------------------------------
| Request interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser/Axios generate the multipart boundary
    // when sending files through FormData.
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      if (
        config.headers &&
        typeof config.headers.delete === "function"
      ) {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
|--------------------------------------------------------------------------
| Response interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const requestUrl = originalRequest.url || "";

    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout") ||
      requestUrl.includes("/auth/set-password");

    if (
      status !== 401 ||
      isAuthRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearAuthStorage();
      return Promise.reject(error);
    }

    // Wait for an existing refresh request instead of
    // launching multiple refresh requests simultaneously.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((newToken, refreshError) => {
          if (refreshError || !newToken) {
            reject(refreshError || error);
            return;
          }

          originalRequest.headers =
            originalRequest.headers || {};

          originalRequest.headers.Authorization =
            `Bearer ${newToken}`;

          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const responseData = refreshResponse.data?.data;

      const newAccessToken = responseData?.accessToken;
      const newRefreshToken = responseData?.refreshToken;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error(
          "Invalid token refresh response."
        );
      }

      setAuthTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      notifyRefreshSubscribers(newAccessToken);

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      rejectRefreshSubscribers(refreshError);
      clearAuthStorage();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
