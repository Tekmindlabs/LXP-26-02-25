'use client';

import { useSession } from "next-auth/react";
import { DefaultRoles } from "@/utils/permissions";
import { DashboardFeature } from "@/types/dashboard";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { RoleLayouts } from "./layouts/RoleLayouts";
import { DashboardFeatures } from "./features/DashboardFeatures";
import { api } from "@/trpc/react";
import type { Program } from "@prisma/client";

export const DashboardContent = ({ role, campusId }: { role: string; campusId: string }) => {
  const { data: session } = useSession();
  
  // Convert the role to kebab-case for feature lookup
  const normalizedFeatureRole = role.toLowerCase().replace(/_/g, '-');
  // Convert the role to UPPER_SNAKE_CASE for layout lookup
  const normalizedLayoutRole = role.toUpperCase().replace(/-/g, '_') as keyof typeof DefaultRoles;

  const layout = RoleLayouts[normalizedLayoutRole];
  const features = DashboardFeatures[normalizedFeatureRole as keyof typeof DashboardFeatures];

  if (!layout || !features) {
    console.error(`No layout or features configuration found for role: ${role}`);
    console.log('Available layouts:', Object.keys(RoleLayouts));
    console.log('Available features:', Object.keys(DashboardFeatures));
    return <div>Dashboard configuration not found for this role.</div>;
  }

  // Filter components based on features
  const allowedComponents = layout.components.filter(component => {
    if (typeof component.component === 'string') {
      return features.includes(component.component.toLowerCase() as DashboardFeature);
    }
    return features.includes((component.component.name?.toLowerCase() ?? '') as DashboardFeature);
  });

  // Convert role string to title case with spaces
  const roleTitle = role
    .toLowerCase()
    .split(/[-_]/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const { data: programs } = api.campus.getInheritedPrograms.useQuery(
    { campusId },
    { enabled: !!campusId }
  );

  const programNames = programs?.map((program: Program) => program.title) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {roleTitle} Dashboard
      </h1>
      <DashboardLayout 
        components={allowedComponents}
        className={layout.type === 'complex' ? 'gap-6' : 'gap-4'}
      />
    </div>
  );
};