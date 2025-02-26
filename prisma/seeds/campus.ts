import { PrismaClient, CampusType, Status } from '@prisma/client';

export async function seedCampus(prisma: PrismaClient) {
	console.log('Seeding campus...');

	const campus = await prisma.campus.create({
		data: {
			name: 'Early Years Campus',
			code: 'EYC-001',
			type: CampusType.MAIN,
			establishmentDate: new Date('2024-01-01'),
			streetAddress: '123 Education Street',
			city: 'Knowledge City',
			state: 'Learning State',
			country: 'Education Land',
			postalCode: '12345',
			primaryPhone: '+1-234-567-8900',
			email: 'contact@earlyyears.edu',
			emergencyContact: '+1-234-567-8911',
			status: Status.ACTIVE
		}
	});

	console.log('✅ Campus seeded');
	return campus;
}