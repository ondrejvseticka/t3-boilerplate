"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AuthFooterPrompt() {
  const pathname = usePathname();

  if (pathname === "/auth/register" || pathname === "/auth/signup") {
    return (
      <div className="text-xs text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-white hover:text-purple-300 hover:underline transition"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (pathname === "/auth/forgot-password") {
    return (
      <div className="text-xs text-zinc-400">
        Remembered password?{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-white hover:text-purple-300 hover:underline transition"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (pathname === "/auth/reset-password") {
    return (
      <div className="text-xs text-zinc-400">
        Need assistance?{" "}
        <Link
          href="/auth/signin"
          className="font-medium text-white hover:text-purple-300 hover:underline transition"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="text-xs text-zinc-400">
      Don&apos;t have an account?{" "}
      <Link
        href="/auth/register"
        className="font-medium text-white hover:text-purple-300 hover:underline transition"
      >
        Sign up for free
      </Link>
    </div>
  );
}
