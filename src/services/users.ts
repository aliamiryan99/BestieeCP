import { apiClient } from "@/lib/apiClient";
import { CPUser, PaginatedResponse, SupportRole } from "@/types/cp";

export type UserFilters = {
  q?: string;
  role?: SupportRole;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

export const listUsers = async (
  params?: UserFilters
): Promise<PaginatedResponse<CPUser> | CPUser[]> => {
  const { data } = await apiClient.get("/cp/users", { params });
  return data;
};

export const getUser = async (id: number): Promise<CPUser> => {
  const { data } = await apiClient.get(`/cp/users/${id}`);
  return data;
};

export type CreateUserPayload = {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  birthdate?: string | null;
  address?: string | null;
  role?: SupportRole;
};

export const createUser = async (
  payload: CreateUserPayload
): Promise<CPUser> => {
  const { data } = await apiClient.post("/cp/users", payload);
  return data;
};

export const updateUser = async (
  id: number,
  payload: Partial<CreateUserPayload> & { active?: boolean }
): Promise<CPUser> => {
  const { data } = await apiClient.put(`/cp/users/${id}`, payload);
  return data;
};

export const toggleUserActive = async (id: number): Promise<CPUser> => {
  const { data } = await apiClient.patch(`/cp/users/${id}/toggle-active`);
  return data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/cp/users/${id}`);
};
