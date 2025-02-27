import { StudentManagement } from "@/components/dashboard/roles/super-admin/student/StudentManagement";

interface PageProps {
  params: {
    role: string;
  };
}

export default function StudentPage({ params }: PageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Students</h1>
      </div>
      <StudentManagement />
    </div>
  );
} 