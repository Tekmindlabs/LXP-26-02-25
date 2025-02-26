'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card } from '@/components/ui/card';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramForm } from '@/components/dashboard/roles/super-admin/program/ProgramForm';

interface EditProgramPageProps {
  params: {
    id: string;
    role: string;
    programId: string;
  };
}

export default function EditProgramPage({ params }: EditProgramPageProps) {
  const { data: program, isLoading } = api.program.getOne.useQuery(
    { id: params.programId },
    { enabled: !!params.programId }
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <Card className="p-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </DashboardContent>
    );
  }

  if (!program) {
    return (
      <DashboardContent>
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Program not found</h2>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Program</h2>
        <ProgramForm
          campusId={params.id}
          initialData={program}
          onSuccess={() => router.push(`/dashboard/${params.role}/campus/${params.id}/programs`)}
        />
      </Card>
    </DashboardContent>
  );
} 