"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, AlertCircle, Loader2 } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "~/lib/auth-schemas";
import { api } from "~/trpc/react";

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const forgotMutation = api.auth.forgotPassword.useMutation();

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotMutation.mutate({ email: data.email });
  };

  return (
    <div>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Forgot password?
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Enter your work email and we&apos;ll send you a secure link to reset your account credentials.
        </p>
      </div>

      {forgotMutation.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{forgotMutation.error.message}</span>
        </div>
      )}

      {forgotMutation.isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-400 space-y-2">
            <p className="font-semibold text-emerald-300">Check your inbox</p>
            <p className="text-zinc-300">
              If an account exists for <strong className="text-white">{forgotMutation.variables?.email}</strong>, you will receive an email with password reset instructions shortly.
            </p>
          </div>
          <Link
            href="/auth/signin"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#D946EF] py-3 px-4 font-semibold text-sm text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:brightness-105 active:scale-[0.99] transition"
          >
            <span>Back to sign in</span>
            <span>→</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={forgotMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#D946EF] py-3 px-4 font-semibold text-sm text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
            >
              {forgotMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <span className="text-base leading-none">→</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/auth/signin"
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              ← Return to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
