'use client';

import { StudentDetails } from "@/components/dashboard/roles/super-admin/student/StudentDetails";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default function StudentDetailPage({ params }: PageProps) {
  const { id } = params;
  const routeParams = useParams();
  const role = routeParams.role as string;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Student Profile</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/${role}/student/${id}/edit`}>Edit Student</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/${role}/student`}>Back to Students</Link>
          </Button>
        </div>
      </div>
      <StudentDetails 
        studentId={id} 
        onBack={() => {}}
      />
    </div>
  );
} 