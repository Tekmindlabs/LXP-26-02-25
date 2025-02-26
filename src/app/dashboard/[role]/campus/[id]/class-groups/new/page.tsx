'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card } from '@/components/ui/card';
import { ClassGroupForm } from '@/components/dashboard/roles/super-admin/class-group/ClassGroupForm';
import { useRouter } from 'next/navigation';

interface NewClassGroupPageProps {
  params: {
    id: string;
    role: string;
  };
}

export default function NewClassGroupPage({ params }: NewClassGroupPageProps) {
  const router = useRouter();

  return (
    <DashboardContent>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Add New Class Group</h2>
        <ClassGroupForm
          campusId={params.id}
          onSuccess={() => router.push(`/dashboard/${params.role}/campus/${params.id}/class-groups`)}
        />
      </Card>
    </DashboardContent>
  );
} 