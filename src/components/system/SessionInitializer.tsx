'use client';

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function SessionInitializer() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
