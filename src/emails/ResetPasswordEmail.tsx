import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  resetUrl: string;
  userEmail?: string;
}

export const ResetPasswordEmail = ({
  resetUrl = "http://localhost:3000/auth/reset-password?token=sample-token-123",
  userEmail = "alex@example.com",
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your T3 Boilerplate password</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo / Header */}
          <Section style={headerSection}>
            <table cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td style={logoIcon}>T3</td>
                  <td style={logoText}>
                    T3 <span style={logoSubtitle}>Boilerplate</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Heading */}
          <Heading style={heading}>Reset your password</Heading>

          {/* Body Text */}
          <Text style={paragraph}>
            {userEmail ? `Hi ${userEmail},` : "Hello,"}
          </Text>
          <Text style={paragraph}>
            We received a request to reset the password for your account. Click the button below to choose a new password:
          </Text>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>

          <Text style={paragraphMuted}>
            This link is valid for <strong>60 minutes</strong>. If you didn&apos;t request a password reset, you can safely ignore this email — your password will remain unchanged.
          </Text>

          <Hr style={hr} />

          {/* Fallback Link & Footer */}
          <Text style={footerText}>
            If the button doesn&apos;t work, copy and paste this link into your browser:
          </Text>
          <Link href={resetUrl} style={link}>
            {resetUrl}
          </Link>

          <Section style={footerSection}>
            <Text style={footerCopy}>
              © {new Date().getFullYear()} T3 Boilerplate. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

ResetPasswordEmail.PreviewProps = {
  resetUrl: "http://localhost:3000/auth/reset-password?token=sample-token-123",
  userEmail: "alex@example.com",
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;

// --- Styles ---

const main: React.CSSProperties = {
  backgroundColor: "#09090b",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  margin: 0,
  padding: "40px 16px",
};

const container: React.CSSProperties = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "480px",
  padding: "36px 32px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
};

const headerSection: React.CSSProperties = {
  marginBottom: "28px",
};

const logoIcon: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  backgroundColor: "#9333ea",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: "14px",
  textAlign: "center",
  verticalAlign: "middle",
};

const logoText: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#ffffff",
  paddingLeft: "12px",
  verticalAlign: "middle",
  letterSpacing: "-0.025em",
};

const logoSubtitle: React.CSSProperties = {
  color: "#a1a1aa",
  fontWeight: 400,
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#fafafa",
  letterSpacing: "-0.025em",
  margin: "0 0 16px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#d4d4d8",
  margin: "0 0 14px 0",
};

const paragraphMuted: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#a1a1aa",
  margin: "24px 0 0 0",
};

const buttonContainer: React.CSSProperties = {
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#9333ea",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 24px",
  boxShadow: "0 4px 12px rgba(147, 51, 234, 0.3)",
};

const hr: React.CSSProperties = {
  borderColor: "#27272a",
  margin: "28px 0 20px 0",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#71717a",
  margin: "0 0 6px 0",
};

const link: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#a855f7",
  wordBreak: "break-all",
};

const footerSection: React.CSSProperties = {
  marginTop: "24px",
  paddingTop: "16px",
  borderTop: "1px solid #27272a",
};

const footerCopy: React.CSSProperties = {
  fontSize: "11px",
  color: "#52525b",
  margin: 0,
};
