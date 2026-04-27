import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "http://localhost:4000",
  plugins: [magicLinkClient()],
}) as ReturnType<typeof createAuthClient>;
