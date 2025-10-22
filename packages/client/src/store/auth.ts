import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../types";
import { apiClient } from "../lib/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post<AuthResponse>(
            "/auth/login",
            credentials
          );

          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store token in localStorage for API interceptor
          localStorage.setItem("accessToken", response.accessToken);
        } catch (error: any) {
          set({
            error: error.response?.data?.message || "Login failed",
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post<AuthResponse>(
            "/auth/register",
            credentials
          );

          set({
            user: response.user,
            accessToken: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store token in localStorage for API interceptor
          localStorage.setItem("accessToken", response.accessToken);
        } catch (error: any) {
          set({
            error: error.response?.data?.message || "Registration failed",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
        });

        // Remove token from localStorage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      initialize: async () => {
        set({ isLoading: true });
        const { accessToken, user } = get();
        
        // Check for token in localStorage (for OAuth callbacks)
        const storedToken = localStorage.getItem("accessToken");
        
        if (storedToken) {
          try {
            // Validate token by calling the /me endpoint
            const response = await apiClient.get<User>("/auth/me");
            set({
              user: response,
              accessToken: storedToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // Token is invalid, clear auth state
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
          }
        } else if (accessToken && user) {
          try {
            // Validate token by calling the /me endpoint
            const response = await apiClient.get<User>("/auth/me");
            set({
              user: response,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // Token is invalid, clear auth state
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
          }
        } else {
          set({ isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
