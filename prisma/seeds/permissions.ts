import { PrismaClient } from '@prisma/client';
import { DefaultRoles, RolePermissions } from '@/utils/permissions';
import { CampusPermission } from '@/types/enums';

export async function seedPermissions(prisma: PrismaClient) {
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
			// First create or get the permission
			const permissionRecord = await prisma.permission.upsert({
				where: { name: permission },
				update: {},
				create: {
					name: permission,
					description: `Permission to ${permission.toLowerCase().replace('_', ' ')}`
				}
			});

			// Then create the role-permission association
			await prisma.rolePermission.create({
				data: {
					roleId: role.id,
					permissionId: permissionRecord.id
				}
			});
		}
	}

	console.log('Permissions seeded successfully');
}
