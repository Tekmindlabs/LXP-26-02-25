'use client';

import TeacherForm from "@/components/dashboard/roles/super-admin/teacher/TeacherForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { use } from "react";

interface PageProps {
  params: {
    role: string;
  };
}

export default function CreateTeacherPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { role } = resolvedParams;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add New Teacher</h1>
        <Button asChild variant="outline">
          <Link href={`/dashboard/${role}/teacher`}>Back to Teachers</Link>
        </Button>
      </div>
      <TeacherForm 
        isCreate={true} 
        initialData={{
          teacherType: 'SUBJECT',
          campusIds: [],
          subjectIds: [],
          classIds: []
        }}
      />
    </div>
  );
} 