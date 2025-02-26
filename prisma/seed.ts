import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seeds/permissions';
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
    await seedPermissions(prisma);
    
    // Calendar setup
    const calendar = await seedCalendar(prisma);
    console.log('Calendar created:', calendar.name);
    
    // Campus setup
    const campus = await seedCampus(prisma);
    console.log('Campus created:', campus.name);
    
    // Academic structure setup
    const program = await seedPrograms(prisma);
    console.log('Program created:', program.name);
    
    const classGroups = await seedClassGroups(prisma);
    console.log('Class groups created:', classGroups.length);
    
    const classes = await seedClasses(prisma);
    console.log('Classes created:', classes.length);
    
    // Users and assignments
    const { users } = await seedUsers(prisma);
    console.log('Users created:', {
      superAdmin: users.superAdmin.name,
      coordinator: users.coordinator.name,
      teachers: users.teachers.length,
      students: users.students.length
    });

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


