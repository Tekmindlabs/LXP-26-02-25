import { CampusPermission } from '@/types/enums';

export const Permissions = {
  // User permissions
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  
  // Role permissions
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ROLE_CAMPUS_ASSIGN: "role:campus-assign",
  
  // Permission management
  PERMISSION_MANAGE: "permission:manage",
  
  // System settings
  SETTINGS_MANAGE: "settings:manage",

  // Campus Management permissions
  CAMPUS_VIEW: "campus:view",
  CAMPUS_MANAGE: "campus:manage",
  CAMPUS_DELETE: "campus:delete",

  // Academic Calendar permissions
  ACADEMIC_CALENDAR_VIEW: "academic-calendar:view",
  ACADEMIC_CALENDAR_MANAGE: "academic-calendar:manage",
  ACADEMIC_YEAR_MANAGE: "academic-year:manage",
  EVENT_MANAGE: "event:manage",

  // Program Management permissions
  PROGRAM_VIEW: "program:view",
  PROGRAM_MANAGE: "program:manage",
  PROGRAM_DELETE: "program:delete",

  // Class Group Management permissions
  CLASS_GROUP_VIEW: "class-group:view",
  CLASS_GROUP_MANAGE: "class-group:manage",
  CLASS_GROUP_DELETE: "class-group:delete",

  // Class Management permissions
  CLASS_VIEW: "class:view",
  CLASS_MANAGE: "class:manage",
  CLASS_DELETE: "class:delete",
  CLASS_ASSIGN_TEACHERS: "class:assign-teachers",
  CLASS_ASSIGN_STUDENTS: "class:assign-students",

  // Gradebook permissions
  GRADEBOOK_VIEW: "gradebook:view",
  GRADEBOOK_OVERVIEW: "gradebook:overview",
  GRADEBOOK_MANAGE: "gradebook:manage",
  GRADE_ACTIVITY: "grade:activity",
  GRADE_MODIFY: "grade:modify",

  // Subject Management permissions
  SUBJECT_VIEW: "subject:view",
  SUBJECT_MANAGE: "subject:manage",
  SUBJECT_DELETE: "subject:delete",
  SUBJECT_ASSIGN_TEACHERS: "subject:assign-teachers",
} as const;

// Type definitions for permissions
export type PermissionString = typeof Permissions[keyof typeof Permissions];
export type CoordinatorPermissionString = typeof COORDINATOR_PERMISSIONS[keyof typeof COORDINATOR_PERMISSIONS];
export type AllPermissions = PermissionString | CoordinatorPermissionString;
export type Permission = PermissionString;

export enum DefaultRoles {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'ADMIN',
  COORDINATOR = 'COORDINATOR',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT'
}

export const COORDINATOR_PERMISSIONS = {
  VIEW_COORDINATORS: "VIEW_COORDINATORS",
  MANAGE_COORDINATORS: "MANAGE_COORDINATORS",
  VIEW_COORDINATOR_STUDENTS: "VIEW_COORDINATOR_STUDENTS",
  MANAGE_COORDINATOR_HIERARCHY: "MANAGE_COORDINATOR_HIERARCHY",
  ASSIGN_PROGRAMS: "ASSIGN_PROGRAMS",
  TRANSFER_COORDINATOR: "TRANSFER_COORDINATOR",
} as const;

export const RoleHierarchy: Record<DefaultRoles, DefaultRoles[]> = {
  [DefaultRoles.SUPER_ADMIN]: [],
  [DefaultRoles.ADMIN]: [DefaultRoles.COORDINATOR],
  [DefaultRoles.COORDINATOR]: [DefaultRoles.TEACHER],
  [DefaultRoles.TEACHER]: [],
  [DefaultRoles.STUDENT]: [],
  [DefaultRoles.PARENT]: []
};

export const PermissionGroups = {
  USER_MANAGEMENT: [
    Permissions.USER_CREATE,
    Permissions.USER_READ,
    Permissions.USER_UPDATE,
    Permissions.USER_DELETE
  ],
  CAMPUS_MANAGEMENT: [
    Permissions.CAMPUS_VIEW,
    Permissions.CAMPUS_MANAGE,
    Permissions.CAMPUS_DELETE
  ],
  ACADEMIC_MANAGEMENT: [
    Permissions.ACADEMIC_CALENDAR_VIEW,
    Permissions.ACADEMIC_CALENDAR_MANAGE,
    Permissions.ACADEMIC_YEAR_MANAGE,
    Permissions.EVENT_MANAGE
  ],
  PROGRAM_MANAGEMENT: [
    Permissions.PROGRAM_VIEW,
    Permissions.PROGRAM_MANAGE,
    Permissions.PROGRAM_DELETE
  ],
  CLASS_MANAGEMENT: [
    Permissions.CLASS_VIEW,
    Permissions.CLASS_MANAGE,
    Permissions.CLASS_DELETE,
    Permissions.CLASS_ASSIGN_TEACHERS,
    Permissions.CLASS_ASSIGN_STUDENTS
  ],
  GRADEBOOK_MANAGEMENT: [
    Permissions.GRADEBOOK_VIEW,
    Permissions.GRADEBOOK_OVERVIEW,
    Permissions.GRADEBOOK_MANAGE,
    Permissions.GRADE_ACTIVITY,
    Permissions.GRADE_MODIFY
  ],
  SUBJECT_MANAGEMENT: [
    Permissions.SUBJECT_VIEW,
    Permissions.SUBJECT_MANAGE,
    Permissions.SUBJECT_DELETE,
    Permissions.SUBJECT_ASSIGN_TEACHERS
  ]
} as const;

