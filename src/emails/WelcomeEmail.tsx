import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
  dashboardUrl?: string;
}

export const WelcomeEmail = ({
  name,
  dashboardUrl = "http://localhost:3000/dashboard",
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to T3 Boilerplate! 🚀</Preview>
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
          <Heading style={heading}>Welcome aboard! 🚀</Heading>

          {/* Greeting */}
          <Text style={paragraph}>
            {name ? `Hi ${name},` : "Hello,"}
          </Text>
          <Text style={paragraph}>
            Thanks for joining T3 Boilerplate! Your account has been successfully created.
            This boilerplate gives you a production-grade full-stack setup with Next.js App Router,
            JWT authentication, Prisma ORM, tRPC, and transactional emails with Resend.
          </Text>

          {/* Feature highlights */}
          <Section style={featureBox}>
            <Text style={featureTitle}>What is included:</Text>
            <Text style={featureItem}>
              🔐 <strong>NextAuth v5 + JWT</strong> — Credentials and OAuth authentication with secure session handling.
            </Text>
            <Text style={featureItem}>
              ✉️ <strong>Resend + React Email</strong> — Beautiful password reset and onboarding transactional emails.
            </Text>
            <Text style={featureItem}>
              ⚡️ <strong>End-to-End Type Safety</strong> — tRPC v11 with Prisma PostgreSQL client and Zod validation.
            </Text>
          </Section>

          {/* Call to action */}
          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Your Dashboard
            </Button>
          </Section>

          <Text style={paragraphMuted}>
            If you ever have questions or need help customizing your app, feel free to check the documentation or submit an issue.
          </Text>

          <Hr style={hr} />

          {/* Footer */}
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

WelcomeEmail.PreviewProps = {
  name: "Alex",
  dashboardUrl: "http://localhost:3000/dashboard",
} as WelcomeEmailProps;

export default WelcomeEmail;

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
  maxWidth: "520px",
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
  fontSize: "24px",
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

const featureBox: React.CSSProperties = {
  backgroundColor: "#27272a40",
  border: "1px solid #27272a",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "20px 0",
};

const featureTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#fafafa",
  margin: "0 0 10px 0",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const featureItem: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#a1a1aa",
  margin: "6px 0",
};

const paragraphMuted: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#a1a1aa",
  margin: "20px 0 0 0",
};

const buttonContainer: React.CSSProperties = {
  margin: "28px 0 20px 0",
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
  padding: "12px 28px",
  boxShadow: "0 4px 12px rgba(147, 51, 234, 0.3)",
};

const hr: React.CSSProperties = {
  borderColor: "#27272a",
  margin: "28px 0 20px 0",
};

const footerSection: React.CSSProperties = {
  marginTop: "16px",
};

const footerCopy: React.CSSProperties = {
  fontSize: "11px",
  color: "#52525b",
  margin: 0,
};
