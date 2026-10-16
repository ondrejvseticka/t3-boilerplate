"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordInput } from "~/lib/auth-schemas";
import { PasswordStrengthMeter } from "~/components/password-strength-meter";
import { api } from "~/trpc/react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const watchedPassword = useWatch({ control, name: "password", defaultValue: "" });

  const resetMutation = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2500);
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    if (!token) return;
    resetMutation.mutate({
      token,
      password: data.password,
    });
  };

  const isPending = resetMutation.isPending;

  return (
    <div>
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Set new password
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Please enter and confirm your new secure password.
        </p>
      </div>

      {!token && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Missing or invalid password reset token.</span>
        </div>
      )}

      {resetMutation.error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{resetMutation.error.message}</span>
        </div>
      )}

      {resetMutation.isSuccess ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-400 space-y-2">
            <p className="font-semibold text-emerald-300">Password successfully reset!</p>
            <p className="text-zinc-300">
              Your password has been updated. Redirecting to the login screen...
            </p>
          </div>
          <Link
            href="/auth/signin"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#D946EF] py-3 px-4 font-semibold text-sm text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:brightness-105 active:scale-[0.99] transition"
          >
            <span>Continue to sign in</span>
            <span>→</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              New password
            </label>
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
                autoComplete="new-password"
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
            <PasswordStrengthMeter password={watchedPassword ?? ""} />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Confirm new password
            </label>
            <div
              className={`flex items-center rounded-xl border bg-zinc-900/60 px-3.5 py-2.5 transition shadow-inner ${
                errors.confirmPassword
                  ? "border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/30"
                  : "border-zinc-800 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30"
              }`}
            >
              <Lock className="h-4 w-4 text-zinc-500 mr-2.5 shrink-0" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••••••"
                {...register("confirmPassword")}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-zinc-500 hover:text-zinc-300 transition shrink-0 ml-2"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || !token}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#D946EF] py-3 px-4 font-semibold text-sm text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resetting password...</span>
                </>
              ) : (
                <>
                  <span>Set New Password</span>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
          Loading reset password...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
