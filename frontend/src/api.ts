// frontend/src/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // send refresh cookie
});

// Attach Authorization header from localStorage (user or admin)
api.interceptors.request.use((config: any) => {
  const userToken = localStorage.getItem("accessToken");
  const adminToken = localStorage.getItem("adminToken");
  const token = userToken || adminToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh coordination ---
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

function hardLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("adminToken");
  window.location.href = "/login";
}

api.interceptors.response.use(
  (r) => r,
  async (error: any) => {
    const { response, config } = error || {};
    if (!response) return Promise.reject(error);

    const isRefreshCall =
      typeof config?.url === "string" &&
      config.url.endsWith("/api/auth/refresh");

    // Only try refresh for 401 (Unauthorized), once per request
    if (response.status === 401 && !config?._retry && !isRefreshCall) {
      if (isRefreshing) {
        // Queue while a refresh is in-flight
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) return reject(error);
            const newConfig: any = { ...config };
            newConfig.headers = newConfig.headers || {};
            newConfig.headers.Authorization = `Bearer ${token}`;
            resolve(api(newConfig));
          });
        });
      }

      (config as any)._retry = true;
      isRefreshing = true;

      try {
        // 🔒 Type the refresh response so r.data.token is valid
        const r = await api.post<{ token: string }>("/api/auth/refresh");
        const newToken = r.data.token;

        // Store under whichever key is in use (prefer admin if present)
        if (localStorage.getItem("adminToken")) {
          localStorage.setItem("adminToken", newToken);
        } else {
          localStorage.setItem("accessToken", newToken);
        }

        flushQueue(newToken);
        isRefreshing = false;

        // Retry original request with new token
        const newConfig: any = { ...config };
        newConfig.headers = newConfig.headers || {};
        newConfig.headers.Authorization = `Bearer ${newToken}`;
        return api(newConfig);
      } catch (e: any) {
        // Refresh failed: could be 401 (bad RT) or 403 (plan expired)
        flushQueue(null);
        isRefreshing = false;
        hardLogout();
        return Promise.reject(e);
      }
    }

    // If /refresh returns 401/403 (invalid/expired RT or plan expired) ⇒ logout
    if (isRefreshCall && (response.status === 401 || response.status === 403)) {
      hardLogout();
    }

    return Promise.reject(error);
  }
);

export default api;
