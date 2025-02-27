'use client';

import { StudentForm } from "@/components/dashboard/roles/super-admin/student/StudentForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/utils/api";

export default function CreateStudentPage() {
  const params = useParams();
  const role = params.role as string;
  
  const { data: classes, isLoading } = api.class.searchClasses.useQuery({});
  
  if (isLoading) {
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
        onSuccess={() => {}}
      />
    </div>
  );
} 