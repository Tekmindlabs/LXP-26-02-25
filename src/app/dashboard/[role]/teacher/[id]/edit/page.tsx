'use client';

import TeacherForm from "@/components/dashboard/roles/super-admin/teacher/TeacherForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditTeacherPage({ params }: PageProps) {
  const { id } = params;
  const routeParams = useParams();
  const role = routeParams.role as string;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Teacher</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/${role}/teacher/${id}`}>View Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/${role}/teacher`}>Back to Teachers</Link>
          </Button>
        </div>
      </div>
      <TeacherForm teacherId={id} />
    </div>
  );
} 