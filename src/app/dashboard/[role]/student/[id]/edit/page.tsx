'use client';

import { StudentForm } from "@/components/dashboard/roles/super-admin/student/StudentForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/utils/api";

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditStudentPage({ params }: PageProps) {
  const { id } = params;
  const routeParams = useParams();
  const role = routeParams.role as string;
  
  const { data: classes, isLoading: classesLoading } = api.class.searchClasses.useQuery({});
  const { data: student, isLoading: studentLoading } = api.student.getById.useQuery({ id });
  
  if (classesLoading || studentLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Student</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/${role}/student/${id}`}>View Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/${role}/student`}>Back to Students</Link>
          </Button>
        </div>
      </div>
      <StudentForm 
        selectedStudent={student}
        classes={classes || []}
        onSuccess={() => {}}
      />
    </div>
  );
} 