'use client';

import { Suspense } from 'react';
import TeacherDetails from '@/components/dashboard/roles/super-admin/teacher/TeacherDetails';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
    role: string;
  }>;
}

export default function TeacherDetailsPage({ params }: PageProps) {
  const { id, role } = use(params);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TeacherDetails teacherId={id} role={role} />
    </Suspense>
  );
} 