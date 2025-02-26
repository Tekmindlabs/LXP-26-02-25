import { PrismaClient } from '@prisma/client';
import { addDays, startOfYear, endOfYear } from 'date-fns';

export async function seedCalendar(prisma: PrismaClient) {
	console.log('Seeding calendar...');

	// Create academic year
	const academicYear = await prisma.academicYear.create({
		data: {
			name: '2024-2025',
			startDate: new Date('2024-08-01'),
			endDate: new Date('2025-06-30'),
			status: 'ACTIVE'
		}
	});

	// Create calendar
	const calendar = await prisma.calendar.create({
		data: {
			name: 'Academic Calendar 2024-2025',
			description: 'Main academic calendar for Early Childhood Program',
			startDate: academicYear.startDate,
			endDate: academicYear.endDate,
			academicYearId: academicYear.id,
			type: 'ACADEMIC',
			visibility: 'PUBLIC',
			status: 'ACTIVE'
		}
	});

	// Create terms
	const terms = [
		{
			name: 'Term 1',
			startDate: new Date('2024-08-01'),
			endDate: new Date('2024-10-31'),
		},
		{
			name: 'Term 2',
			startDate: new Date('2024-11-01'),
			endDate: new Date('2025-01-31'),
		},
		{
			name: 'Term 3',
			startDate: new Date('2025-02-01'),
			endDate: new Date('2025-04-30'),
		},
		{
			name: 'Term 4',
			startDate: new Date('2025-05-01'),
			endDate: new Date('2025-06-30'),
		}
	];

	for (const term of terms) {
		await prisma.term.create({
			data: {
				...term,
				calendarId: calendar.id,
				status: 'ACTIVE'
			}
		});
	}

	console.log('✅ Calendar seeded');
	return calendar;
}