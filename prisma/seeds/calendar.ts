import { PrismaClient, CalendarType, Visibility, Status } from '@prisma/client';

export async function seedCalendar(prisma: PrismaClient) {
	console.log('Seeding calendar...');

	const academicYear = await prisma.academicYear.create({
		data: {
			name: '2024-2025',
			startDate: new Date('2024-08-01'),
			endDate: new Date('2025-07-31'),
			status: Status.ACTIVE
		}
	});

	const calendar = await prisma.calendar.create({
		data: {
			name: '2024-2025 Academic Calendar',
			description: 'Early Years Campus Academic Calendar',
			startDate: new Date('2024-08-01'),
			endDate: new Date('2025-07-31'),
			type: CalendarType.PRIMARY,
			visibility: Visibility.ALL,
			academicYearId: academicYear.id,
			terms: {
				create: [
					{
						name: 'Term 1',
						startDate: new Date('2024-08-01'),
						endDate: new Date('2024-10-31'),
						weeks: {
							create: Array.from({ length: 13 }, (_, i) => ({
								weekNumber: i + 1,
								startDate: new Date(2024, 7, 1 + i * 7),
								endDate: new Date(2024, 7, 7 + i * 7)
							}))
						}
					},
					{
						name: 'Term 2',
						startDate: new Date('2024-11-01'),
						endDate: new Date('2025-01-31'),
						weeks: {
							create: Array.from({ length: 13 }, (_, i) => ({
								weekNumber: i + 1,
								startDate: new Date(2024, 10, 1 + i * 7),
								endDate: new Date(2024, 10, 7 + i * 7)
							}))
						}
					},
					{
						name: 'Term 3',
						startDate: new Date('2025-02-01'),
						endDate: new Date('2025-04-30'),
						weeks: {
							create: Array.from({ length: 13 }, (_, i) => ({
								weekNumber: i + 1,
								startDate: new Date(2025, 1, 1 + i * 7),
								endDate: new Date(2025, 1, 7 + i * 7)
							}))
						}
					},
					{
						name: 'Term 4',
						startDate: new Date('2025-05-01'),
						endDate: new Date('2025-07-31'),
						weeks: {
							create: Array.from({ length: 13 }, (_, i) => ({
								weekNumber: i + 1,
								startDate: new Date(2025, 4, 1 + i * 7),
								endDate: new Date(2025, 4, 7 + i * 7)
							}))
						}
					}
				]
			}
		}
	});

	console.log('✅ Calendar seeded successfully');
	return calendar;
}