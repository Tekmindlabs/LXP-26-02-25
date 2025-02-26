import { PrismaClient } from '@prisma/client';

export async function seedCampus(prisma: PrismaClient) {
	console.log('Seeding campus...');

	const campus = await prisma.campus.create({
		data: {
			name: 'Early Years Campus',
			code: 'EYC-001',
			type: 'MAIN',
			address: '123 Education Street',
			city: 'Knowledge City',
			state: 'Learning State',
			country: 'Education Land',
			postalCode: '12345',
			phone: '+1-234-567-8900',
			email: 'contact@earlyyears.edu',
			website: 'www.earlyyears.edu',
			status: 'ACTIVE',
			metadata: {
				foundedYear: '2024',
				facilities: [
					'Indoor Play Area',
					'Outdoor Playground',
					'Art Studio',
					'Music Room',
					'Library Corner'
				]
			}
		}
	});

	console.log('✅ Campus seeded');
	return campus;
}