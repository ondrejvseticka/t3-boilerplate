"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginSchema, type LoginInput } from "~/lib/auth-schemas";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const urlError = searchParams.get("error");
  const registered = searchParams.get("registered");

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    urlError ? "Authentication failed. Please check your credentials or try again." : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberDevice: true,
    },
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (res?.error) {
        setServerError("Invalid email or password. Please try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Welcome back
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Log in to your account with your email and password.
        </p>
      </div>

      {registered && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          Account created successfully! Please sign in with your credentials.
        </div>
      )}

      {/* Server Error notification */}
      {serverError && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* React Hook Form with Zod */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Work email
          </label>
          <div
            className={`flex items-center rounded-xl border bg-zinc-900/60 px-3.5 py-2.5 transition shadow-inner ${
              errors.email
                ? "border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/30"
                : "border-zinc-800 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30"
            }`}
          >
            <Mail className="h-4 w-4 text-zinc-500 mr-2.5 shrink-0" />
            <input
              type="email"
              autoComplete="email"
              placeholder="developer@company.com"
              {...register("email")}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-300">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-zinc-400 hover:text-purple-400 transition"
            >
              Forgot password?
            </Link>
          </div>
          <div
            className={`flex items-center rounded-xl border bg-zinc-900/60 px-3.5 py-2.5 transition shadow-inner ${
              errors.password
                ? "border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/30"
                : "border-zinc-800 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30"
            }`}
          >
            <Lock className="h-4 w-4 text-zinc-500 mr-2.5 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              {...register("password")}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-zinc-500 hover:text-zinc-300 transition shrink-0 ml-2"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-300 select-none">
            <input
              type="checkbox"
              {...register("rememberDevice")}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500/40 accent-purple-600"
            />
            <span>Remember this device for 30 days</span>
          </label>
        </div>

        {/* Glowing Gradient Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#D946EF] py-3 px-4 font-semibold text-sm text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
          >
            <span>{isSubmitting ? "Signing In..." : "Sign In with Email"}</span>
            <span className="text-base leading-none">→</span>
          </button>
        </div>

        {/*
          // More providers in here e.g.
          // <button onClick={() => signIn("github")}>Sign In with GitHub</button>
          // <button onClick={() => signIn("google")}>Sign In with Google</button>
        */}
      </form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
          Loading sign in...
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
