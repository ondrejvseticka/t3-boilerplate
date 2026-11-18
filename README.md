# 🔥 Kotelna – Solid Fuel Boiler Management

Modern **mobile-first & desktop-friendly PWA** built with the **T3 Stack** (Next.js App Router, TypeScript, tRPC v11, Prisma ORM, NextAuth.js with JWT strategy, Tailwind CSS) designed for smart stoking management, timer tracking, and household organization access.

---

## 🚀 Key Features

- 🔥 **1-Click Stoking Action:**
  - **„Přiložil jsem“** – single clear action button that immediately sets the stoking countdown configured by the Super Admin.
  - Optimistic UI update with tactile haptic vibration (`navigator.vibrate`).
- 🧹 **Service Actions:**
  - **Vybrat popel** – logged in history and stats without resetting the active countdown.
  - **Vyhaslo** – cancels active countdown.
- ⏱️ **Live Countdown with Discrete Status Indicator:**
  - **Green** (> 30 min) – optimal burning temperature.
  - **Amber / Orange** (≤ 30 min) – refuel soon.
  - **Pulsing Red** (expired) – boiler cooling down, immediate alert.
  - **Neutral Gray** – extinguished.
- 📌 **Notice Board:** Household message board (*"Kindling is low"*, *"Draft reduced"*) with instant save/clear.
- 🏆 **History & Leaderboard:**
  - Filter by period: **This Week**, **This Month**, **Full Season** (since Sept 1st).
  - Leaderboard tracking stoking counts and ash cleanings.
  - Activity log with quick undo/delete.
- 👑 **Super Admin & Household Organization:**
  - Super Admin configures the default stoking duration (e.g. 180 min / 3 hrs in ±15 min steps).
  - Invite household members via custom invitation links (`/login?token=...`).
  - Assign roles (`SUPER_ADMIN`, `ADMIN`, `MEMBER`), revoke invitations, and manage accounts.
- 🖥️ **Responsive & PWA Ready:**
  - Desktop-friendly 2-column layout with header navigation.
  - Mobile bottom navigation bar optimized for iOS home indicator safe area (`md:hidden`).
  - Standalone mode without browser chrome for Safari ("Add to Home Screen").

---

## 🛠️ Setup & Running

### 1. Environment Configuration
```bash
cp .env.example .env
```
Populate `.env`:
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://postgres:password@localhost:5432/kotelna`)
- `AUTH_SECRET`: Random secret for signing JWT tokens (`openssl rand -base64 33`)

### 2. Start PostgreSQL (Docker)
```bash
docker compose up -d
```

### 3. Database Push & Seed
```bash
npm run db:push
npm run db:seed
```

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (sign in or set up initial Super Admin at `/login`).
