import { boilerRouter } from "~/server/api/routers/boiler";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * Primární tRPC router pro aplikaci Kotelna.
 */
export const appRouter = createTRPCRouter({
  boiler: boilerRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
