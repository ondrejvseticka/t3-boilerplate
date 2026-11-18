import { PrismaClient, ActionType, Role } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Kotelna database initialization...");

  // 1. Initial Boiler Settings singleton ("main")
  await prisma.boilerSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      stokeMinutes: 180, // Default 3 hours
    },
  });
  console.log("⚙️ BoilerSettings singleton initialized.");

  // 2. Initial Boiler State singleton ("main")
  await prisma.boilerState.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      lastActionType: ActionType.OUT,
      lastUserName: "Nobody",
      lastFuelAt: null,
      nextCheckAt: null,
      note: "Vítejte v Kotelně!",
    },
  });
  console.log("🔥 BoilerState singleton initialized.");

  // 3. Check if any user exists; if not, create initial Super Admin
  const existingUsers = await prisma.user.count();
  if (existingUsers === 0) {
    const defaultPassword = await bcrypt.hash("admin123", 10);
    const superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@kotelna.local",
        password: defaultPassword,
        role: Role.SUPER_ADMIN,
        avatarColor: "#FF6B00",
      },
    });
    console.log(`👑 Initial Super Admin created: ${superAdmin.email} (password: admin123)`);
  }

  console.log("✅ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
