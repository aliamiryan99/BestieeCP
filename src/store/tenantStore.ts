"use client";

import { create } from "zustand";
import { extractApiError } from "@/lib/apiClient";
import {
  changeTenantStatus,
  createTenant,
  deleteTenant,
  listTenants,
  updateTenant,
} from "@/services/tenants";
import { Pagination, Tenant, TenantFilters, TenantStatus } from "@/types/cp";

type IncomePoint = {
  label: string;
  value: number;
};

type TenantStore = {
  tenants: Tenant[];
  pagination: Pagination;
  metrics: {
    totalTenants: number;
    aliveTenants: number;
    monthlyIncome: number;
  };
  incomeSeries: IncomePoint[];
  loadingTenants: boolean;
  loadingMetrics: boolean;
  loadingIncome: boolean;
  error?: string | null;
  fetchTenants: (params?: TenantFilters) => Promise<void>;
  fetchMetrics: () => Promise<void>;
  fetchIncome: () => Promise<void>;
  addTenant: (
    payload: Parameters<typeof createTenant>[0]
  ) => Promise<{ ok: boolean; error?: string }>;
  editTenant: (
    id: string,
    payload: Parameters<typeof updateTenant>[1]
  ) => Promise<{ ok: boolean; error?: string }>;
  removeTenant: (id: string) => Promise<{ ok: boolean; error?: string }>;
  updateStatus: (
    id: string,
    status: TenantStatus
  ) => Promise<{ ok: boolean; error?: string }>;
};

const defaultPagination: Pagination = {
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
};

export const useTenantStore = create<TenantStore>((set, get) => ({
  tenants: [],
  pagination: defaultPagination,
  metrics: {
    totalTenants: 0,
    aliveTenants: 0,
    monthlyIncome: 0,
  },
  incomeSeries: [],
  loadingTenants: false,
  loadingMetrics: false,
  loadingIncome: false,
  error: null,

  fetchTenants: async (params = { page: 1, limit: 10 }) => {
    set({ loadingTenants: true, error: null });
    try {
      const res = await listTenants(params);
      const rows: Tenant[] = Array.isArray(res) ? res : res.data ?? [];
      const pagination: Pagination = Array.isArray(res)
        ? {
            totalItems: rows.length,
            totalPages: 1,
            currentPage: params.page ?? 1,
            limit: params.limit ?? defaultPagination.limit,
          }
        : res.pagination ?? defaultPagination;

      set({
        tenants: rows,
        pagination: {
          totalItems: pagination.totalItems ?? rows.length,
          totalPages: pagination.totalPages ?? 1,
          currentPage: pagination.currentPage ?? params.page ?? 1,
          limit: pagination.limit ?? params.limit ?? defaultPagination.limit,
        },
      });
    } catch (error) {
      set({
        error: extractApiError(error) || "اشکال در دریافت لیست مستاجران",
      });
    } finally {
      set({ loadingTenants: false });
    }
  },

  fetchMetrics: async () => {
    set({ loadingMetrics: true });
    try {
      const [totalRes, aliveRes] = await Promise.all([
        listTenants({ page: 1, limit: 1 }),
        listTenants({ page: 1, limit: 1, status: "alive" }),
      ]);

      const totalTenants = Array.isArray(totalRes)
        ? totalRes.length
        : totalRes.pagination?.totalItems ?? 0;
      const aliveTenants = Array.isArray(aliveRes)
        ? aliveRes.length
        : aliveRes.pagination?.totalItems ?? 0;

      set((state) => ({
        metrics: {
          ...state.metrics,
          totalTenants,
          aliveTenants,
          monthlyIncome: state.metrics.monthlyIncome,
        },
      }));
    } catch (error) {
      set({ error: extractApiError(error) });
    } finally {
      set({ loadingMetrics: false });
    }
  },

  fetchIncome: async () => {
    // Backend routes do not expose income yet; keep placeholder hook for UI
    set({ loadingIncome: true, incomeSeries: [] });
    setTimeout(() => set({ loadingIncome: false }), 200);
  },

  addTenant: async (payload) => {
    try {
      await createTenant(payload);
      await get().fetchTenants({
        page: get().pagination.currentPage,
        limit: get().pagination.limit,
      });
      await get().fetchMetrics();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: extractApiError(error) || "امکان ایجاد مستاجر جدید نیست",
      };
    }
  },

  editTenant: async (id, payload) => {
    try {
      const updated = await updateTenant(id, payload);
      set({
        tenants: get().tenants.map((tenant) =>
          tenant.id === id ? { ...tenant, ...updated } : tenant
        ),
      });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  },

  removeTenant: async (id) => {
    try {
      await deleteTenant(id);
      set({ tenants: get().tenants.filter((tenant) => tenant.id !== id) });
      await get().fetchMetrics();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  },

  updateStatus: async (id, status) => {
    try {
      await changeTenantStatus(id, status);
      set({
        tenants: get().tenants.map((t) =>
          t.id === id ? { ...t, status } : t
        ),
      });
      await get().fetchMetrics();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: extractApiError(error) };
    }
  },
}));
