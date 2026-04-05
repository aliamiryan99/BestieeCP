'use client';

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";

type Props = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useConvexAuth();

  const shouldProtect = useMemo(
    () => pathname !== "/login",
    [pathname]
  );

  useEffect(() => {
    if (!shouldProtect) return;
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router, shouldProtect]);

  if (shouldProtect && isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        در حال بررسی وضعیت ورود...
      </div>
    );
  }

  return <>{children}</>;
}
