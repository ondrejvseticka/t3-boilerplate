import { Resend } from "resend";
import { ResetPasswordEmail } from "~/emails/ResetPasswordEmail";
import { WelcomeEmail } from "~/emails/WelcomeEmail";
import { env } from "~/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailParams) {
  if (!resend) {
    console.warn(
      `\n========================================\n[Resend Warning] RESEND_API_KEY is not configured.\nPassword reset link for ${to}:\n${resetUrl}\n========================================\n`,
    );
    return { success: true, simulated: true };
  }

  const from = env.EMAIL_FROM ?? "T3 Boilerplate <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Reset your T3 Boilerplate password",
    react: ResetPasswordEmail({ resetUrl, userEmail: to }),
  });

  if (error) {
    console.error("[Resend Error]:", error);
    throw new Error(error.message);
  }

  return { success: true, data };
}

interface SendWelcomeEmailParams {
  to: string;
  name?: string;
  dashboardUrl?: string;
}

export async function sendWelcomeEmail({
  to,
  name,
  dashboardUrl,
}: SendWelcomeEmailParams) {
  if (!resend) {
    console.warn(
      `\n========================================\n[Resend Warning] RESEND_API_KEY is not configured.\nWelcome email simulated for ${to} (${name ?? "User"}).\n========================================\n`,
    );
    return { success: true, simulated: true };
  }

  const from = env.EMAIL_FROM ?? "T3 Boilerplate <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Welcome to T3 Boilerplate! 🚀",
    react: WelcomeEmail({ name, dashboardUrl }),
  });

  if (error) {
    console.error("[Resend Welcome Email Error]:", error);
    throw new Error(error.message);
  }

  return { success: true, data };
}
