'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import TeacherForm from '@/components/dashboard/roles/super-admin/teacher/TeacherForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
    role: string;
  }>;
}

export default function TeacherEditPage({ params }: PageProps) {
  const router = useRouter();
  const { id, role } = use(params);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TeacherForm
        teacherId={id}
        onSuccess={() => router.push(`/dashboard/${role}/teacher`)}
      />
    </Suspense>
  );
} 