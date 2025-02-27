'use client';

import { StudentForm } from "@/components/dashboard/roles/super-admin/student/StudentForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { api } from "@/utils/api";

interface PageProps {
  params: {
    role: string;
  };
}

export default function CreateStudentPage({ params }: PageProps) {
  const role = params.role;
  
  const { data: classes, isLoading: isLoadingClasses } = api.class.searchClasses.useQuery({});
  const { data: campuses, isLoading: isLoadingCampuses } = api.campus.getAll.useQuery();
  
  if (isLoadingClasses || isLoadingCampuses) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Enroll New Student</h1>
        <Button asChild variant="outline">
          <Link href={`/dashboard/${role}/student`}>Back to Students</Link>
        </Button>
      </div>
      <StudentForm 
        classes={classes || []}
        campuses={campuses || []}
        onSuccess={() => {}}
      />
    </div>
  );
} 