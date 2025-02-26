import { PrismaClient, Status } from '@prisma/client';

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
	const classesData = classGroups.flatMap((group, index) => [
		{
			name: `${group.name} A`,
			code: `${group.name.substring(0, 3).toUpperCase()}-A-${index + 1}`,
			capacity: 20,
			classGroupId: group.id,
			campusId: campus.id,
			status: Status.ACTIVE
		},
		{
			name: `${group.name} B`,
			code: `${group.name.substring(0, 3).toUpperCase()}-B-${index + 1}`,
			capacity: 20,
			classGroupId: group.id,
			campusId: campus.id,
			status: Status.ACTIVE
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