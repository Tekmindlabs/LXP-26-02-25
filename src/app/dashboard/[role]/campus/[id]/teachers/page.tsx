"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/utils/api";
import { Badge } from "@/components/ui/badge";

export default function TeachersPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const campusId = params.id;

  // Fetch teachers for this campus
  const { data: teachers = [], isLoading } = api.campus.getTeachers.useQuery({
    campusId
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campus Teachers</h2>
        <Link href={`/dashboard/${params.role}/campus/${campusId}/teachers/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading teachers...
                </TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No teachers found
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.phoneNumber || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {teacher.teacherProfile?.teacherType === 'CLASS' ? 'Class Teacher' : 'Subject Teacher'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {teacher.teacherProfile?.subjects?.map(s => s.subject.name).join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    {teacher.teacherProfile?.classes?.map(c => c.class.name).join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/${params.role}/campus/${campusId}/teachers/${teacher.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
