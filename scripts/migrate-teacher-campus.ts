import { PrismaClient } from "@prisma/client";
import { runTeacherCampusMigration } from "../src/server/migrations/teacherCampusMigration";

async function main() {
  console.log("Starting teacher-campus migration script...");
  
  const prisma = new PrismaClient();
  
  try {
    await runTeacherCampusMigration(prisma);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 