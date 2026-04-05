'use client';

import { create } from "zustand";

export type ToastKind = "success" | "error" | "info";

export type ToastMessage = {
  id: string;
  title?: string;
  message: string;
  type: ToastKind;
};

type ToastState = {
  toasts: ToastMessage[];
  push: (toast: Omit<ToastMessage, "id"> & { id?: string }) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id: toast.id ?? makeId(),
          ...toast,
        },
      ],
    })),
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clear: () => set({ toasts: [] }),
}));
