import { useState } from "react";
import { Status, TeacherType, type User } from "@prisma/client";
import { useTeacher } from "@/hooks/useTeacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";

interface TeacherWithProfile extends User {
  teacherProfile: {
    id: string;
    teacherType: TeacherType;
    specialization?: string | null;
    subjects: Array<{ subjectId: string; subject: { name: string } }>;
    classes: Array<{ classId: string; class: { name: string; classGroup: { name: string } } }>;
    campuses: Array<{ campusId: string; campus: { name: string }; isPrimary: boolean }>;
  };
}

interface TeacherListProps {
  campusId?: string;
  onEdit?: (teacher: TeacherWithProfile) => void;
  onView?: (teacher: TeacherWithProfile) => void;
}

export function TeacherList({ campusId, onEdit, onView }: TeacherListProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");

  const { updateTeacherStatus } = useTeacher({
    onSuccess: () => {
      // Refetch teachers after status update
      utils.teacher.searchTeachers.invalidate();
    }
  });

  const utils = api.useContext();

  const { data: teachers, isLoading } = api.teacher.searchTeachers.useQuery({
    search,
    status: status === "ALL" ? undefined : status,
    campusId
  });

  const handleStatusChange = async (teacherId: string, newStatus: Status) => {
    try {
      await updateTeacherStatus(teacherId, newStatus);
    } catch (error) {
      console.error("Failed to update teacher status:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search teachers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as Status | "ALL")}
        >
          <option value="ALL">All Status</option>
          <option value={Status.ACTIVE}>Active</option>
          <option value={Status.INACTIVE}>Inactive</option>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : !teachers || teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No teachers found
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher: TeacherWithProfile) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    {teacher.teacherProfile?.teacherType === TeacherType.CLASS
                      ? "Class Teacher"
                      : "Subject Teacher"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={teacher.status === Status.ACTIVE ? "success" : "destructive"}
                    >
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.teacherProfile?.subjects.map(({ subject }) => (
                        <Badge key={subject.name} variant="secondary">
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.teacherProfile?.classes.map(({ class: cls }) => (
                        <Badge key={cls.name} variant="secondary">
                          {cls.name} ({cls.classGroup.name})
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView?.(teacher)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit?.(teacher)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={teacher.status === Status.ACTIVE ? "destructive" : "default"}
                        size="sm"
                        onClick={() =>
                          handleStatusChange(
                            teacher.id,
                            teacher.status === Status.ACTIVE
                              ? Status.INACTIVE
                              : Status.ACTIVE
                          )
                        }
                      >
                        {teacher.status === Status.ACTIVE ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 