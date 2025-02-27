'use client';

import TeacherProfileView from "@/components/dashboard/roles/super-admin/teacher/TeacherProfileView";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { use } from "react";

interface PageProps {
  params: {
    id: string;
    role: string;
  };
}

export default function TeacherDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id, role } = resolvedParams;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teacher Profile</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/${role}/teacher/${id}/edit`}>Edit Teacher</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/${role}/teacher`}>Back to Teachers</Link>
          </Button>
        </div>
      </div>
      <TeacherProfileView teacherId={id} />
    </div>
  );
} 