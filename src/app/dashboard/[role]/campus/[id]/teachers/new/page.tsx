"use client";

import TeacherForm from "@/components/dashboard/roles/super-admin/teacher/TeacherForm";

export default function NewTeacherPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const campusId = params.id;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Add New Teacher</h2>
      <TeacherForm 
        initialData={{ campusId: campusId }} 
        isCreate={true} 
      />
    </div>
  );
}
