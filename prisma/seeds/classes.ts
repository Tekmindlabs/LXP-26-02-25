import { PrismaClient } from '@prisma/client';

export async function seedClasses(prisma: PrismaClient) {
	console.log('Seeding classes...');

	// Get the campus
	const campus = await prisma.campus.findFirst({
		where: { name: 'Early Years Campus' }
	});

	if (!campus) {
		throw new Error('Campus not found');
	}

	// Get all class groups
	const classGroups = await prisma.classGroup.findMany({
		where: {
			program: {
				name: 'Early Childhood Education'
			}
		}
	});

	if (classGroups.length === 0) {
		throw new Error('No class groups found');
	}

	// Create two classes for each class group
	const classesData = classGroups.flatMap(group => [
		{
			name: `${group.name} A`,
			description: `Section A of ${group.name}`,
			capacity: group.metadata?.capacity || 20,
			classGroupId: group.id,
			campusId: campus.id,
			status: 'ACTIVE',
			metadata: {
				section: 'A',
				schedule: 'Morning',
				timing: '8:00 AM - 12:00 PM'
			}
		},
		{
			name: `${group.name} B`,
			description: `Section B of ${group.name}`,
			capacity: group.metadata?.capacity || 20,
			classGroupId: group.id,
			campusId: campus.id,
			status: 'ACTIVE',
			metadata: {
				section: 'B',
				schedule: 'Afternoon',
				timing: '1:00 PM - 5:00 PM'
			}
		}
	]);

	const createdClasses = [];

	for (const classData of classesData) {
		const createdClass = await prisma.class.create({
			data: classData
		});
		createdClasses.push(createdClass);
	}

	console.log('✅ Classes seeded');
	return createdClasses;
}