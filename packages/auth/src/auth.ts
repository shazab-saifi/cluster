import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@workspace/db";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
        input: false,
      },
    },
  },
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
  plugins: [
    magicLink({
      expiresIn: 300,
      sendMagicLink: async ({ email, url }) => {
        const { error } = await resend.emails.send({
          from: "Cluster <onboarding@shazab.site>",
          to: email,
          subject: "Your Cluster Sign-In Link",
          html: `<a href="${url}">Sign in</a>`,
        });

        console.error(error);
      },
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
            baseIdentifier =
              user.email.split("@")[0]?.toLowerCase() ?? "John Doe";
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
