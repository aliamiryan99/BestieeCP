import axios, { AxiosError, AxiosHeaders } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

let authToken: string | null =
  typeof window !== "undefined"
    ? window.localStorage.getItem("cp_token")
    : null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      window.localStorage.setItem("cp_token", token);
    } else {
      window.localStorage.removeItem("cp_token");
    }
  }
};

export const getAuthToken = () => authToken;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token =
    authToken ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("cp_token")
      : null);

  if (token) {
    const headers = AxiosHeaders.from(config.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

export const extractApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const err = error as AxiosError<{ error?: string; message?: string }>;
    return (
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "مشکل در ارتباط با سرور"
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "خطای ناشناخته";
};
