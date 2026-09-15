import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@workspace/db";
import { username } from "better-auth/plugins";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function sendClusterEmail(
  payload: Parameters<typeof resend.emails.send>[0]
): void {
  resend.emails.send(payload).then(
    ({ error }) => {
      if (error) {
        console.error("[cluster-auth] Failed to send email:", error);
      }
    },
    (error: unknown) => {
      console.error("[cluster-auth] Failed to send email:", error);
    }
  );
}

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
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      sendClusterEmail({
        from: "Cluster <onboarding@shazab.site>",
        to: user.email,
        subject: "Reset your Cluster password",
        html: `<a href="${url}">Reset your password</a>`,
      });
    },
  },
  user: {
    additionalFields: {
      bio: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  plugins: [
    username({
      usernameValidator: (username) => /^@[a-zA-Z0-9_.]+$/.test(username),
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.username) return;
          let baseIdentifier = "user";

          if (user.name) {
            baseIdentifier = user.name.replace(/\s+/g, "").toLowerCase();
          } else if (user.email) {
            baseIdentifier = user.email.split("@")[0]?.toLowerCase() ?? "user";
          }

          const random = Math.floor(Math.random() * 9999);
          const autoUsername = `@${baseIdentifier}${random}`;

          return {
            data: {
              ...user,
              username: autoUsername,
            },
          };
        },
      },
    },
  },
});