export const hasRole = (userRoles: string[], role: DefaultRoles) => {
  return userRoles.includes(role);
};

export const hasAnyRole = (userRoles: string[], roles: DefaultRoles[]) => {
  return roles.some(role => hasRole(userRoles, role));
};

type CampusPermissionSubset = CampusPermission.VIEW_CAMPUS_CLASSES | CampusPermission.VIEW_CLASS_GROUPS;

export const RolePermissions: Record<DefaultRoles, CampusPermissionSubset[]> = {
  [DefaultRoles.SUPER_ADMIN]: [
    CampusPermission.VIEW_CAMPUS_CLASSES,
    CampusPermission.VIEW_CLASS_GROUPS
  ],
  [DefaultRoles.ADMIN]: [
    CampusPermission.VIEW_CAMPUS_CLASSES,
    CampusPermission.VIEW_CLASS_GROUPS
  ],
  [DefaultRoles.COORDINATOR]: [
    CampusPermission.VIEW_CAMPUS_CLASSES,
    CampusPermission.VIEW_CLASS_GROUPS
  ],
  [DefaultRoles.TEACHER]: [
    CampusPermission.VIEW_CAMPUS_CLASSES,
    CampusPermission.VIEW_CLASS_GROUPS
  ],
  [DefaultRoles.STUDENT]: [
    CampusPermission.VIEW_CAMPUS_CLASSES,
    CampusPermission.VIEW_CLASS_GROUPS
  ],
  [DefaultRoles.PARENT]: [
    CampusPermission.VIEW_CAMPUS_CLASSES,
    CampusPermission.VIEW_CLASS_GROUPS
  ]
} as const;

import type { Session } from 'next-auth';

export function hasPermission(
  session: Session | null,
  permission: Permission | keyof typeof COORDINATOR_PERMISSIONS | CampusPermissionSubset
): boolean {
  if (!session?.user?.roles?.length) return false;
  
  const userRole = session.user.roles[0] as DefaultRoles;

  // Check regular permissions
  if (typeof permission === 'string' && permission in Permissions) {
    return true; // TODO: Implement proper permission checking for regular permissions
  }

  // Check campus permissions
  if (permission === CampusPermission.VIEW_CAMPUS_CLASSES || permission === CampusPermission.VIEW_CLASS_GROUPS) {
    const rolePermissions = RolePermissions[userRole] || [];
    return rolePermissions.includes(permission);
  }

  // Check coordinator permissions
  const coordinatorPermissionMap: Record<DefaultRoles, Array<keyof typeof COORDINATOR_PERMISSIONS>> = {
    [DefaultRoles.SUPER_ADMIN]: Object.values(COORDINATOR_PERMISSIONS),
    [DefaultRoles.ADMIN]: [
      COORDINATOR_PERMISSIONS.VIEW_COORDINATOR_STUDENTS,
      COORDINATOR_PERMISSIONS.ASSIGN_PROGRAMS,
    ],
    [DefaultRoles.COORDINATOR]: [
      COORDINATOR_PERMISSIONS.VIEW_COORDINATORS,
      COORDINATOR_PERMISSIONS.VIEW_COORDINATOR_STUDENTS,
    ],
    [DefaultRoles.TEACHER]: [],
    [DefaultRoles.STUDENT]: [],
    [DefaultRoles.PARENT]: []
  };

  return coordinatorPermissionMap[userRole]?.includes(permission as keyof typeof COORDINATOR_PERMISSIONS) ?? false;
}

export type RoleType = keyof typeof DefaultRoles;

export const hasCampusPermission = (userRoles: string[], permission: CampusPermissionSubset): boolean => {
  return userRoles.some(role => {
    const roleKey = role as DefaultRoles;
    const rolePermissions = RolePermissions[roleKey] || [];
    return rolePermissions.includes(permission);
  });
};
