'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card } from '@/components/ui/card';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { CoordinatorForm } from '@/components/forms/CoordinatorForm';
import { useRouter } from 'next/navigation';

interface EditCoordinatorPageProps {
  params: {
    id: string;
    role: string;
    coordinatorId: string;
  };
}

export default function EditCoordinatorPage({ params }: EditCoordinatorPageProps) {
  const router = useRouter();
  const { data: coordinator, isLoading } = api.coordinator.getOne.useQuery(
    { coordinatorId: params.coordinatorId },
    { enabled: !!params.coordinatorId }
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="space-y-6">
          <Skeleton className="h-8 w-[300px]" />
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      </DashboardContent>
    );
  }

  if (!coordinator) {
    return (
      <DashboardContent>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Coordinator not found</h2>
          <p className="text-muted-foreground">The coordinator you are looking for does not exist.</p>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Edit Coordinator</h2>
        <Card className="p-6">
          <CoordinatorForm
            campusId={params.id}
            initialData={coordinator}
            onSuccess={() => {
              router.push(`/dashboard/${params.role}/campus/${params.id}/coordinators`);
            }}
          />
        </Card>
      </div>
    </DashboardContent>
  );
} 