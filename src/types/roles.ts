import { type Role } from "@prisma/client";

export interface RoleTemplate {
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleLayout {
  sidebar: boolean;
  header: boolean;
  footer?: boolean;
}

export interface RoleFeature {
  id: string;
  name: string;
  description: string;
  path: string;
  icon?: string;
}

export type RoleLayoutConfig = Record<Role, RoleLayout>;
export type RoleFeatureConfig = Record<Role, RoleFeature[]>;

export const RoleLayouts: RoleLayoutConfig = {
  SUPER_ADMIN: {
    sidebar: true,
    header: true,
    footer: false,
  },
  ADMIN: {
    sidebar: true,
    header: true,
    footer: false,
  },
  TEACHER: {
    sidebar: true,
    header: true,
    footer: false,
  },
  STUDENT: {
    sidebar: true,
    header: true,
    footer: false,
  },
  COORDINATOR: {
    sidebar: true,
    header: true,
    footer: false,
  },
};

export const DashboardFeatures: RoleFeatureConfig = {
  SUPER_ADMIN: [
    {
      id: "campus-management",
      name: "Campus Management",
      description: "Manage all campuses and their resources",
      path: "/dashboard/campus",
      icon: "Building",
    },
    {
      id: "user-management",
      name: "User Management",
      description: "Manage all users across the platform",
      path: "/dashboard/users",
      icon: "Users",
    },
    {
      id: "program-management",
      name: "Program Management",
      description: "Manage educational programs and curricula",
      path: "/dashboard/programs",
      icon: "GraduationCap",
    },
    {
      id: "settings",
      name: "Platform Settings",
      description: "Configure platform-wide settings",
      path: "/dashboard/settings",
      icon: "Settings",
    },
  ],
  ADMIN: [
    {
      id: "campus-overview",
      name: "Campus Overview",
      description: "View and manage campus details",
      path: "/dashboard/campus",
      icon: "Building",
    },
    {
      id: "class-management",
      name: "Class Management",
      description: "Manage classes and schedules",
      path: "/dashboard/classes",
      icon: "CalendarDays",
    },
  ],
  TEACHER: [
    {
      id: "my-classes",
      name: "My Classes",
      description: "View and manage assigned classes",
      path: "/dashboard/classes",
      icon: "BookOpen",
    },
    {
      id: "assignments",
      name: "Assignments",
      description: "Manage student assignments",
      path: "/dashboard/assignments",
      icon: "FileText",
    },
  ],
  STUDENT: [
    {
      id: "my-courses",
      name: "My Courses",
      description: "View enrolled courses",
      path: "/dashboard/courses",
      icon: "BookOpen",
    },
    {
      id: "assignments",
      name: "Assignments",
      description: "View and submit assignments",
      path: "/dashboard/assignments",
      icon: "FileText",
    },
  ],
  COORDINATOR: [
    {
      id: "campus-coordination",
      name: "Campus Coordination",
      description: "Coordinate campus activities",
      path: "/dashboard/coordination",
      icon: "Building",
    },
    {
      id: "schedule-management",
      name: "Schedule Management",
      description: "Manage campus schedules",
      path: "/dashboard/schedules",
      icon: "Calendar",
    },
  ],
};
