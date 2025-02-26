import { PrismaClient, UserType, Status, CoordinatorType, TeacherType } from '@prisma/client';
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

	// Create roles if they don't exist
	const roles = {
		superAdmin: await prisma.role.upsert({
			where: { name: 'super-admin' },
			update: {},
			create: {
				name: 'super-admin',
				description: 'Super Administrator'
			}
		}),
		coordinator: await prisma.role.upsert({
			where: { name: UserType.COORDINATOR },
			update: {},
			create: {
				name: UserType.COORDINATOR,
				description: 'Campus Coordinator'
			}
		}),
		teacher: await prisma.role.upsert({
			where: { name: UserType.TEACHER },
			update: {},
			create: {
				name: UserType.TEACHER,
				description: 'Teacher'
			}
		})
	};

	// Create super admin
	const superAdminPassword = await hash('superadmin123', 12);
	const superAdmin = await prisma.user.create({
		data: {
			name: 'System Administrator',
			email: 'admin@school.com',
			password: superAdminPassword,
			userType: UserType.ADMIN,
			status: Status.ACTIVE,
			userRoles: {
				create: {
					roleId: roles.superAdmin.id
				}
			}
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
			userRoles: {
				create: {
					roleId: roles.coordinator.id
				}
			},
			coordinatorProfile: {
				create: {
					type: CoordinatorType.PROGRAM_COORDINATOR,
					responsibilities: ['Early Childhood Education Program'],
					campusId: campus.id
				}
			}
		}
	});

	// Create teachers
	const teachers = await Promise.all([
		prisma.user.create({
			data: {
				name: 'Emily Davis',
				email: 'emily.davis@earlyyears.edu',
				password: await hash('teacher123', 12),
				userType: UserType.TEACHER,
				status: Status.ACTIVE,
				userRoles: {
					create: {
						roleId: roles.teacher.id
					}
				},
				teacherProfile: {
					create: {
						teacherType: TeacherType.CLASS,
						specialization: 'Early Years Education',
						campuses: {
							create: {
								campusId: campus.id,
								isPrimary: true,
								status: Status.ACTIVE,
								joinedAt: new Date()
							}
						}
					}
				}
			}
		}),
		prisma.user.create({
			data: {
				name: 'Michael Brown',
				email: 'michael.brown@earlyyears.edu',
				password: await hash('teacher123', 12),
				userType: UserType.TEACHER,
				status: Status.ACTIVE,
				userRoles: {
					create: {
						roleId: roles.teacher.id
					}
				},
				teacherProfile: {
					create: {
						teacherType: TeacherType.SUBJECT,
						specialization: 'Music Education',
						campuses: {
							create: {
								campusId: campus.id,
								isPrimary: true,
								status: Status.ACTIVE,
								joinedAt: new Date()
							}
						}
					}
				}
			}
		}),
		prisma.user.create({
			data: {
				name: 'Lisa Wilson',
				email: 'lisa.wilson@earlyyears.edu',
				password: await hash('teacher123', 12),
				userType: UserType.TEACHER,
				status: Status.ACTIVE,
				userRoles: {
					create: {
						roleId: roles.teacher.id
					}
				},
				teacherProfile: {
					create: {
						teacherType: TeacherType.CLASS,
						specialization: 'Art Education',
						campuses: {
							create: {
								campusId: campus.id,
								isPrimary: true,
								status: Status.ACTIVE,
								joinedAt: new Date()
							}
						}
					}
				}
			}
		})
	]);

	console.log('✅ Users seeded successfully');

	return {
		users: {
			superAdmin,
			coordinator,
			teachers,
			students: []
		}
	};
}
