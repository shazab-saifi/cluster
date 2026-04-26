import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@workspace/db";
import { generateRandomCharStr } from "./utils";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  trustedOrigins: [
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://cluster.shazab.site",
  ],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const username =
            user.name.split(" ")[0]?.toLowerCase() + generateRandomCharStr();
          return {
            data: {
              ...user,
              username: username,
            },
          };
        },
      },
    },
  },
});
