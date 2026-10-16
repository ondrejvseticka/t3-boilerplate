import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * Returns the currently authenticated NextAuth session user, cached per request.
 * Useful in React Server Components and Server Actions.
 */
export const getSessionUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

/**
 * Fetches the full database User record for the currently authenticated session user.
 */
export const getCurrentDbUser = cache(async () => {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) return null;

  return db.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
  });
});

/**
 * Asserts authentication in Server Components or Server Actions.
 * Redirects to sign-in page if user is not authenticated.
 */
export async function requireAuth(redirectTo = "/auth/signin") {
  const user = await getSessionUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}
