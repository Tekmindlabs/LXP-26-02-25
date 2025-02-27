"use client";

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { TeacherManagement } from '@/components/dashboard/roles/super-admin/teacher/TeacherManagement';
import { api } from '@/utils/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { use } from 'react';

interface TeachersPageProps {
  params: Promise<{
    id: string;
    role: string;
  }>;
}

export default function TeachersPage({ params: paramsPromise }: TeachersPageProps) {
  const params = use(paramsPromise);
  const { data: campus, isLoading: isLoadingCampus } = api.campus.getById.useQuery(
    params.id,
    { enabled: !!params.id }
  );

  if (isLoadingCampus) {
    return <LoadingSpinner />;
  }

  if (!campus) {
    return <div>Campus not found</div>;
  }

  return (
    <DashboardContent>
      <TeacherManagement 
        role={params.role}
        campusId={params.id}
        campusName={campus.name}
      />
    </DashboardContent>
  );
}