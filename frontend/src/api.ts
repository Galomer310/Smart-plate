import axios from "axios";

// Shape of /api/auth/refresh response
type RefreshResponse = { accessToken: string };

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  withCredentials: true, // allow refresh cookie
});

// Attach the (admin/user) access token to every request
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("adminToken") || localStorage.getItem("accessToken");

  if (token) {
    // Axios v1 headers is an AxiosHeaders object with .set(); older Axios uses a plain object.
    const headers = (config.headers ?? {}) as Record<string, any> & {
      set?: (k: string, v: string) => void;
    };

    if (typeof headers.set === "function") {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers["Authorization"] = `Bearer ${token}`;
    }
    config.headers = headers as any;
  }

  return config;
});

let isRefreshing = false;
let waiters: Array<(t: string) => void> = [];

// Refresh on 401 and retry once
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original: any = error?.config;
    const status = error?.response?.status;

    if (status === 401 && !original?._retry) {
      original._retry = true;

      try {
        const newToken = await refreshAccessToken();

        // Put the new token on the retried request
        const headers = (original.headers ?? {}) as Record<string, any> & {
          set?: (k: string, v: string) => void;
        };
        if (typeof headers.set === "function") {
          headers.set("Authorization", `Bearer ${newToken}`);
        } else {
          headers["Authorization"] = `Bearer ${newToken}`;
        }
        original.headers = headers as any;

        return api(original);
      } catch {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("accessToken");
      }
    }

    return Promise.reject(error);
  }
);

async function refreshAccessToken(): Promise<string> {
  // de-duplicate parallel 401s
  if (isRefreshing) {
    return new Promise<string>((resolve) => waiters.push(resolve));
  }

  isRefreshing = true;
  try {
    // Tell TS what we expect back
    const r = await api.post<RefreshResponse>("/api/auth/refresh");
    const newToken = r.data.accessToken;

    // keep both keys in sync (admin area reads adminToken)
    localStorage.setItem("adminToken", newToken);
    localStorage.setItem("accessToken", newToken);

    // release queued requests
    waiters.forEach((fn) => fn(newToken));
    waiters = [];

    return newToken;
  } finally {
    isRefreshing = false;
  }
}

export default api;
