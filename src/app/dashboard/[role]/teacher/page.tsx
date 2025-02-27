import { TeacherManagement } from "@/components/dashboard/roles/super-admin/teacher/TeacherManagement";

interface PageProps {
  params: {
    role: string;
  };
}

export default function TeacherPage({ params }: PageProps) {
  const { role } = params;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teachers</h1>
      </div>
      <TeacherManagement role={role} />
    </div>
  );
} 