'use client';

import { create } from "zustand";
import {
  extractApiError,
  getAuthToken,
  setAuthToken,
} from "@/lib/apiClient";
import { fetchProfile, login, updateProfile } from "@/services/auth";
import { CPUser, SupportRole } from "@/types/cp";

type AuthState = {
  user: CPUser | null;
  token: string | null;
  initialized: boolean;
  loading: boolean;
  error?: string | null;
  isAuthenticated: () => boolean;
  role: () => SupportRole | null;
  isCreator: () => boolean;
  isMissionary: () => boolean;
  hydrate: () => Promise<void>;
  login: (
    payload: { phone: string; password: string }
  ) => Promise<{ ok: boolean; error?: string }>;
  fetchMe: () => Promise<void>;
  updateMe: (
    payload: Partial<
      Pick<CPUser, "name" | "email" | "birthdate" | "address"> & {
        password?: string;
      }
    >
  ) => Promise<boolean>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getAuthToken() ?? null,
  initialized: false,
  loading: false,
  error: null,

  isAuthenticated: () => !!get().token,
  role: () => get().user?.role ?? null,
  isCreator: () => get().role() === "Creator",
  isMissionary: () => get().role() === "Missionary",

  hydrate: async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      set({ initialized: true, user: null, token: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const me = await fetchProfile();
      set({ user: me, token: currentToken });
    } catch (error) {
      set({ error: extractApiError(error), user: null, token: null });
      setAuthToken(null);
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  login: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = await login(payload);
      setAuthToken(data.token);
      set({ user: data.user, token: data.token, initialized: true });
      return { ok: true };
    } catch (error) {
      const message = extractApiError(error);
      set({ error: message, initialized: true });
      return { ok: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  fetchMe: async () => {
    set({ loading: true, error: null });
    try {
      const me = await fetchProfile();
      set({ user: me, token: getAuthToken() ?? null });
    } catch (error) {
      set({ error: extractApiError(error) });
    } finally {
      set({ loading: false });
    }
  },

  updateMe: async (payload) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateProfile(payload);
      set({ user: updated });
      return true;
    } catch (error) {
      set({ error: extractApiError(error) });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, initialized: true });
  },
}));
