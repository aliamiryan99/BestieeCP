import { apiClient } from "@/lib/apiClient";
import {
  Domain,
  PaginatedResponse,
  Tenant,
  TenantFilters,
  TenantStatus,
} from "@/types/cp";

export type CreateTenantPayload = {
  name: string;
  domainType: "subdomain" | "custom";
  domainAddress?: string;
  title?: string;
};

export const listTenants = async (
  params?: TenantFilters
): Promise<PaginatedResponse<Tenant> | Tenant[]> => {
  const { data } = await apiClient.get("/cp/tenants", { params });
  return data;
};

export const listMyTenants = async (
  params?: Omit<TenantFilters, "supportId">
): Promise<PaginatedResponse<Tenant> | Tenant[]> => {
  const { data } = await apiClient.get("/cp/tenants/mine", { params });
  return data;
};

export const getTenant = async (id: string): Promise<Tenant> => {
  const { data } = await apiClient.get(`/cp/tenants/${id}`);
  return data;
};

export const createTenant = async (
  payload: CreateTenantPayload
): Promise<Tenant> => {
  const { data } = await apiClient.post("/cp/tenants", payload);
  return data;
};

export const changeTenantStatus = async (
  id: string,
  status: TenantStatus
): Promise<Tenant> => {
  const { data } = await apiClient.patch(`/cp/tenants/${id}/status`, {
    status,
  });
  return data;
};

export const updateTenant = async (
  id: string,
  payload: Partial<Pick<Tenant, "name" | "schema" | "status" | "subscriptionExpireAt" | "supportId" | "support">>
): Promise<Tenant> => {
  const { data } = await apiClient.put(`/cp/tenants/${id}`, payload);
  return data;
};

export const deleteTenant = async (id: string): Promise<void> => {
  await apiClient.delete(`/cp/tenants/${id}`);
};

export const getTenantDomains = async (tenantId: string): Promise<Domain[]> => {
  const { data } = await apiClient.get(`/cp/tenants/${tenantId}/domains`);
  return data;
};

export const addTenantDomain = async (
  tenantId: string,
  payload: Pick<Domain, "type" | "host">
): Promise<Domain> => {
  const { data } = await apiClient.post(
    `/cp/tenants/${tenantId}/domains`,
    payload
  );
  return data;
};

export const updateTenantDomain = async (
  tenantId: string,
  domainId: number,
  payload: Partial<Pick<Domain, "host">> & { isPrimary?: boolean }
): Promise<Domain> => {
  const { data } = await apiClient.patch(
    `/cp/tenants/${tenantId}/domains/${domainId}`,
    payload
  );
  return data;
};

export const deleteTenantDomain = async (
  tenantId: string,
  domainId: number
): Promise<void> => {
  await apiClient.delete(`/cp/tenants/${tenantId}/domains/${domainId}`);
};
