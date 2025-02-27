'use client';

import { useSession } from "next-auth/react";
import { DefaultRoles } from "@/utils/permissions";
import { DashboardFeature } from "@/types/dashboard";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { RoleLayouts } from "./layouts/RoleLayouts";
import { DashboardFeatures } from "./features/DashboardFeatures";
import { api } from "@/trpc/react";
import type { Program } from "@prisma/client";
import { type ReactNode } from "react";

interface DashboardContentProps {
  role?: string;
  campusId?: string;
  children?: ReactNode;
}

export const DashboardContent = ({ role, campusId, children }: DashboardContentProps) => {
  const { data: session } = useSession();
  
  // Add null checks for role
  if (!role) {
    return <div className="space-y-6">{children}</div>;
  }
  
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
    // For non-string components, try to get the name safely
    let componentName = '';
    try {
      if (component.component && typeof component.component === 'object' && 'name' in component.component) {
        componentName = (component.component.name as string).toLowerCase();
      }
    } catch (e) {
      console.error('Error accessing component name:', e);
    }
    return features.includes(componentName as DashboardFeature);
  });

  // Convert role string to title case with spaces
  const roleTitle = role
    .toLowerCase()
    .split(/[-_]/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="space-y-6">
      {children}
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