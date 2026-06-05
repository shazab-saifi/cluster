import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { API_BASE_URL } from "@/lib/utils";

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [magicLinkClient()],
}) as ReturnType<typeof createAuthClient>;
