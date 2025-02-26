import { PrismaClient, UserType, Status } from '@prisma/client';
import { hash } from 'bcryptjs';

interface SeedUsersResult {
	users: {
		superAdmin: any;
		coordinator: any;
		teachers: any[];
		students: any[];
	};
}

export async function seedUsers(prisma: PrismaClient): Promise<SeedUsersResult> {
	console.log('Seeding users...');

	// Get the campus
	const campus = await prisma.campus.findFirst({
		where: { name: 'Early Years Campus' }
	});

	if (!campus) {
		throw new Error('Campus not found');
	}

	// Create super admin
	const superAdminPassword = await hash('superadmin123', 12);
	const superAdmin = await prisma.user.create({
		data: {
			name: 'System Administrator',
			email: 'admin@earlyyears.edu',
			password: superAdminPassword,
			userType: 'super-admin' as UserType,
			status: Status.ACTIVE
		}
	});

	// Create coordinator
	const coordinatorPassword = await hash('coordinator123', 12);
	const coordinator = await prisma.user.create({
		data: {
			name: 'Sarah Johnson',
			email: 'sarah.johnson@earlyyears.edu',
			password: coordinatorPassword,
			userType: UserType.COORDINATOR,
			status: Status.ACTIVE,
			coordinatorProfile: {
				create: {
					coordinatorType: 'PROGRAM'
				}
			}
		},
		include: {
			coordinatorProfile: true
		}
	});

	// Create teachers
	const teacherPassword = await hash('teacher123', 12);
	const teachers = await Promise.all([
		prisma.user.create({
			data: {
				name: 'Emily Davis',
				email: 'emily.davis@earlyyears.edu',
				password: teacherPassword,
				userType: UserType.TEACHER,
				status: Status.ACTIVE,
				teacherProfile: {
					create: {}
				}
			},
			include: {
				teacherProfile: true
			}
		}),
		prisma.user.create({
			data: {
				name: 'Michael Brown',
				email: 'michael.brown@earlyyears.edu',
				password: teacherPassword,
				userType: UserType.TEACHER,
				status: Status.ACTIVE,
				teacherProfile: {
					create: {}
				}
			},
			include: {
				teacherProfile: true
			}
		}),
		prisma.user.create({
			data: {
				name: 'Lisa Wilson',
				email: 'lisa.wilson@earlyyears.edu',
				password: teacherPassword,
				userType: UserType.TEACHER,
				status: Status.ACTIVE,
				teacherProfile: {
					create: {}
				}
			},
			include: {
				teacherProfile: true
			}
		})
	]);

	// Create students (2 for each class)
	const classes = await prisma.class.findMany({
		where: {
			campus: { id: campus.id }
		}
	});

	const studentPassword = await hash('student123', 12);
	const students = [];

	for (const classObj of classes) {
		// Create two students per class
		for (let i = 1; i <= 2; i++) {
			const student = await prisma.user.create({
				data: {
					name: `Student ${classObj.name}-${i}`,
					email: `student.${classObj.name.toLowerCase().replace(' ', '')}.${i}@earlyyears.edu`,
					password: studentPassword,
					userType: UserType.STUDENT,
					status: Status.ACTIVE,
					studentProfile: {
						create: {
							classId: classObj.id
						}
					}
				},
				include: {
					studentProfile: true
				}
			});
			students.push(student);
		}
	}

	// Assign teachers to campus
	for (const teacher of teachers) {
		if (teacher.teacherProfile) {
			await prisma.teacherCampus.create({
				data: {
					teacherId: teacher.teacherProfile.id,
					campusId: campus.id,
					status: Status.ACTIVE,
					isPrimary: true,
					joinedAt: new Date()
				}
			});
		}
	}

	// Assign coordinator to campus
	await prisma.campusRole.create({
		data: {
			userId: coordinator.id,
			campusId: campus.id,
			roleId: 'CAMPUS_PROGRAM_COORDINATOR',
			status: Status.ACTIVE
		}
	});

	console.log('✅ Users seeded');
	return {
		users: {
			superAdmin,
			coordinator,
			teachers,
			students
		}
	};
}
