'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card } from '@/components/ui/card';
import { CoordinatorForm } from '@/components/forms/CoordinatorForm';
import { useRouter } from 'next/navigation';

interface NewCoordinatorPageProps {
  params: {
    id: string;
    role: string;
  };
}

export default function NewCoordinatorPage({ params }: NewCoordinatorPageProps) {
  const router = useRouter();

  return (
    <DashboardContent>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Add New Coordinator</h2>
        <Card className="p-6">
          <CoordinatorForm
            campusId={params.id}
            onSuccess={() => {
              router.push(`/dashboard/${params.role}/campus/${params.id}/coordinators`);
            }}
          />
        </Card>
      </div>
    </DashboardContent>
  );
} 