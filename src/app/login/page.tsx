"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  Flame,
  Lock,
  Mail,
  User,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  AlertCircle,
  Languages,
} from "lucide-react";

import { api } from "~/trpc/react";
import { triggerHaptic } from "~/lib/haptics";
import { useI18n } from "~/i18n/context";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");
  const { status } = useSession();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: setupStatus } = api.boiler.getSetupStatus.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const { data: invitation, error: inviteError } =
    api.boiler.getInvitation.useQuery(
      { token: inviteToken! },
      {
        enabled: !!inviteToken,
        retry: false,
      },
    );

  const initialSuperAdminMutation = api.boiler.createInitialSuperAdmin.useMutation({
    onSuccess: async () => {
      triggerHaptic("success");
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res?.error) {
        router.replace("/");
      } else {
        setErrorMsg("Účet byl vytvořen. Nyní se můžete přihlásit.");
      }
    },
    onError: (err) => {
      triggerHaptic("warning");
      setErrorMsg(err.message || "Chyba při vytváření administrátora.");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const registerWithInviteMutation = api.boiler.registerWithInvitation.useMutation({
    onSuccess: async () => {
      triggerHaptic("success");
      const res = await signIn("credentials", {
        email: invitation?.email ?? email,
        password,
        redirect: false,
      });

      if (!res?.error) {
        router.replace("/");
      } else {
        router.replace("/login");
      }
    },
    onError: (err) => {
      triggerHaptic("warning");
      setErrorMsg(err.message || "Chyba při registraci.");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (invitation) {
      setEmail(invitation.email);
      if (invitation.name) setName(invitation.name);
    }
  }, [invitation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        triggerHaptic("warning");
        setErrorMsg(t.auth.invalidCredentials);
      } else {
        triggerHaptic("success");
        router.replace("/");
      }
    } catch {
      triggerHaptic("warning");
      setErrorMsg(t.auth.invalidCredentials);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    initialSuperAdminMutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken || !name || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    registerWithInviteMutation.mutate({
      token: inviteToken,
      name: name.trim(),
      password,
      avatarColor: "#f97316",
    });
  };

  const isInitialSetupMode = !!setupStatus?.needsInitialAdmin && !inviteToken;
  const isInviteMode = !!inviteToken && !inviteError;

  return (
    <div className="py-8 flex flex-col items-center justify-center min-h-[75dvh]">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-3">
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">
          {t.common.appTitle}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          {isInitialSetupMode
            ? t.auth.initialSetupSubtitle
            : isInviteMode
              ? t.auth.acceptInviteSubtitle
              : t.auth.signInSubtitle}
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-sm rounded-2xl bg-[#121215] border border-white/[0.08] p-5 shadow-xl">
        {errorMsg && (
          <div className="mb-4 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isInitialSetupMode ? (
          /* Initial Super Admin Creation */
          <form onSubmit={handleInitialSetup} className="space-y-3.5">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5 text-xs text-orange-300 flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
              <span>{t.auth.initialSetupSubtitle}</span>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {t.auth.fullName}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jan Novák"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {t.auth.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domacnost.cz"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {t.auth.password}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Alespoň 6 znaků"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all mt-2"
            >
              {isSubmitting ? t.auth.creatingAccount : t.auth.createSuperAdmin}
            </button>
          </form>
        ) : isInviteMode ? (
          /* Accept Invitation Form */
          <form onSubmit={handleAcceptInvite} className="space-y-3.5">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-xs text-blue-300 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{t.auth.acceptInviteTitle}</span>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {t.auth.email}
              </label>
              <input
                type="email"
                disabled
                value={invitation?.email ?? email}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {t.auth.fullName}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vaše jméno"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {t.auth.choosePassword}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Alespoň 6 znaků"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
            >
              {isSubmitting ? t.common.loading : t.auth.acceptInviteButton}
            </button>
          </form>
        ) : (
          /* Standard JWT Credentials Login Form */
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {t.auth.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {t.auth.password}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all mt-1"
            >
              <span>{isSubmitting ? t.auth.signingIn : t.auth.signInButton}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex justify-center items-center">
          <div className="w-6 h-6 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
