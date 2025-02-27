'use client';

import React from 'react';
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

// Update the Program interface to match the actual data structure
interface Program {
  id: string;
  name: string | null;
  description: string | null;
  status: Status;
  classGroupCount?: number;
  termSystem?: string;
  createdAt?: Date;
  updatedAt?: Date;
  coordinatorId?: string | null;
  calendarId?: string;
}

export default function ProgramsPage({
  params,
}: {
  params: Promise<{ id: string; role: string }>;
}) {
  const router = useRouter();
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const { id, role } = unwrappedParams;
  
  const { data: programs, isLoading } = api.campus.getPrograms.useQuery({ campusId: id });

  const columns: ColumnDef<Program>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.name || 'Unnamed Program',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'classGroupCount',
      header: 'Class Groups',
      cell: ({ row }) => row.original.classGroupCount || 0,
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