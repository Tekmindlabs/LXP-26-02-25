'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Status } from '@prisma/client';

interface Coordinator {
  id: string;
  name: string;
  email: string;
  status: Status;
  coordinatorProfile: {
    specialization: string | null;
    coordinatorType: string | null;
  };
  programCount: number;
  classGroupCount: number;
}

export default function CoordinatorsPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const router = useRouter();
  const { data: coordinators, isLoading } = api.campus.getCoordinators.useQuery({ campusId: params.id });

  const columns: ColumnDef<Coordinator>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'coordinatorProfile.specialization',
      header: 'Specialization',
    },
    {
      accessorKey: 'coordinatorProfile.coordinatorType',
      header: 'Type',
    },
    {
      accessorKey: 'programCount',
      header: 'Programs',
    },
    {
      accessorKey: 'classGroupCount',
      header: 'Class Groups',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/coordinators/${row.original.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/coordinators/${row.original.id}/assignments`)}
          >
            View Assignments
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardContent>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Coordinators</h2>
          <Button onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/coordinators/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Add Coordinator
          </Button>
        </div>

        <Card className="p-6">
          <DataTable
            columns={columns}
            data={coordinators || []}
            loading={isLoading}
          />
        </Card>
      </div>
    </DashboardContent>
  );
} 