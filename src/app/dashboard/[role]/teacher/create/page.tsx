'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import TeacherForm from '@/components/dashboard/roles/super-admin/teacher/TeacherForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { use } from 'react';

interface PageProps {
  params: Promise<{
    role: string;
  }>;
}

export default function CreateTeacherPage({ params }: PageProps) {
  const router = useRouter();
  const { role } = use(params);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TeacherForm
        isCreate
        onSuccess={() => router.push(`/dashboard/${role}/teacher`)}
      />
    </Suspense>
  );
} 