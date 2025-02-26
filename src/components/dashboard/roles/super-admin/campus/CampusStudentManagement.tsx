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

export const CampusStudentManagement = ({ campusId }: CampusStudentManagementProps) => {
  const [filters, setFilters] = useState({
    search: '',
    classId: '',
    status: '',
  });

  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useContext();

  const { data: students } = api.student.searchStudents.useQuery({
    campusId,
    ...filters,
  });

  const { data: classes } = api.class.getAll.useQuery({ campusId });

  const deleteStudent = api.student.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
      utils.student.searchStudents.invalidate();
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
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => {
        const cls = row.original.class;
        return cls ? `${cls.name} (${cls.classGroup.name})` : '-';
      },
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
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center gap-2">
            <StudentTransfer
              studentId={student.id}
              currentCampuses={student.campuses}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/super-admin/student/${student.id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this student?')) {
                      deleteStudent.mutate({ id: student.id });
                    }
                  }}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Students</CardTitle>
        <div className="flex items-center gap-4">
          <BulkStudentUpload />
          <Button onClick={() => router.push(`/dashboard/super-admin/student/create?campusId=${campusId}`)}>
            Add Student
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <Input
            placeholder="Search students..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="max-w-sm"
          />
          <Select
            value={filters.classId}
            onValueChange={(value) => setFilters({ ...filters, classId: value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Class" />
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
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {Object.values(Status).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={students || []}
          pagination
        />
      </CardContent>
    </Card>
  );
}; 