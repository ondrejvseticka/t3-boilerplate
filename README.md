# Advanced T3 Stack Boilerplate

A production-ready full-stack boilerplate built on top of [Create T3 App](https://create.t3.gg/), tailored for **NextAuth.js v5 (JWT Strategy)**, **Credentials Authentication**, **Password Strength Validation**, **Forgot & Reset Password flows with Resend & React Email**, **Abuse Rate Limiting**, and **Database Seeding**.

---

## ⚡️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, end-to-end type safety)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) & [Prisma](https://www.prisma.io/)
- **API Layer**: [tRPC v11](https://trpc.io/) with React Query integration
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
  - Strategy: **JWT Sessions**
  - Provider: **Credentials (Email + Bcrypt Password)**
  - Extensible: Clear commented hooks to drop in OAuth providers (GitHub, Google, etc.)
- **Emails**: [Resend](https://resend.com/) & [React Email](https://react.email/)
  - Responsive dark-mode email components
  - Local simulation mode (no API key required for testing)
- **Security**: Sliding window rate limiting on registration & password resets
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Validation**: [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd t3-boilerplate
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Populate the required values:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/t3_boilerplate` |
| `AUTH_SECRET` | Secret key for signing JWTs (`npx auth secret`) | 32+ character random string |
| `RESEND_API_KEY` | *(Optional)* Resend API Key | Empty = simulated in console |
| `EMAIL_FROM` | Sender address for transactional emails | `T3 Boilerplate <onboarding@resend.dev>` |

> **Local Email Simulation**: When `RESEND_API_KEY` is omitted in development, password reset and welcome emails are logged directly into your development terminal with actionable links.

### 3. Start Local Database

Start PostgreSQL via Docker Compose or using the provided script:

```bash
# Option A: Docker Compose
docker compose up -d

# Option B: Shell Script
./start-database.sh
```

### 4. Push Schema & Seed Database

Push your Prisma schema to PostgreSQL and seed a default developer account:

```bash
npm run db:push
npm run db:seed
```

Default seeded credentials:
- **Email**: `developer@example.com`
- **Password**: `Password123!*`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Authentication & Security

### Pure JWT Strategy
NextAuth is configured with `session: { strategy: "jwt" }`. The JWT token carries the database `user.id` into `session.user.id`, eliminating database round-trips for session checks.

### Adding More Providers
If you want to plug in OAuth providers (e.g. GitHub, Google), drop them right into `src/server/auth/config.ts`:

```ts
providers: [
  CredentialsProvider({ ... }),

  // More providers in here e.g.
  // GitHubProvider({
  //   clientId: process.env.AUTH_GITHUB_ID!,
  //   clientSecret: process.env.AUTH_GITHUB_SECRET!,
  // }),
  // GoogleProvider({
  //   clientId: process.env.AUTH_GOOGLE_ID!,
  //   clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  // }),
]
```

Corresponding commented button sections are also provided in `src/app/auth/signin/page.tsx` and `src/app/auth/register/page.tsx`.

### Password Security & Rate Limiting
- **Bcrypt Hashing**: Passwords are encrypted with `bcryptjs` (cost factor 10).
- **Zod Complexity & Live Evaluation**: Enforces 8+ characters, uppercase, lowercase, numbers, special characters, and denies common weak passwords.
- **Sliding Window Rate Limiter**: `src/server/security/rate-limit.ts` limits registration to 10 attempts per 15 minutes and forgot-password requests to 3 attempts per 15 minutes per email, protecting against brute-force attacks and email spam.
- **Account Enumeration Protection**: The forgot password API always returns success to prevent email discovery.

### Server Session Helpers
Use ergonomic server helpers from `src/server/auth/session.ts` in React Server Components or Server Actions:

```ts
import { getSessionUser, getCurrentDbUser, requireAuth } from "~/server/auth/session";

// In any Server Component:
export default async function MyPage() {
  const user = await requireAuth(); // Redirects if not logged in
  // ...
}
```

---

## ✉️ Email Templates & Preview

Transactional emails are built with `@react-email/components`:

- **Reset Password Email**: `src/emails/ResetPasswordEmail.tsx`
- **Welcome Onboarding Email**: `src/emails/WelcomeEmail.tsx`

### Previewing Emails Locally

Run the React Email preview studio:

```bash
npm run email
```

Open [http://localhost:3001](http://localhost:3001) to interactively preview emails in desktop and mobile viewports.

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma              # Prisma models: User, Account, Session, PasswordResetToken
│   └── seed.ts                    # Database seeder (developer@example.com)
├── public/                        # Static assets & icons
├── src/
│   ├── app/
│   │   ├── _components/           # Shared app components
│   │   ├── api/                   # Route handlers (auth, tRPC)
│   │   ├── auth/                  # Auth pages (signin, register, forgot-password, reset-password)
│   │   ├── dashboard/             # Protected dashboard area with user navigation
│   │   ├── layout.tsx             # Root layout with tRPC & font configuration
│   │   └── page.tsx               # Public landing page
│   ├── components/                # UI components (Logo, PasswordStrengthMeter)
│   ├── emails/                    # React Email templates
│   ├── env.js                     # Type-safe environment variable schema
│   ├── lib/                       # Zod schemas & password evaluation
│   ├── server/
│   │   ├── api/                   # tRPC root & routers (auth, post)
│   │   ├── auth/                  # NextAuth v5 configuration, JWT callbacks, session helpers
│   │   ├── db.ts                  # Prisma client instance
│   │   ├── email.ts               # Resend transactional email service
│   │   └── security/              # In-memory sliding window rate limiter
│   ├── styles/
│   │   └── globals.css            # Tailwind CSS v4 directives
│   └── trpc/                      # React Query & tRPC client hooks
├── .env.example                   # Environment variable template
├── docker-compose.yml             # Local PostgreSQL service
├── next.config.js                 # Next.js configuration
├── package.json                   # Project scripts and dependencies
├── start-database.sh              # Local PostgreSQL Docker runner
└── tsconfig.json                  # TypeScript compiler options
```

---

## 🛠 Available Scripts

- `npm run dev`: Start Next.js development server with Turbopack
- `npm run build`: Build production application
- `npm run start`: Start production server
- `npm run typecheck`: Run TypeScript compiler check
- `npm run email`: Start React Email preview server (`http://localhost:3001`)
- `npm run db:push`: Push Prisma schema directly to database
- `npm run db:seed`: Seed default developer credentials into database
- `npm run db:generate`: Generate Prisma Client
- `npm run db:migrate`: Run Prisma migrations
- `npm run db:studio`: Open Prisma Studio database GUI
