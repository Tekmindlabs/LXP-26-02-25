'use client';

import { StudentForm } from '@/components/dashboard/roles/super-admin/student/StudentForm';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { withCampusPermission } from '@/components/hoc/withCampusPermission';
import { CampusPermission } from '@/types/enums';
import { Card } from '@/components/ui/card';

interface NewStudentPageProps {
  params: {
    id: string;
    role: string;
  };
}

function NewStudentPage({ params }: NewStudentPageProps) {
  return (
    <DashboardContent>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Add New Student</h2>
        <StudentForm campusId={params.id} />
      </Card>
    </DashboardContent>
  );
}

export default withCampusPermission(NewStudentPage, CampusPermission.MANAGE_CAMPUS_STUDENTS);
