import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { API_BASE_URL } from "@/lib/utils";

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/auth`,
  plugins: [
    usernameClient(),
    inferAdditionalFields({
      user: {
        bio: {
          type: "string",
          required: false,
          input: true,
        },
      },
    }),
  ],
});
