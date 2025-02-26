'use client';

import { StudentForm } from '@/components/dashboard/roles/super-admin/student/StudentForm';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { withCampusPermission } from '@/components/hoc/withCampusPermission';
import { CampusPermission } from '@/types/enums';
import { Card } from '@/components/ui/card';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';

interface EditStudentPageProps {
  params: {
    id: string;
    role: string;
    studentId: string;
  };
}

function EditStudentPage({ params }: EditStudentPageProps) {
  const { data: student, isLoading } = api.student.getOne.useQuery(
    { id: params.studentId },
    { enabled: !!params.studentId }
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <Card className="p-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </DashboardContent>
    );
  }

  if (!student) {
    return (
      <DashboardContent>
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Student not found</h2>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Student</h2>
        <StudentForm campusId={params.id} selectedStudent={student} />
      </Card>
    </DashboardContent>
  );
}

export default withCampusPermission(EditStudentPage, CampusPermission.MANAGE_CAMPUS_STUDENTS); 