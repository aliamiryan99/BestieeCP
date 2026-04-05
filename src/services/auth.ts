import { apiClient, extractApiError, setAuthToken } from "@/lib/apiClient";
import { CPUser } from "@/types/cp";

export type LoginPayload = { phone: string; password: string };
export type AuthSuccessResponse = { user: CPUser; token: string };

export const login = async (
  payload: LoginPayload
): Promise<AuthSuccessResponse> => {
  const { data } = await apiClient.post<AuthSuccessResponse>(
    "/cp/auth/login",
    payload
  );
  setAuthToken(data.token);
  return data;
};

export const fetchProfile = async (): Promise<CPUser> => {
  const { data } = await apiClient.get<CPUser>("/cp/auth/me");
  return data;
};

export const updateProfile = async (
  payload: Partial<
    Pick<CPUser, "name" | "email" | "birthdate" | "address"> & {
      password?: string;
    }
  >
): Promise<CPUser> => {
  const { data } = await apiClient.put<CPUser>("/cp/auth/me", payload);
  return data;
};

export { extractApiError as getAuthError }; // re-export for convenience
