import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "super_admin" | "admin" | "client" | "creative";
  status: string;
  avatar_url: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setTokens: (access: string, refresh: string) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(email, password);
          const data = res.data;
          localStorage.setItem("ze_access_token", data.access_token);
          localStorage.setItem("ze_refresh_token", data.refresh_token);
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            user: {
              id: data.user_id,
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              role: data.role,
              status: data.status,
              avatar_url: data.avatar_url,
            },
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem("ze_access_token");
        localStorage.removeItem("ze_refresh_token");
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        window.location.href = "/sign-in";
      },

      setTokens: (access, refresh) => {
        localStorage.setItem("ze_access_token", access);
        localStorage.setItem("ze_refresh_token", refresh);
        set({ accessToken: access, refreshToken: refresh });
      },

      fetchMe: async () => {
        try {
          const res = await authApi.me();
          set({ user: res.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: "ze-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Route guards
export function getDashboardRoute(role: string): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin";
    case "client":
      return "/client";
    case "creative":
      return "/creative";
    default:
      return "/";
  }
}
