import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string;
      email: string;
      role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
      avatarColor: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
    avatarColor?: string;
  }
}

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password.");
        }

        const isPasswordValid = await bcrypt.compare(
          parsed.data.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as "SUPER_ADMIN" | "ADMIN" | "MEMBER",
          avatarColor: user.avatarColor,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as { role?: string }).role ?? "MEMBER";
        token.avatarColor = (user as { avatarColor?: string }).avatarColor ?? "#FF6B00";
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: (token.id as string) ?? session.user.id,
        name: (token.name as string) ?? (session.user.name ?? "User"),
        email: (token.email as string) ?? session.user.email,
        role: ((token.role as "SUPER_ADMIN" | "ADMIN" | "MEMBER") ?? "MEMBER"),
        avatarColor: (token.avatarColor as string) ?? "#FF6B00",
      },
    }),
  },
} satisfies NextAuthConfig;
