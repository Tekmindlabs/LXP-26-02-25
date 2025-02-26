import { PrismaClient } from '@prisma/client';
import { seedSystemSettings } from './seeds/system-settings';
import { seedCalendar } from './seeds/calendar';
import { seedCampus } from './seeds/campus';
import { seedPrograms } from './seeds/programs';
import { seedClassGroups } from './seeds/class-groups';
import { seedClasses } from './seeds/classes';
import { seedUsers } from './seeds/users';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Core system setup
    await seedSystemSettings(prisma);
    // Temporarily removing permissions seeding
    
    // Calendar setup
    const calendar = await seedCalendar(prisma);
    
    // Campus setup
    const campus = await seedCampus(prisma);
    
    // Academic structure setup
    await seedPrograms(prisma);
    await seedClassGroups(prisma);
    await seedClasses(prisma);
    
    // Users and assignments
    await seedUsers(prisma);

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


