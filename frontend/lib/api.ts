import axios from "axios";

const DEFAULT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://ze-creatives.onrender.com"
    : "http://localhost:8000";
const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL)
  .trim()
  .replace(/^['"]+|['"]+$/g, "")
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");
const API_URL = RAW_API_URL || DEFAULT_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ze_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle 401 / token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("ze_refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = res.data;
          localStorage.setItem("ze_access_token", access_token);
          localStorage.setItem("ze_refresh_token", refresh_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem("ze_access_token");
          localStorage.removeItem("ze_refresh_token");
          window.location.href = "/sign-in";
        }
      } else {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  refresh: (refresh_token: string) =>
    api.post("/auth/refresh", { refresh_token }),
  activate: (
    tokenOrData: string | { token: string; password: string; confirm_password?: string },
    password?: string,
    confirm_password?: string
  ) => {
    if (typeof tokenOrData === "object") {
      return api.post("/auth/activate", {
        token: tokenOrData.token,
        password: tokenOrData.password,
        confirm_password: tokenOrData.confirm_password || tokenOrData.password,
      });
    }
    return api.post("/auth/activate", {
      token: tokenOrData,
      password: password || "",
      confirm_password: confirm_password || password || "",
    });
  },
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (
    tokenOrData: string | { token: string; new_password: string; confirm_password?: string },
    new_password?: string,
    confirm_password?: string
  ) => {
    if (typeof tokenOrData === "object") {
      return api.post("/auth/reset-password", {
        token: tokenOrData.token,
        new_password: tokenOrData.new_password,
        confirm_password: tokenOrData.confirm_password || tokenOrData.new_password,
      });
    }
    return api.post("/auth/reset-password", {
      token: tokenOrData,
      new_password: new_password || "",
      confirm_password: confirm_password || new_password || "",
    });
  },
  changePassword: (current_password: string, new_password: string, confirm_password: string) =>
    api.post("/auth/change-password", { current_password, new_password, confirm_password }),
  me: () => api.get("/auth/me"),
};

// ─── Public ───────────────────────────────────────────────────────────────────
export const publicApi = {
  getJobs: (params?: Record<string, unknown>) =>
    api.get("/public/jobs", { params }),
  getJob: (id: string) => api.get(`/public/jobs/${id}`),
  getCreatives: (params?: Record<string, unknown>) =>
    api.get("/public/creatives", { params }),
  getCreative: (id: string) => api.get(`/public/creatives/${id}`),
  getCategories: () => api.get("/public/categories"),
  getSubscriptionPlans: () => api.get("/public/subscription-plans"),
  getAnnouncements: (role?: string) =>
    api.get("/public/announcements", { params: role ? { role } : undefined }),
};

// ─── Creative Applications ────────────────────────────────────────────────────
export const creativeApplicationApi = {
  submit: (data: Record<string, unknown>) =>
    api.post("/creative-applications", data),
  // Admin only below
  list: (params?: Record<string, unknown>) =>
    api.get("/creative-applications", { params }),
  get: (id: string) => api.get(`/creative-applications/${id}`),
  review: (id: string, data: Record<string, unknown>) =>
    api.post(`/creative-applications/${id}/review`, data),
};
export const creativeApplicationsApi = creativeApplicationApi;

// ─── Client Applications ──────────────────────────────────────────────────────
export const clientApplicationApi = {
  submit: (data: Record<string, unknown>) =>
    api.post("/client-applications", data),
  list: (params?: Record<string, unknown>) =>
    api.get("/client-applications", { params }),
  get: (id: string) => api.get(`/client-applications/${id}`),
  review: (id: string, data: Record<string, unknown>) =>
    api.post(`/client-applications/${id}/review`, data),
};
export const clientApplicationsApi = clientApplicationApi;

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  createUser: (data: Record<string, unknown>) => api.post("/admin/users", data),
  listUsers: (params?: Record<string, unknown>) =>
    api.get("/admin/users", { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id: string, data: Record<string, unknown>) =>
    api.post(`/admin/users/${id}/status`, data),
  resendInvitation: (id: string) =>
    api.post(`/admin/users/${id}/resend-invitation`),
  createAdmin: (data: Record<string, unknown>) =>
    api.post("/admin/admins", data),
  getAuditLogs: (params?: Record<string, unknown>) =>
    api.get("/admin/audit-logs", { params }),
  getSettings: () => api.get("/admin/settings"),
  updateSetting: (key: string, data: Record<string, unknown>) =>
    api.put(`/admin/settings/${key}`, data),
  createAnnouncement: (data: Record<string, unknown>) =>
    api.post("/admin/announcements", data),
  listAnnouncements: () => api.get("/admin/announcements"),
  getCreatives: () => api.get("/admin/creatives"),
  updateCreative: (userId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/creatives/${userId}`, data),
  getClients: () => api.get("/admin/clients"),
  updateClient: (userId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/clients/${userId}`, data),
  getJobs: () => api.get("/admin/jobs"),
  moderateJob: (jobId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/jobs/${jobId}`, data),
};

// ─── Jobs (client) ────────────────────────────────────────────────────────────
export const jobsApi = {
  list: (params?: Record<string, unknown>) => api.get("/jobs/client", { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  create: (data: Record<string, unknown>) => api.post("/jobs", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/jobs/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.post(`/jobs/${id}/status`, { status }),
  publish: (id: string) => api.post(`/jobs/${id}/publish`),
  close: (id: string) => api.post(`/jobs/${id}/close`),
  delete: (id: string) => api.delete(`/jobs/${id}`),
  getApplications: (id: string, params?: Record<string, unknown>) =>
    api.get(`/job-applications/job/${id}`, { params }),
};

// ─── Job Applications (creative & client) ─────────────────────────────────────
export const jobApplicationsApi = {
  apply: (jobIdOrData: string | Record<string, unknown>, data?: Record<string, unknown>) => {
    if (typeof jobIdOrData === "string") {
      return api.post(`/job-applications/jobs/${jobIdOrData}/apply`, data || {});
    }
    return api.post("/job-applications", jobIdOrData);
  },
  listMyApplications: () => api.get("/job-applications/creative/me"),
  listClientApplicants: (params?: Record<string, unknown>) =>
    api.get("/job-applications/client", { params }),
  listJobApplicants: (jobId: string) =>
    api.get(`/job-applications/job/${jobId}`),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.post(`/job-applications/${id}/status`, data),
  saveJob: (jobId: string) => api.post(`/jobs/${jobId}/save`),
  unsaveJob: (jobId: string) => api.delete(`/jobs/${jobId}/save`),
};

// ─── Creative Profile ─────────────────────────────────────────────────────────
export const creativeProfileApi = {
  get: () => api.get("/creative-profiles/me"),
  update: (data: Record<string, unknown>) =>
    api.patch("/creative-profiles/me", data),
  addExperience: (data: Record<string, unknown>) =>
    api.post("/creative-profiles/me/work-experience", data),
  deleteExperience: (id: string) =>
    api.delete(`/creative-profiles/me/work-experience/${id}`),
  addEducation: (data: Record<string, unknown>) =>
    api.post("/creative-profiles/me/education", data),
  deleteEducation: (id: string) =>
    api.delete(`/creative-profiles/me/education/${id}`),
  addPortfolioProject: (data: Record<string, unknown>) =>
    api.post("/portfolio/projects", data),
  updatePortfolioProject: (id: string, data: Record<string, unknown>) =>
    api.put(`/portfolio/projects/${id}`, data),
  deletePortfolioProject: (id: string) =>
    api.delete(`/portfolio/projects/${id}`),
};

// ─── Client Profile ───────────────────────────────────────────────────────────
export const clientProfileApi = {
  get: () => api.get("/client-profiles/me"),
  update: (data: Record<string, unknown>) =>
    api.patch("/client-profiles/me", data),
  inviteCreative: (data: {
    creative_profile_id: string;
    job_id?: string;
    message?: string;
  }) => api.post("/client-profiles/invite-creative", data),
};

// ─── Messaging ────────────────────────────────────────────────────────────────
export const messagingApi = {
  listConversations: () => api.get("/messaging/conversations"),
  createConversation: (data: {
    recipient_user_id: string;
    subject?: string;
    initial_message: string;
  }) => api.post("/messaging/conversations", data),
  getMessages: (conversationId: string) =>
    api.get(`/messaging/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/messaging/conversations/${conversationId}/messages`, { content }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/notifications", { params }),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
};
