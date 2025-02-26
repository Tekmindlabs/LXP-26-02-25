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

interface TeacherAssignment {
  id: string;
  class: {
    id: string;
    name: string;
    classGroup: {
      id: string;
      name: string;
      program: {
        name: string;
      };
    };
  };
  subject: {
    id: string;
    name: string;
  };
  status: Status;
}

interface TeacherWithProfile {
  id: string;
  name: string;
  email: string;
  teacherProfile: {
    specialization: string | null;
    teacherType: string | null;
  };
}

export default function TeacherAssignmentsPage({
  params,
}: {
  params: { id: string; role: string; teacherId: string };
}) {
  const router = useRouter();
  const { data: teacher, isLoading: teacherLoading } = api.teacher.get.useQuery(
    { id: params.teacherId },
    { enabled: !!params.teacherId }
  );

  const { data: assignments, isLoading: assignmentsLoading } = api.teacher.assignments.useQuery(
    { teacherId: params.teacherId, campusId: params.id },
    { enabled: !!params.teacherId }
  );

  const columns: ColumnDef<TeacherAssignment>[] = [
    {
      accessorKey: 'class.name',
      header: 'Class',
    },
    {
      accessorKey: 'class.classGroup.name',
      header: 'Class Group',
    },
    {
      accessorKey: 'class.classGroup.program.name',
      header: 'Program',
    },
    {
      accessorKey: 'subject.name',
      header: 'Subject',
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
            // Handle removing assignment
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  if (teacherLoading) {
    return (
      <DashboardContent role={params.role} campusId={params.id}>
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

  if (!teacher) {
    return (
      <DashboardContent role={params.role} campusId={params.id}>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Teacher not found</h2>
          <p className="text-muted-foreground">The teacher you are looking for does not exist.</p>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent role={params.role} campusId={params.id}>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{teacher.name}</h2>
          <p className="text-muted-foreground">
            {teacher.teacherProfile?.specialization || 'No specialization'} •{' '}
            {teacher.teacherProfile?.teacherType || 'No type specified'}
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Class & Subject Assignments</CardTitle>
            <Button onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/teachers/${params.teacherId}/assignments/new`)}>
              <Plus className="mr-2 h-4 w-4" /> Add Assignment
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={assignments || []}
              isLoading={assignmentsLoading}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardContent>
  );
} 