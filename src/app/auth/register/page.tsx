"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "~/lib/auth-schemas";
import { PasswordStrengthMeter } from "~/components/password-strength-meter";
import { api } from "~/trpc/react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      agreed: true,
    },
    mode: "onChange",
  });

  const watchedPassword = useWatch({ control, name: "password", defaultValue: "" });

  const registerMutation = api.auth.register.useMutation({
    onSuccess: async (_, variables) => {
      // Automatically log the newly registered user in via NextAuth credentials
      const res = await signIn("credentials", {
        redirect: false,
        email: variables.email,
        password: variables.password,
        callbackUrl,
      });

      if (res?.error) {
        router.push("/auth/signin?registered=true");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    },
  });

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
    });
  };

  const isPending = registerMutation.isPending;

  return (
    <div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Create your account
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Sign up with your work email and choose a secure password.
        </p>
      </div>

      {/* Mutation Error Notification */}
      {registerMutation.error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{registerMutation.error.message}</span>
        </div>
      )}

      {/* React Hook Form with Zod Validation + tRPC Mutation */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Full name
          </label>
          <div
            className={`flex items-center rounded-xl border bg-zinc-900/60 px-3.5 py-2.5 transition shadow-inner ${
              errors.name
                ? "border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/30"
                : "border-zinc-800 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/30"
            }`}
          >
            <User className="h-4 w-4 text-zinc-500 mr-2.5 shrink-0" />
            <input
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              {...register("name")}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>
          )}
        </div>

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
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Password
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
              placeholder="Create a strong password"
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

          {/* Interactive Password Strength Indicator */}
          <PasswordStrengthMeter password={watchedPassword ?? ""} />

          {errors.password && (
            <p className="mt-2 text-xs text-rose-400 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Terms agreement */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-400 select-none">
            <input
              type="checkbox"
              {...register("agreed")}
              className="h-4 w-4 mt-0.5 rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500/40 accent-purple-600 shrink-0"
            />
            <span>
              I agree to the{" "}
              <Link href="#" className="text-zinc-300 underline hover:text-white">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-zinc-300 underline hover:text-white">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.agreed && (
            <p className="mt-1 text-xs text-rose-400">{errors.agreed.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9333EA] via-[#A855F7] to-[#D946EF] py-3 px-4 font-semibold text-sm text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <span className="text-base leading-none">→</span>
              </>
            )}
          </button>
        </div>

        {/*
          // More providers in here e.g.
          // <button onClick={() => signIn("github")}>Sign Up with GitHub</button>
          // <button onClick={() => signIn("google")}>Sign Up with Google</button>
        */}
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
          Loading registration...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
