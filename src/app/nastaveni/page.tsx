"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Check,
  Copy,
  LogOut,
  Minus,
  Plus,
  Save,
  Trash2,
  UserPlus,
  X,
  Smartphone,
  Flame,
} from "lucide-react";

import { api } from "~/trpc/react";
import { triggerHaptic } from "~/lib/haptics";
import { useI18n } from "~/i18n/context";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();
  const utils = api.useUtils();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const { data: dashboardData } = api.boiler.getDashboard.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const { data: orgData } = api.boiler.getOrganization.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const [stokeMinutes, setStokeMinutes] = useState(180);
  const [hasTimerChanges, setHasTimerChanges] = useState(false);

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (dashboardData?.settings) {
      setStokeMinutes(dashboardData.settings.stokeMinutes);
    }
  }, [dashboardData?.settings]);

  const settingsMutation = api.boiler.updateSettings.useMutation({
    onSuccess: async () => {
      triggerHaptic("success");
      setHasTimerChanges(false);
      await utils.boiler.getDashboard.invalidate();
    },
    onError: (err) => {
      triggerHaptic("warning");
      alert(err.message);
    },
  });

  const inviteMutation = api.boiler.inviteMember.useMutation({
    onSuccess: (data) => {
      triggerHaptic("success");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullLink = `${origin}/login?token=${data.token}`;
      setGeneratedInviteLink(fullLink);
      setInviteError(null);
      void utils.boiler.getOrganization.invalidate();
    },
    onError: (err) => {
      triggerHaptic("warning");
      setInviteError(err.message || "Chyba při vytváření pozvánky.");
    },
  });

  const revokeMutation = api.boiler.revokeInvitation.useMutation({
    onSuccess: async () => {
      triggerHaptic("medium");
      await utils.boiler.getOrganization.invalidate();
    },
  });

  const removeMemberMutation = api.boiler.removeMember.useMutation({
    onSuccess: async () => {
      triggerHaptic("medium");
      await utils.boiler.getOrganization.invalidate();
    },
    onError: (err) => {
      triggerHaptic("warning");
      alert(err.message);
    },
  });

  const updateRoleMutation = api.boiler.updateUserRole.useMutation({
    onSuccess: async () => {
      triggerHaptic("success");
      await utils.boiler.getOrganization.invalidate();
    },
  });

  const handleTimerStep = (delta: number) => {
    triggerHaptic("light");
    setHasTimerChanges(true);
    setStokeMinutes((prev) => Math.max(15, Math.min(720, prev + delta)));
  };

  const handleCopyLink = async (link: string) => {
    triggerHaptic("light");
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isAdmin = isSuperAdmin || session?.user?.role === "ADMIN";

  return (
    <div className="space-y-5 pb-6">
      <h2 className="text-lg font-semibold tracking-tight text-white">
        {t.settings.title}
      </h2>

      {/* Responsive Grid Layout (Desktop 2 Columns / Mobile 1 Column) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT COLUMN (TIMER SETTING & SYSTEM INFO)
            ========================================================================= */}
        <div className="md:col-span-6 space-y-4">
          {/* Stoking Duration (Admin configurable) */}
          <section className="rounded-2xl bg-[#121215] border border-white/[0.07] p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-zinc-200">
                  {t.settings.durationTitle}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {t.settings.durationSubtitle}
                </p>
              </div>
              {hasTimerChanges && (
                <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                  {t.settings.unsavedChanges}
                </span>
              )}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  {t.boiler.stokedTitle}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {stokeMinutes} {t.settings.minutesUnit} ({(stokeMinutes / 60).toFixed(1)} {t.settings.hoursUnit})
                </p>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTimerStep(-15)}
                    className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center font-bold"
                    aria-label="Ubrat 15 minut"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-14 text-center font-mono text-sm font-semibold text-orange-400">
                    {stokeMinutes}m
                  </span>
                  <button
                    type="button"
                    onClick={() => handleTimerStep(15)}
                    className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white flex items-center justify-center font-bold"
                    aria-label="Přidat 15 minut"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="text-sm font-mono font-semibold text-orange-400">
                  {stokeMinutes} min
                </span>
              )}
            </div>

            {hasTimerChanges && isAdmin && (
              <button
                type="button"
                onClick={() => settingsMutation.mutate({ stokeMinutes })}
                disabled={settingsMutation.isPending}
                className="w-full h-10 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-98 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all mt-1"
              >
                <Save className="w-3.5 h-3.5" />
                {t.settings.saveDurations}
              </button>
            )}
          </section>

          {/* iOS PWA Instructions */}
          <section className="rounded-2xl bg-[#121215] border border-white/[0.07] p-4 space-y-1.5 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-orange-400" />
              {t.settings.pwaTitle}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {t.settings.pwaDesc}
            </p>
          </section>

          {/* System Info & Sign out */}
          <section className="rounded-2xl bg-[#121215] border border-white/[0.07] p-4 space-y-2.5 text-xs shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span>{t.settings.appVersionLabel}</span>
              <span className="font-mono text-zinc-300">v1.0.0</span>
            </div>

            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t.common.signOut}
              </button>
            </div>
          </section>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (ORGANIZATION & MEMBERSHIP MANAGEMENT)
            ========================================================================= */}
        <div className="md:col-span-6 space-y-4">
          <section className="rounded-2xl bg-[#121215] border border-white/[0.07] p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-zinc-200">
                  {t.settings.orgTitle}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {t.settings.orgSubtitle}
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsInviteModalOpen(true);
                    setGeneratedInviteLink(null);
                    setInviteError(null);
                  }}
                  className="text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5 text-orange-400" />
                  {t.settings.inviteMember}
                </button>
              )}
            </div>

            {/* Member rows */}
            <div className="space-y-1.5">
              {orgData?.users.map((member) => {
                const isSelf = session?.user?.id === member.id;
                return (
                  <div
                    key={member.id}
                    className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-white truncate leading-tight">
                          {member.name} {isSelf && `(${t.common.you})`}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {isSuperAdmin && !isSelf && member.role !== "SUPER_ADMIN" ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              userId: member.id,
                              role: e.target.value as "ADMIN" | "MEMBER",
                            })
                          }
                          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] rounded-md px-2 py-1 focus:outline-none"
                        >
                          <option value="MEMBER">Člen</option>
                          <option value="ADMIN">Správce</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                          {member.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : member.role === "ADMIN"
                              ? "Správce"
                              : "Člen"}
                        </span>
                      )}

                      {isAdmin && !isSelf && member.role !== "SUPER_ADMIN" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`${t.common.confirmDelete}`)) {
                              removeMemberMutation.mutate({ userId: member.id });
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                          title={t.common.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pending Invitations */}
            {isAdmin && orgData?.invitations && orgData.invitations.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/60 space-y-2">
                <h4 className="text-[11px] font-semibold text-zinc-400">
                  {t.settings.pendingInvites} ({orgData.invitations.length})
                </h4>

                <div className="space-y-1.5">
                  {orgData.invitations.map((inv) => {
                    const origin =
                      typeof window !== "undefined" ? window.location.origin : "";
                    const link = `${origin}/login?token=${inv.token}`;
                    return (
                      <div
                        key={inv.id}
                        className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="truncate mr-2">
                          <p className="font-medium text-zinc-300 truncate">{inv.email}</p>
                          <p className="text-[10px] text-zinc-400">
                            {t.settings.expires}:{" "}
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(link)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-[10px] font-medium flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            {t.common.copy}
                          </button>
                          <button
                            type="button"
                            onClick={() => revokeMutation.mutate({ id: inv.id })}
                            className="p-1 text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                {t.settings.inviteModalTitle}
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generatedInviteLink ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-zinc-300">
                  {t.settings.inviteGeneratedDesc}
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-zinc-400 truncate">
                    {generatedInviteLink}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedInviteLink)}
                    className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-medium flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedLink ? t.common.copied : t.common.copy}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-full py-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
                >
                  {t.common.close}
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inviteEmail) return;
                  inviteMutation.mutate({
                    email: inviteEmail.trim().toLowerCase(),
                    name: inviteName.trim() || undefined,
                    role: inviteRole,
                  });
                }}
                className="space-y-3 pt-1"
              >
                {inviteError && (
                  <p className="text-xs text-red-400">{inviteError}</p>
                )}

                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    {t.auth.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    {t.auth.fullName} (nepovinné)
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="např. Honza"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    {t.settings.inviteRole}
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "MEMBER" | "ADMIN")
                    }
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="MEMBER">{t.settings.roleMember}</option>
                    <option value="ADMIN">{t.settings.roleAdmin}</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg active:scale-95 transition-all"
                  >
                    {inviteMutation.isPending ? t.common.loading : t.settings.generateInvite}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
