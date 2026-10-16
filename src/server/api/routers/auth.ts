import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { passwordSchema } from "~/lib/auth-schemas";
import { sendWelcomeEmail, sendPasswordResetEmail } from "~/server/email";
import { checkRateLimit } from "~/server/security/rate-limit";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Full name must be at least 2 characters").max(50),
        email: z.string().trim().email("Invalid email address"),
        password: passwordSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting: max 10 registrations per 15 minutes per IP/identifier
      const clientIp = ctx.headers.get("x-forwarded-for") ?? "unknown-client";
      const rateLimit = checkRateLimit({
        identifier: `register:${clientIp}`,
        limit: 10,
        windowMs: 15 * 60 * 1000,
      });

      if (!rateLimit.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many registration attempts. Please wait a few minutes before trying again.",
        });
      }

      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const origin =
        ctx.headers.get("origin") ??
        ctx.headers.get("host")?.replace(/^/, "http://") ??
        "http://localhost:3000";

      // Send welcome email in background
      void sendWelcomeEmail({
        to: input.email,
        name: user.name ?? undefined,
        dashboardUrl: `${origin}/dashboard`,
      }).catch((err) => {
        console.error("[Welcome Email Error]:", err);
      });

      return { user };
    }),

  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().trim().email("Please enter a valid email address"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limiting: max 3 password reset requests per 15 minutes per email
      const rateLimit = checkRateLimit({
        identifier: `forgot-pw:${input.email}`,
        limit: 3,
        windowMs: 15 * 60 * 1000,
      });

      if (!rateLimit.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many password reset requests for this email. Please try again later.",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      // Avoid account enumeration: always return success to the frontend
      if (!user) {
        return {
          success: true,
          message: "If an account exists with that email, a password reset link has been sent.",
        };
      }

      // Invalidate existing tokens for this email and delete expired tokens
      await ctx.db.passwordResetToken.deleteMany({
        where: {
          OR: [
            { email: input.email },
            { expires: { lt: new Date() } },
          ],
        },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await ctx.db.passwordResetToken.create({
        data: {
          email: input.email,
          token,
          expires,
        },
      });

      const origin =
        ctx.headers.get("origin") ??
        ctx.headers.get("host")?.replace(/^/, "http://") ??
        "http://localhost:3000";
      const resetUrl = `${origin}/auth/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        to: input.email,
        resetUrl,
      });

      return {
        success: true,
        message: "If an account exists with that email, a password reset link has been sent.",
      };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Reset token is required"),
        password: passwordSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const resetRecord = await ctx.db.passwordResetToken.findUnique({
        where: { token: input.token },
      });

      if (!resetRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired password reset link.",
        });
      }

      if (resetRecord.expires < new Date()) {
        await ctx.db.passwordResetToken.delete({
          where: { id: resetRecord.id },
        });

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This reset link has expired. Please request a new one.",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { email: resetRecord.email },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user found associated with this reset link.",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      await ctx.db.user.update({
        where: { email: resetRecord.email },
        data: { password: hashedPassword },
      });

      await ctx.db.passwordResetToken.deleteMany({
        where: { email: resetRecord.email },
      });

      return { success: true };
    }),
});
