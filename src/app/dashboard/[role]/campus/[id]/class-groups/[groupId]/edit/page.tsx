'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card } from '@/components/ui/card';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassGroupForm } from '@/components/dashboard/roles/super-admin/class-group/ClassGroupForm';
import { useRouter } from 'next/navigation';

interface EditClassGroupPageProps {
  params: {
    id: string;
    role: string;
    groupId: string;
  };
}

export default function EditClassGroupPage({ params }: EditClassGroupPageProps) {
  const router = useRouter();
  const { data: classGroup, isLoading } = api.classGroup.getOne.useQuery(
    { id: params.groupId },
    { enabled: !!params.groupId }
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

  if (!classGroup) {
    return (
      <DashboardContent>
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Class Group not found</h2>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Class Group</h2>
        <ClassGroupForm
          campusId={params.id}
          initialData={classGroup}
          onSuccess={() => router.push(`/dashboard/${params.role}/campus/${params.id}/class-groups`)}
        />
      </Card>
    </DashboardContent>
  );
} 