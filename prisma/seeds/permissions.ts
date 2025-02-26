import { PrismaClient } from '@prisma/client';
import { DefaultRoles, RolePermissions } from '@/utils/permissions';
import { CampusPermission } from '@/types/enums';

const prisma = new PrismaClient();

export async function seedPermissions() {
	console.log('Seeding permissions...');

	// Create roles
	for (const role of Object.values(DefaultRoles)) {
		await prisma.role.upsert({
			where: { name: role },
			update: {},
			create: {
				name: role,
				description: `Default ${role} role`
			}
		});
	}

	// Create permissions and assign to roles
	for (const [roleName, permissions] of Object.entries(RolePermissions)) {
		const role = await prisma.role.findUnique({
			where: { name: roleName }
		});

		if (!role) {
			throw new Error(`Role ${roleName} not found`);
		}

		// Create permissions for this role
		for (const permission of permissions) {
			await prisma.permission.upsert({
				where: {
					roleId_permission: {
						roleId: role.id,
						permission: permission
					}
				},
				update: {},
				create: {
					roleId: role.id,
					permission: permission
				}
			});
		}
	}

	console.log('Permissions seeded successfully');
}
