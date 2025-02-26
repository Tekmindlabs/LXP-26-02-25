import { PrismaClient } from '@prisma/client';

export async function seedPrograms(prisma: PrismaClient) {
	console.log('Seeding programs...');

	const program = await prisma.program.create({
		data: {
			name: 'Early Childhood Education',
			code: 'ECE',
			description: 'Comprehensive early childhood education program for ages 2-5',
			status: 'ACTIVE',
			metadata: {
				ageGroup: '2-5 years',
				curriculum: 'Play-based learning',
				duration: '3 years',
				learningOutcomes: [
					'Social and emotional development',
					'Language and communication skills',
					'Physical development and movement',
					'Cognitive development',
					'Creative expression'
				]
			}
		}
	});

	// Create subjects for early childhood program
	const subjects = [
		{
			name: 'Language and Literacy',
			code: 'LL',
			description: 'Early language development and pre-reading skills'
		},
		{
			name: 'Mathematics',
			code: 'MATH',
			description: 'Basic number concepts and counting'
		},
		{
			name: 'Science and Discovery',
			code: 'SCI',
			description: 'Exploring the natural world'
		},
		{
			name: 'Arts and Crafts',
			code: 'ART',
			description: 'Creative expression through various mediums'
		},
		{
			name: 'Physical Education',
			code: 'PE',
			description: 'Movement and motor skills development'
		},
		{
			name: 'Music and Movement',
			code: 'MUS',
			description: 'Musical exploration and rhythmic activities'
		}
	];

	for (const subject of subjects) {
		await prisma.subject.create({
			data: {
				...subject,
				status: 'ACTIVE',
				programs: {
					create: {
						programId: program.id,
						status: 'ACTIVE'
					}
				}
			}
		});
	}

	console.log('✅ Programs and subjects seeded');
	return program;
}