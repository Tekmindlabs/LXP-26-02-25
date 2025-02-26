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

interface ClassGroup {
  id: string;
  name: string;
  program: {
    name: string;
  };
  status: Status;
  classCount: number;
}

export default function ClassGroupsPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const router = useRouter();
  const { data: classGroups, isLoading } = api.campus.getClassGroups.useQuery({ campusId: params.id });

  const columns: ColumnDef<ClassGroup>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'program.name',
      header: 'Program',
    },
    {
      accessorKey: 'classCount',
      header: 'Classes',
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
            onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/class-groups/${row.original.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/class-groups/${row.original.id}/classes`)}
          >
            View Classes
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardContent>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Class Groups</h2>
          <Button onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/class-groups/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Add Class Group
          </Button>
        </div>

        <Card className="p-6">
          <DataTable
            columns={columns}
            data={classGroups || []}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </DashboardContent>
  );
} 