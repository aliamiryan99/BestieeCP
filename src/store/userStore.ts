'use client';

import { create } from "zustand";
import { extractApiError } from "@/lib/apiClient";
import {
  CreateUserPayload,
  createUser,
  deleteUser,
  getUser,
  listUsers,
  toggleUserActive,
  updateUser,
  UserFilters,
} from "@/services/users";
import { CPUser, Pagination } from "@/types/cp";

type UserState = {
  users: CPUser[];
  pagination: Pagination;
  loading: boolean;
  error?: string | null;
  fetchUsers: (params?: UserFilters) => Promise<void>;
  fetchUser: (id: number) => Promise<CPUser | null>;
  addUser: (payload: CreateUserPayload) => Promise<{ ok: boolean; error?: string }>;
  editUser: (
    id: number,
    payload: Partial<CreateUserPayload> & { active?: boolean }
  ) => Promise<{ ok: boolean; error?: string }>;
  toggleActive: (id: number) => Promise<{ ok: boolean; error?: string }>;
  removeUser: (id: number) => Promise<{ ok: boolean; error?: string }>;
};

const defaultPagination: Pagination = {
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
};

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  pagination: defaultPagination,
  loading: false,
  error: null,

  fetchUsers: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await listUsers(params);
      if (Array.isArray(res)) {
        set({
          users: res,
          pagination: {
            ...defaultPagination,
            totalItems: res.length,
          },
        });
      } else {
        set({
          users: res.data,
          pagination: res.pagination ?? defaultPagination,
        });
      }
    } catch (error) {
      set({ error: extractApiError(error) });
    } finally {
      set({ loading: false });
    }
  },

  fetchUser: async (id) => {
    try {
      const user = await getUser(id);
      return user;
    } catch (error) {
      set({ error: extractApiError(error) });
      return null;
    }
  },

  addUser: async (payload) => {
    try {
      const user = await createUser(payload);
      set({ users: [user, ...get().users] });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  },

  editUser: async (id, payload) => {
    try {
      const updated = await updateUser(id, payload);
      set({
        users: get().users.map((u) => (u.id === id ? updated : u)),
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  },

  toggleActive: async (id) => {
    try {
      const updated = await toggleUserActive(id);
      set({
        users: get().users.map((u) => (u.id === id ? updated : u)),
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  },

  removeUser: async (id) => {
    try {
      await deleteUser(id);
      set({ users: get().users.filter((u) => u.id !== id) });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  },
}));
