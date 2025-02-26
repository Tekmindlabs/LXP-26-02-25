"use client";

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card } from '@/components/ui/card';
import { ClassForm } from '@/components/dashboard/roles/super-admin/class/ClassForm';
import { useRouter } from 'next/navigation';

interface NewClassPageProps {
  params: {
    id: string;
    role: string;
  };
}

export default function NewClassPage({ params }: NewClassPageProps) {
  const router = useRouter();

  return (
    <DashboardContent>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Add New Class</h2>
        <ClassForm
          campusId={params.id}
          onSuccess={() => router.push(`/dashboard/${params.role}/campus/${params.id}/classes`)}
        />
      </Card>
    </DashboardContent>
  );
}
