import axios from "axios";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes("/api/auth/");
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });
          const { token } = res.data;
          localStorage.setItem("token", token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    const msg =
      error.response?.data?.message || error.message || "Something went wrong";
    if (error.response?.status !== 401) {
      toast.error(msg);
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  login: (data) => api.post("/api/auth/login", data),
  register: (data) => api.post("/api/auth/register", data),
  refresh: (data) => api.post("/api/auth/refresh", data),
  getMe: () => api.get("/api/auth/me"),
  updateProfile: (data) => api.put("/api/auth/update", data),
  changePassword: (data) => api.post("/api/auth/change-password", data),
};

export const orderApi = {
  list: (params) => api.get("/api/orders", { params }),
  get: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post("/api/orders", data),
  update: (id, data) => api.put(`/api/orders/${id}`, data),
  delete: (id) => api.delete(`/api/orders/${id}`),
  assign: (id, data) => api.put(`/api/orders/${id}/assign`, data),
  updateStatus: (id, data) => api.put(`/api/orders/${id}/status`, data),
  getAnalytics: (params) => api.get("/api/orders/analytics", { params }),
  predict: (id) => api.get(`/api/orders/${id}/predict`),
};

export const taskApi = {
  list: (params) => api.get("/api/tasks", { params }),
  get: (id) => api.get(`/api/tasks/${id}`),
  create: (data) => api.post("/api/tasks", data),
  update: (id, data) => api.put(`/api/tasks/${id}`, data),
  delete: (id) => api.delete(`/api/tasks/${id}`),
  assign: (id, data) => api.put(`/api/tasks/${id}/assign`, data),
  updateStatus: (id, data) => api.put(`/api/tasks/${id}/status`, data),
  updateProgress: (id, data) => api.put(`/api/tasks/${id}/progress`, data),
  complete: (id, data) => api.put(`/api/tasks/${id}/complete`, data),
  getAnalytics: (params) => api.get("/api/tasks/analytics", { params }),
};

export const employeeApi = {
  list: (params) => api.get("/api/employees", { params }),
  get: (id) => api.get(`/api/employees/${id}`),
  update: (id, data) => api.put(`/api/employees/${id}`, data),
  getPerformance: (id, params) =>
    api.get(`/api/employees/${id}/performance`, { params }),
  getTasks: (id, params) => api.get(`/api/employees/${id}/tasks`, { params }),
  attendance: (id, data) => api.post(`/api/employees/${id}/attendance`, data),
  reportIssue: (id, data) => api.post(`/api/employees/${id}/issues`, data),
};

export const attendanceApi = {
  clockIn: (id) => api.post(`/api/employees/${id}/attendance`, {
    date: new Date().toISOString().split('T')[0],
    clockIn: new Date().toISOString(),
    shift: 'general',
    timezone: 'IST',
    deviceTime: new Date().toISOString(),
  }),
  clockOut: (id) => api.post(`/api/employees/${id}/attendance`, {
    date: new Date().toISOString().split('T')[0],
    clockOut: new Date().toISOString(),
  }),
  getHistory: (id, params) => api.get(`/api/employees/${id}/attendance`, { params }),
};

export const machineApi = {
  list: (params) => api.get("/api/machines", { params }),
  get: (id) => api.get(`/api/machines/${id}`),
  create: (data) => api.post("/api/machines", data),
  update: (id, data) => api.put(`/api/machines/${id}`, data),
  delete: (id) => api.delete(`/api/machines/${id}`),
  updateStatus: (id, data) => api.put(`/api/machines/${id}/status`, data),
  maintenance: (id, data) => api.put(`/api/machines/${id}/maintenance`, data),
  predict: (id) => api.get(`/api/machines/${id}/predict`),
  getAnalytics: (params) => api.get("/api/machines/analytics", { params }),
};

export const inventoryApi = {
  list: (params) => api.get("/api/inventory", { params }),
  get: (id) => api.get(`/api/inventory/${id}`),
  create: (data) => api.post("/api/inventory", data),
  update: (id, data) => api.put(`/api/inventory/${id}`, data),
  delete: (id) => api.delete(`/api/inventory/${id}`),
  updateStock: (id, data) => api.put(`/api/inventory/${id}/stock`, data),
  reorder: (id, data) => api.post(`/api/inventory/${id}/reorder`, data),
  getAnalytics: (params) => api.get("/api/inventory/analytics", { params }),
  getReorderItems: (params) => api.get("/api/inventory/reorder", { params }),
};

export const qualityApi = {
  list: (params) => api.get("/api/quality", { params }),
  get: (id) => api.get(`/api/quality/${id}`),
  create: (data) => api.post("/api/quality", data),
  update: (id, data) => api.put(`/api/quality/${id}`, data),
  delete: (id) => api.delete(`/api/quality/${id}`),
  getAnalytics: (params) => api.get("/api/quality/analytics", { params }),
  generateReport: (params) => api.get("/api/quality/report", { params }),
};

export const aiApi = {
  predict: (endpoint, data) => api.post(`/api/ai/${endpoint}`, data),
  analyze: (data) => api.post("/api/ai/analyze", data),
  recommendations: (params) => api.get("/api/ai/recommendations", { params }),
  train: (data) => api.post("/api/ai/train", data),
  modelStatus: () => api.get("/api/ai/model-status"),
  dashboard: () => api.get("/api/ai/dashboard"),
};

export const learningVideoApi = {
  list: (params) => api.get("/api/learning-videos", { params }),
  get: (id) => api.get(`/api/learning-videos/${id}`),
  create: (data) => api.post("/api/learning-videos", data),
  update: (id, data) => api.put(`/api/learning-videos/${id}`, data),
  delete: (id) => api.delete(`/api/learning-videos/${id}`),
};

export const defectApi = {
  create: (data) =>
    api.post("/api/defect-reports", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMy: (params) => api.get("/api/defect-reports/my", { params }),
  getAll: (params) => api.get("/api/defect-reports", { params }),
  updateStatus: (id, data) => api.put(`/api/defect-reports/${id}/status`, data),
};

export const productionLineApi = {
  list: (params) => api.get("/api/production-lines", { params }),
  get: (id) => api.get(`/api/production-lines/${id}`),
  create: (data) => api.post("/api/production-lines", data),
  update: (id, data) => api.put(`/api/production-lines/${id}`, data),
  delete: (id) => api.delete(`/api/production-lines/${id}`),
  getAnalytics: (params) =>
    api.get("/api/production-lines/analytics", { params }),
};

export const leaveApi = {
  list: (params) => api.get("/api/leaves", { params }),
  getMy: (params) => api.get("/api/leaves/my", { params }),
  create: (data) => api.post("/api/leaves", data),
  updateStatus: (id, data) => api.put(`/api/leaves/${id}/status`, data),
};

export const notificationApi = {
  list: (params) => api.get("/api/notifications", { params }),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put("/api/notifications/read-all"),
  getUnreadCount: () => api.get("/api/notifications/unread-count"),
  delete: (id) => api.delete(`/api/notifications/${id}`),
};

export const adminDashboardApi = {
  summary: (params) => api.get("/api/admin/dashboard/summary", { params }),
  health: (params) => api.get("/api/admin/dashboard/health", { params }),
};
