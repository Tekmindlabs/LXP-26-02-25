'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Status } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgramAssignment {
  id: string;
  program: {
    id: string;
    name: string;
    description: string | null;
  };
  status: Status;
  classGroupCount: number;
}

interface ClassGroupAssignment {
  id: string;
  classGroup: {
    id: string;
    name: string;
    program: {
      name: string;
    };
  };
  status: Status;
  classCount: number;
  studentCount: number;
}

interface CoordinatorWithProfile {
  id: string;
  name: string;
  email: string;
  coordinatorProfile: {
    specialization: string | null;
    coordinatorType: string | null;
  };
}

export default function CoordinatorAssignmentsPage({
  params,
}: {
  params: { id: string; role: string; coordinatorId: string };
}) {
  const router = useRouter();
  const { data: coordinator, isLoading: coordinatorLoading } = api.coordinator.getOne.useQuery(
    { coordinatorId: params.coordinatorId },
    { enabled: !!params.coordinatorId }
  );

  const { data: assignments, isLoading: assignmentsLoading } = api.coordinator.getAssignments.useQuery(
    { coordinatorId: params.coordinatorId, campusId: params.id },
    { enabled: !!params.coordinatorId }
  );

  const programColumns: ColumnDef<ProgramAssignment>[] = [
    {
      accessorKey: 'program.name',
      header: 'Program',
    },
    {
      accessorKey: 'program.description',
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Handle removing program assignment
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  const classGroupColumns: ColumnDef<ClassGroupAssignment>[] = [
    {
      accessorKey: 'classGroup.name',
      header: 'Class Group',
    },
    {
      accessorKey: 'classGroup.program.name',
      header: 'Program',
    },
    {
      accessorKey: 'classCount',
      header: 'Classes',
    },
    {
      accessorKey: 'studentCount',
      header: 'Students',
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Handle removing class group assignment
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  if (coordinatorLoading) {
    return (
      <DashboardContent>
        <div className="space-y-6">
          <Skeleton className="h-8 w-[300px]" />
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{coordinator.name}</h2>
          <p className="text-muted-foreground">
            {coordinator.coordinatorProfile?.specialization || 'No specialization'} •{' '}
            {coordinator.coordinatorProfile?.coordinatorType || 'No type specified'}
          </p>
        </div>

        <Tabs defaultValue="programs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="classGroups">Class Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="programs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Program Assignments</CardTitle>
                <Button onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/coordinators/${params.coordinatorId}/assignments/programs/new`)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Program
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={programColumns}
                  data={assignments?.programs || []}
                  loading={assignmentsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classGroups">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Class Group Assignments</CardTitle>
                <Button onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/coordinators/${params.coordinatorId}/assignments/class-groups/new`)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Class Group
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={classGroupColumns}
                  data={assignments?.classGroups || []}
                  loading={assignmentsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardContent>
  );
} 