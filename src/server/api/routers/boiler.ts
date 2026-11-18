import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { ActionType, Role } from "../../../../generated/prisma";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const boilerRouter = createTRPCRouter({
  /**
   * System setup check: determines if an initial Super Admin needs to be created.
   */
  getSetupStatus: publicProcedure.query(async ({ ctx }) => {
    const userCount = await ctx.db.user.count();
    return {
      needsInitialAdmin: userCount === 0,
    };
  }),

  /**
   * Initial setup: creates the first user as Super Admin if no users exist.
   */
  createInitialSuperAdmin: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
        email: z.string().trim().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userCount = await ctx.db.user.count();
      if (userCount > 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Initial Super Admin already exists.",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          password: hashedPassword,
          role: Role.SUPER_ADMIN,
          avatarColor: "#FF6B00",
        },
      });

      return { success: true, userId: user.id };
    }),

  /**
   * Validate an invitation token before registration.
   */
  getInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findUnique({
        where: { token: input.token },
      });

      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found.",
        });
      }

      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has already been used.",
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invitation has expired.",
        });
      }

      return invitation;
    }),

  /**
   * Register a new user using a valid invitation token.
   */
  registerWithInvitation: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        name: z.string().trim().min(2).max(50),
        password: z.string().min(6, "Password must be at least 6 characters"),
        avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FF6B00"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findUnique({
        where: { token: input.token },
      });

      if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired invitation token.",
        });
      }

      const existingUser = await ctx.db.user.findUnique({
        where: { email: invitation.email.toLowerCase() },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists.",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: invitation.email.toLowerCase(),
          password: hashedPassword,
          role: invitation.role,
          avatarColor: input.avatarColor,
          invitedById: invitation.createdById,
        },
      });

      await ctx.db.invitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
        },
      });

      return { success: true, userId: user.id };
    }),

  /**
   * Main dashboard query: boiler state, timer settings, recent logs, current user info.
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    let settings = await ctx.db.boilerSettings.findUnique({
      where: { id: "main" },
    });

    if (!settings) {
      settings = await ctx.db.boilerSettings.create({
        data: {
          id: "main",
          stokeMinutes: 180,
        },
      });
    }

    let state = await ctx.db.boilerState.findUnique({
      where: { id: "main" },
    });

    if (!state) {
      state = await ctx.db.boilerState.create({
        data: {
          id: "main",
          lastActionType: ActionType.OUT,
          lastUserName: "Nobody",
          lastFuelAt: null,
          nextCheckAt: null,
          note: "Vítejte v Kotelně!",
        },
      });
    }

    const recentLogs = await ctx.db.boilerLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarColor: true,
          },
        },
      },
    });

    return {
      state,
      settings,
      recentLogs,
      currentUser: ctx.session.user,
    };
  }),

  /**
   * Log an action (STOKE, ASH, OUT).
   */
  logAction: protectedProcedure
    .input(
      z.object({
        actionType: z.enum(["STOKE", "ASH", "OUT"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const userName = ctx.session.user.name ?? "Unknown";
      const userId = ctx.session.user.id;
      const actionType = input.actionType as ActionType;

      let settings = await ctx.db.boilerSettings.findUnique({
        where: { id: "main" },
      });

      if (!settings) {
        settings = await ctx.db.boilerSettings.create({
          data: {
            id: "main",
            stokeMinutes: 180,
          },
        });
      }

      const durationMinutes =
        actionType === ActionType.STOKE ? settings.stokeMinutes : 0;

      // 1. Record log in history
      const log = await ctx.db.boilerLog.create({
        data: {
          userId,
          userName,
          actionType,
          durationMinutes,
          createdAt: now,
        },
      });

      // 2. Update BoilerState
      if (actionType === ActionType.STOKE) {
        const nextCheckAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
        await ctx.db.boilerState.upsert({
          where: { id: "main" },
          update: {
            lastActionType: ActionType.STOKE,
            lastUserName: userName,
            lastFuelAt: now,
            nextCheckAt,
          },
          create: {
            id: "main",
            lastActionType: ActionType.STOKE,
            lastUserName: userName,
            lastFuelAt: now,
            nextCheckAt,
          },
        });
      } else if (actionType === ActionType.ASH) {
        // Ash emptying leaves countdown and fuel time untouched!
        await ctx.db.boilerState.upsert({
          where: { id: "main" },
          update: {
            lastActionType: ActionType.ASH,
            lastUserName: userName,
          },
          create: {
            id: "main",
            lastActionType: ActionType.ASH,
            lastUserName: userName,
          },
        });
      } else if (actionType === ActionType.OUT) {
        // Extinguished stops countdown (nextCheckAt = null)
        await ctx.db.boilerState.upsert({
          where: { id: "main" },
          update: {
            lastActionType: ActionType.OUT,
            lastUserName: userName,
            nextCheckAt: null,
          },
          create: {
            id: "main",
            lastActionType: ActionType.OUT,
            lastUserName: userName,
            nextCheckAt: null,
          },
        });
      }

      return { success: true, log };
    }),

  /**
   * Update message on boiler notice board.
   */
  updateNote: protectedProcedure
    .input(
      z.object({
        note: z.string().max(300),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.boilerState.upsert({
        where: { id: "main" },
        update: {
          note: input.note.trim(),
        },
        create: {
          id: "main",
          note: input.note.trim(),
        },
      });

      return { success: true, note: updated.note };
    }),

  /**
   * History and stoker leaderboard.
   */
  getHistoryAndStats: protectedProcedure
    .input(
      z.object({
        period: z.enum(["week", "month", "season"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let startDate: Date;

      if (input.period === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (input.period === "month") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        const currentYear = now.getFullYear();
        const seasonStartYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
        startDate = new Date(seasonStartYear, 8, 1);
      }

      const logs = await ctx.db.boilerLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarColor: true,
            },
          },
        },
      });

      const users = await ctx.db.user.findMany();
      const userMap = new Map(users.map((u) => [u.id, u]));

      const statsMap = new Map<
        string,
        {
          userId: string;
          userName: string;
          avatarColor: string;
          totalFuels: number;
          ashCount: number;
          totalActions: number;
        }
      >();

      for (const u of users) {
        statsMap.set(u.id, {
          userId: u.id,
          userName: u.name,
          avatarColor: u.avatarColor,
          totalFuels: 0,
          ashCount: 0,
          totalActions: 0,
        });
      }

      for (const log of logs) {
        let entry = statsMap.get(log.userId);
        if (!entry) {
          const userObj = userMap.get(log.userId);
          entry = {
            userId: log.userId,
            userName: log.userName,
            avatarColor: userObj?.avatarColor ?? "#FF6B00",
            totalFuels: 0,
            ashCount: 0,
            totalActions: 0,
          };
          statsMap.set(log.userId, entry);
        }

        entry.totalActions += 1;

        if (
          log.actionType === ActionType.STOKE ||
          log.actionType === ActionType.WOOD ||
          log.actionType === ActionType.COAL ||
          log.actionType === ActionType.NIGHT
        ) {
          entry.totalFuels += 1;
        } else if (log.actionType === ActionType.ASH) {
          entry.ashCount += 1;
        }
      }

      const leaderboard = Array.from(statsMap.values()).sort(
        (a, b) => b.totalFuels + b.ashCount - (a.totalFuels + a.ashCount),
      );

      return {
        logs,
        leaderboard,
        period: input.period,
        startDate,
      };
    }),

  /**
   * Delete a log entry (undo misclick).
   */
  deleteLog: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const log = await ctx.db.boilerLog.findUnique({
        where: { id: input.id },
      });

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Log entry not found.",
        });
      }

      await ctx.db.boilerLog.delete({
        where: { id: input.id },
      });

      // Recalculate latest state if deleted log was the latest
      const latestLog = await ctx.db.boilerLog.findFirst({
        orderBy: { createdAt: "desc" },
      });

      if (latestLog) {
        let nextCheckAt: Date | null = null;
        if (
          latestLog.actionType === ActionType.STOKE ||
          latestLog.actionType === ActionType.WOOD ||
          latestLog.actionType === ActionType.COAL ||
          latestLog.actionType === ActionType.NIGHT
        ) {
          nextCheckAt = new Date(
            latestLog.createdAt.getTime() + latestLog.durationMinutes * 60 * 1000,
          );
        }

        await ctx.db.boilerState.update({
          where: { id: "main" },
          data: {
            lastActionType: latestLog.actionType,
            lastUserName: latestLog.userName,
            ...(latestLog.actionType === ActionType.OUT
              ? { nextCheckAt: null }
              : nextCheckAt
                ? { lastFuelAt: latestLog.createdAt, nextCheckAt }
                : {}),
          },
        });
      }

      return { success: true };
    }),

  /**
   * Update stoking countdown duration (Admin only).
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        stokeMinutes: z.number().min(15).max(720),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== "SUPER_ADMIN" &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pouze správce může upravovat délku odpočtu.",
        });
      }

      const settings = await ctx.db.boilerSettings.upsert({
        where: { id: "main" },
        update: {
          stokeMinutes: input.stokeMinutes,
        },
        create: {
          id: "main",
          stokeMinutes: input.stokeMinutes,
        },
      });

      return { success: true, settings };
    }),

  // =========================================================================
  // ORGANIZATION & SUPER ADMIN PROCEDURES
  // =========================================================================

  /**
   * Get organization members and active invitations.
   */
  getOrganization: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarColor: true,
        createdAt: true,
      },
    });

    const isAuthorized =
      ctx.session.user.role === "SUPER_ADMIN" || ctx.session.user.role === "ADMIN";

    let invitations: Array<{
      id: string;
      email: string;
      token: string;
      role: Role;
      name: string | null;
      expiresAt: Date;
      createdAt: Date;
    }> = [];

    if (isAuthorized) {
      invitations = await ctx.db.invitation.findMany({
        where: {
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          token: true,
          role: true,
          name: true,
          expiresAt: true,
          createdAt: true,
        },
      });
    }

    return {
      users,
      invitations,
      isSuperAdmin: ctx.session.user.role === "SUPER_ADMIN",
      isAdmin: isAuthorized,
    };
  }),

  /**
   * Super Admin / Admin creates an invitation link for a new member.
   */
  inviteMember: protectedProcedure
    .input(
      z.object({
        email: z.string().trim().email("Neplatná e-mailová adresa"),
        role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
        name: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== "SUPER_ADMIN" &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pouze správce může zvát nové členy.",
        });
      }

      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Uživatel s tímto e-mailem již existuje.",
        });
      }

      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await ctx.db.invitation.create({
        data: {
          email: input.email.toLowerCase(),
          token,
          role: input.role as Role,
          name: input.name,
          createdById: ctx.session.user.id,
          expiresAt,
        },
      });

      return {
        success: true,
        token: invitation.token,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      };
    }),

  /**
   * Revoke a pending invitation.
   */
  revokeInvitation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== "SUPER_ADMIN" &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nedostatečná oprávnění.",
        });
      }

      await ctx.db.invitation.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Super Admin can change another user's role.
   */
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["SUPER_ADMIN", "ADMIN", "MEMBER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pouze hlavní správce může měnit role.",
        });
      }

      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nemůžete změnit svou vlastní roli.",
        });
      }

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role as Role },
      });

      return { success: true };
    }),

  /**
   * Remove a member from the organization.
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== "SUPER_ADMIN" &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nedostatečná oprávnění.",
        });
      }

      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nemůžete odebrat sami sebe.",
        });
      }

      const targetUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (targetUser?.role === "SUPER_ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Hlavního správce nelze odebrat.",
        });
      }

      await ctx.db.user.delete({
        where: { id: input.userId },
      });

      return { success: true };
    }),
});
