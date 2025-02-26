'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card } from '@/components/ui/card';
import { ProgramForm } from '@/components/dashboard/roles/super-admin/program/ProgramForm';
import { useRouter } from 'next/navigation';

interface NewProgramPageProps {
  params: {
    id: string;
    role: string;
  };
}

export default function NewProgramPage({ params }: NewProgramPageProps) {
  const router = useRouter();

  return (
    <DashboardContent>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Add New Program</h2>
        <ProgramForm
          campusId={params.id}
          onSuccess={() => router.push(`/dashboard/${params.role}/campus/${params.id}/programs`)}
        />
      </Card>
    </DashboardContent>
  );
} 