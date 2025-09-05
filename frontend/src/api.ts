// frontend/src/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // send refresh cookie (USERS only)
});

const ADMIN_PREFIX = "/api/admin";

function isAdminUrl(url?: string): boolean {
  if (!url) return false;
  // Be robust whether axios passes relative or absolute
  try {
    const u = new URL(url, api.defaults.baseURL || "http://localhost:5000");
    return u.pathname.startsWith(ADMIN_PREFIX);
  } catch {
    return url.includes(ADMIN_PREFIX);
  }
}

function hardUserLogout() {
  localStorage.removeItem("accessToken");
  // keep adminToken intact
  window.location.href = "/login";
}

function hardAdminLogout() {
  localStorage.removeItem("adminToken");
  // keep user token intact
  window.location.href = "/admin/login";
}

// Attach the correct token: adminToken for /api/admin/*, otherwise prefer user token
api.interceptors.request.use((config: any) => {
  const userToken = localStorage.getItem("accessToken");
  const adminToken = localStorage.getItem("adminToken");
  const url = String(config?.url || "");
  const targetIsAdmin = isAdminUrl(url);

  const token = targetIsAdmin ? adminToken : (userToken || adminToken);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----- USER refresh coordination (admin does NOT refresh) -----
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error: any) => {
    const { response, config } = error || {};
    if (!response) return Promise.reject(error);

    const url = String(config?.url || "");
    const adminCall = isAdminUrl(url);
    const isRefreshCall = url.endsWith("/api/auth/refresh");

    // Admin calls: never try refresh; force admin re-login on 401/403
    if ((response.status === 401 || response.status === 403) && adminCall) {
      hardAdminLogout();
      return Promise.reject(error);
    }

    // Users: try one refresh on 401 (non-refresh call)
    if (response.status === 401 && !config?._retry && !isRefreshCall) {
      if (isRefreshing) {
        // Queue while a refresh is in flight
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) return reject(error);
            const newConfig: any = { ...config, _retry: true };
            newConfig.headers = newConfig.headers || {};
            newConfig.headers.Authorization = `Bearer ${token}`;
            resolve(api(newConfig));
          });
        });
      }

      (config as any)._retry = true;
      isRefreshing = true;

      try {
        // 🔒 Typed so r.data.token exists
        const r = await api.post<{ token: string }>("/api/auth/refresh");
        const newToken = r.data.token;

        // Store as user token (refresh flow is user-only)
        localStorage.setItem("accessToken", newToken);

        flushQueue(newToken);
        isRefreshing = false;

        // Retry original request with new token
        const newConfig: any = { ...config };
        newConfig.headers = newConfig.headers || {};
        newConfig.headers.Authorization = `Bearer ${newToken}`;
        return api(newConfig);
      } catch (e) {
        flushQueue(null);
        isRefreshing = false;
        // Refresh failed: invalid RT or plan expired → logout user
        hardUserLogout();
        return Promise.reject(e);
      }
    }

    // If /refresh itself returns 401/403 → logout user (👈 fixed extra ')')
    if (isRefreshCall && (response.status === 401 || response.status === 403)) {
      hardUserLogout();
    }

    return Promise.reject(error);
  }
);

export default api;
