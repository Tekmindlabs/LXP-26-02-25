"use client";

import React from 'react';
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

// Define the teacher type based on what the API returns
interface Teacher {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  teacherProfile?: {
    teacherType?: 'CLASS' | 'SUBJECT';
    subjects?: Array<{ subject: { name: string } }>;
    classes?: Array<{ class: { name: string } }>;
  };
}

export default function TeachersPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  // Use params directly - no need for React.use()
  const campusId = params.id;
  const role = params.role;

  // Fetch teachers for this campus
  const { data: teachersData, isLoading, error } = api.campus.getTeachers.useQuery(
    { campusId },
    { retry: false }
  );

  // Safely cast the data or provide a default empty array
  const teachers: Teacher[] = teachersData || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campus Teachers</h2>
        <Link href={`/dashboard/${role}/campus/${campusId}/teachers/new`}>
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
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-red-500">
                  Error loading teachers. Please try again.
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
                    {teacher.teacherProfile?.subjects?.map((s) => s.subject.name).join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    {teacher.teacherProfile?.classes?.map((c) => c.class.name).join(', ') || '-'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/${role}/campus/${campusId}/teachers/${teacher.id}/edit`}>
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