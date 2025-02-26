import { PrismaClient, Status, TermSystemType } from '@prisma/client';

export async function seedPrograms(prisma: PrismaClient) {
	console.log('Seeding programs...');

	// Get the calendar
	const calendar = await prisma.calendar.findFirst({
		where: { name: '2024-2025 Academic Calendar' }
	});

	if (!calendar) {
		throw new Error('Calendar not found');
	}

	const program = await prisma.program.create({
		data: {
			name: 'Early Childhood Education',
			description: 'Comprehensive early childhood education program for ages 2-5',
			status: Status.ACTIVE,
			termSystem: TermSystemType.SEMESTER,
			calendarId: calendar.id
		}
	});

	// Create subjects for early childhood program
	const subjects = [
		{
			name: 'Language and Literacy',
			code: 'LL',
			description: 'Early language development and pre-reading skills',
			credits: 1.0
		},
		{
			name: 'Mathematics',
			code: 'MATH',
			description: 'Basic number concepts and counting',
			credits: 1.0
		},
		{
			name: 'Science and Discovery',
			code: 'SCI',
			description: 'Exploring the natural world',
			credits: 1.0
		},
		{
			name: 'Arts and Crafts',
			code: 'ART',
			description: 'Creative expression through various mediums',
			credits: 1.0
		},
		{
			name: 'Physical Education',
			code: 'PE',
			description: 'Movement and motor skills development',
			credits: 1.0
		},
		{
			name: 'Music and Movement',
			code: 'MUS',
			description: 'Musical exploration and rhythmic activities',
			credits: 1.0
		}
	];

	const createdSubjects = [];
	for (const subject of subjects) {
		const createdSubject = await prisma.subject.create({
			data: {
				...subject,
				status: Status.ACTIVE
			}
		});
		createdSubjects.push(createdSubject);
	}

	console.log('✅ Programs and subjects seeded');
	return program;
}