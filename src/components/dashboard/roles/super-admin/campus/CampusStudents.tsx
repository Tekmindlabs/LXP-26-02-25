"use client";

import { type FC } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LuGraduationCap, LuSearch } from "react-icons/lu";
import { useState } from "react";
import type { StudentStatus } from "@/types/student";
import type { User } from "@/types/user";
import type { Class } from "@/types/class";

interface CampusStudentsProps {
  campusId: string;
}

interface StudentWithRelations {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  dateOfBirth: Date | null;
  userId: string;
  classId: string | null;
  parentId: string | null;
  status: StudentStatus;
  studentId: string;
  user: User;
  campusClass?: Class & {
    classGroup?: {
      name: string;
    };
  };
}

const CampusStudents: FC<CampusStudentsProps> = ({ campusId }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StudentStatus>("ACTIVE");

  const { data: students, isLoading } = api.campus.getStudents.useQuery<StudentWithRelations[]>({
    campusId,
    search,
    status,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading students...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuGraduationCap className="h-5 w-5" />
              Campus Students
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LuSearch className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="h-8 w-[150px] lg:w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={status ?? ""}
                onValueChange={(value) => setStatus(value as StudentStatus)}
              >
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="GRADUATED">Graduated</SelectItem>
                  <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {students?.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No students found
                </p>
              ) : (
                students?.map((student: StudentWithRelations) => (
                  <Card key={student.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {student.user?.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {student.studentId}
                          </p>
                        </div>
                        <Badge
                          variant={
                            student.status === "ACTIVE"
                              ? "default"
                              : student.status === "GRADUATED"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {student.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <span className="font-medium">Email: </span>
                          {student.user?.email}
                        </div>
                        {student.campusClass && (
                          <>
                            <div>
                              <span className="font-medium">Class: </span>
                              {student.campusClass.name}
                            </div>
                            <div>
                              <span className="font-medium">Class Group: </span>
                              {student.campusClass.classGroup?.name}
                            </div>
                          </>
                        )}
                        <div>
                          <span className="font-medium">Joined: </span>
                          {new Date(student.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampusStudents;
