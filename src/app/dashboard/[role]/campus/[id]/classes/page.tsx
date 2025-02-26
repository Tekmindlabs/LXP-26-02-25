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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Class {
  id: string;
  name: string;
  classGroup: {
    id: string;
    name: string;
    program: {
      name: string;
    };
  };
  status: Status;
  studentCount: number;
  teacherCount: number;
}

export default function ClassesPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const router = useRouter();
  const { data: classes, isLoading } = api.campus.getClasses.useQuery({ campusId: params.id });
  const { data: classGroups } = api.campus.getClassGroups.useQuery({ campusId: params.id });

  const columns: ColumnDef<Class>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'classGroup.name',
      header: 'Class Group',
    },
    {
      accessorKey: 'classGroup.program.name',
      header: 'Program',
    },
    {
      accessorKey: 'studentCount',
      header: 'Students',
    },
    {
      accessorKey: 'teacherCount',
      header: 'Teachers',
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
            onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/classes/${row.original.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/classes/${row.original.id}/students`)}
          >
            View Students
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardContent>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Classes</h2>
          <Button onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/classes/new`)}>
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Class Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Class Groups</SelectItem>
                {classGroups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={classes || []}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </DashboardContent>
  );
} 