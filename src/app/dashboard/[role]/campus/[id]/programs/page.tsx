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

interface Program {
  id: string;
  name: string;
  description: string | null;
  status: Status;
  classGroupCount: number;
}

export default function ProgramsPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const router = useRouter();
  const { id, role } = params;
  const { data: programs, isLoading } = api.campus.getPrograms.useQuery({ campusId: id });

  const columns: ColumnDef<Program>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
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
            onClick={() => router.push(`/dashboard/${role}/campus/${id}/programs/${row.original.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/${role}/campus/${id}/programs/${row.original.id}/class-groups`)}
          >
            View Class Groups
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardContent role={role} campusId={id}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Programs</h2>
          <Button onClick={() => router.push(`/dashboard/${role}/campus/${id}/programs/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Add Program
          </Button>
        </div>

        <Card className="p-6">
          <DataTable
            columns={columns}
            data={programs || []}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </DashboardContent>
  );
} 