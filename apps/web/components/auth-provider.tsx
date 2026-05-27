"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const PUBLIC_PATHS = new Set(["/signin", "/signup"]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = authClient.useSession();

  const isPublicPath = PUBLIC_PATHS.has(pathname);
  const isPending = session.isPending;
  const isAuthenticated = Boolean(session.data?.user);

  React.useEffect(() => {
    if (!isPending && !isAuthenticated && !isPublicPath) {
      router.replace("/signin");
    }
  }, [isAuthenticated, isPending, isPublicPath, router]);

  if (!isPublicPath && (isPending || !isAuthenticated)) {
    return (
      <main className="grid min-h-svh place-items-center bg-background text-sm text-muted-foreground">
        Loading
      </main>
    );
  }

  return children;
}
