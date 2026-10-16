import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const demoEmail = "developer@example.com";
  const existing = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("Password123!*", 10);
    const user = await prisma.user.create({
      data: {
        name: "Demo Developer",
        email: demoEmail,
        password: hashedPassword,
      },
    });

    console.log(`✅ Created demo user: ${user.email} (Password: Password123!*)`);
  } else {
    console.log(`ℹ️ Demo user already exists: ${demoEmail}`);
  }

  console.log("🌱 Database seeding completed.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
