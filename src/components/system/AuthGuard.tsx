"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";

type Props = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const shouldProtect = useMemo(
    () => pathname !== "/login",
    [pathname]
  );

  useEffect(() => {
    let tokenFound = false;
    try {
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("convexAuth") || key.includes("bestieeauth"))) {
            if (localStorage.getItem(key)) {
              tokenFound = true;
              break;
            }
          }
        }
        if (!tokenFound && (document.cookie.includes("convexAuth") || document.cookie.includes("bestieeauth"))) {
          tokenFound = true;
        }
      }
    } catch (e) {
      console.error("Error checking token in AuthGuard:", e);
    }
    setHasToken(tokenFound);
  }, []);

  useEffect(() => {
    if (!shouldProtect) return;
    
    // If we know for sure there is no token, redirect immediately (0ms delay)
    if (hasToken === false) {
      router.replace("/login");
      return;
    }

    // Otherwise, wait for Convex to resolve the state
    if (hasToken === true && !isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router, shouldProtect, hasToken]);

  // We only show loading state if they have a token and we are waiting for Convex to verify it
  if (shouldProtect && (hasToken === null || (hasToken === true && isLoading))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        در حال بررسی وضعیت ورود...
      </div>
    );
  }

  return <>{children}</>;
}
