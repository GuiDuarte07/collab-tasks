import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthResponse } from "@/types";
import api from "@/lib/api";
import { initSocket, disconnectSocket } from "@/lib/socket";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  setAuth: (data: AuthResponse) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (data: AuthResponse) => {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        initSocket(data.accessToken);

        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        });
      },

      login: async (email: string, password: string) => {
        const response = await api.post<AuthResponse>("/auth/login", {
          email,
          password,
        });

        const authData = response.data;
        useAuthStore.getState().setAuth(authData);
      },

      register: async (data) => {
        const response = await api.post<AuthResponse>("/auth/register", data);
        const authData = response.data;
        useAuthStore.getState().setAuth(authData);
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        disconnectSocket();

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // Recria a conexão WebSocket ao reidratar o estado da store
      onRehydrateStorage: () => (state) => {
        const token = state?.accessToken || localStorage.getItem("accessToken");
        if (token) {
          initSocket(token);
        }
      },
    }
  )
);
