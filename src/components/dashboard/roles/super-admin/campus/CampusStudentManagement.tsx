'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Status } from '@prisma/client';
import { api } from '@/utils/api';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { BulkStudentUpload } from '../student/BulkStudentUpload';
import { StudentTransfer } from '../student/StudentTransfer';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CampusStudentManagementProps {
  campusId: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  status: Status;
  class: {
    id: string;
    name: string;
    classGroup: {
      name: string;
    };
  } | null;
  campuses: {
    campusId: string;
    isPrimary: boolean;
  }[];
}

export function CampusStudentManagement({ campusId }: CampusStudentManagementProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState<Status | ''>('');

  const { data: students, isLoading } = api.student.getCampusStudents.useQuery(
    {
      campusId,
      filters: {
        search,
        classId: classId || undefined,
        status: status || undefined,
      },
    },
    {
      enabled: !!campusId,
    }
  );

  const { data: classes } = api.class.searchClasses.useQuery(
    { campusId },
    { enabled: !!campusId }
  );

  const deleteMutation = api.student.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'class.name',
      header: 'Class',
    },
    {
      accessorKey: 'status',
      header: 'Status',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/campus/${campusId}/students/${student.id}/edit`)}
            >
              Edit
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Transfer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <StudentTransfer studentId={student.id} currentCampuses={[campusId]} />
              </DialogContent>
            </Dialog>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete this student?')) {
                  deleteMutation.mutate({ id: student.id });
                }
              }}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Students</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <BulkStudentUpload campusId={campusId} />
            </DialogContent>
          </Dialog>
          <Button onClick={() => router.push(`/dashboard/campus/${campusId}/students/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Classes</SelectItem>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(value) => setStatus(value as Status | '')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={students || []}
        isLoading={isLoading}
      />
    </Card>
  );
} 