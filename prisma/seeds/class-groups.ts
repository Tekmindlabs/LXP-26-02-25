import { PrismaClient, Status } from '@prisma/client';

export async function seedClassGroups(prisma: PrismaClient) {
	console.log('Seeding class groups...');

	// Get the Early Childhood Education program
	const program = await prisma.program.findFirst({
		where: { name: 'Early Childhood Education' }
	});

	if (!program) {
		throw new Error('Early Childhood Education program not found');
	}

	// Get the calendar
	const calendar = await prisma.calendar.findFirst({
		where: { name: '2024-2025 Academic Calendar' }
	});

	if (!calendar) {
		throw new Error('Academic calendar not found');
	}

	// Create class groups
	const classGroups = [
		{
			name: 'Playgroup',
			description: 'Early learning group for 2-3 year olds',
			settings: {
				ageGroup: '2-3 years',
				capacity: 15,
				teacherRatio: '1:5'
			}
		},
		{
			name: 'Nursery',
			description: 'Nursery group for 3-4 year olds',
			settings: {
				ageGroup: '3-4 years',
				capacity: 20,
				teacherRatio: '1:7'
			}
		},
		{
			name: 'Preparatory',
			description: 'Preparatory group for 4-5 years olds',
			settings: {
				ageGroup: '4-5 years',
				capacity: 20,
				teacherRatio: '1:8'
			}
		}
	];

	const createdGroups = [];

	for (const group of classGroups) {
		const classGroup = await prisma.classGroup.create({
			data: {
				...group,
				status: Status.ACTIVE,
				program: {
					connect: { id: program.id }
				},
				calendar: {
					connect: { id: calendar.id }
				}
			}
		});
		createdGroups.push(classGroup);
	}

	console.log('✅ Class groups seeded');
	return createdGroups;
}