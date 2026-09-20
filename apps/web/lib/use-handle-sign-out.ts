"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function useHandleSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async () => {
    const { error } = await authClient.signOut();

    if (error) {
      console.error(error);
      return;
    }

    queryClient.removeQueries({
      predicate: (query) => query.meta?.requiresAuth === true,
    });

    router.replace("/signin");
    router.refresh();
  };
}
