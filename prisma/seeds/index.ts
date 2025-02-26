import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './permissions';
import { seedSystemSettings } from './system-settings';
import { seedCalendar } from './calendar';
import { seedCampus } from './campus';
import { seedPrograms } from './programs';
import { seedClassGroups } from './class-groups';
import { seedClasses } from './classes';
import { seedUsers } from './users';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting database seeding...');

	// Core system setup
	await seedSystemSettings(prisma);
	await seedPermissions(prisma);
	
	// Calendar setup
	await seedCalendar(prisma);
	
	// Campus setup
	await seedCampus(prisma);
	
	// Academic structure setup
	await seedPrograms(prisma);
	await seedClassGroups(prisma);
	await seedClasses(prisma);
	
	// Users and assignments
	await seedUsers(prisma);

	console.log('✅ Database seeding completed');
}

main()
	.catch((e) => {
		console.error('❌ Error during database seeding:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});