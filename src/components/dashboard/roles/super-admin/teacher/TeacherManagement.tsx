'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BulkTeacherUpload } from "./BulkTeacherUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Status } from "@prisma/client";
import { api } from "@/utils/api";
import { TeacherList } from "./TeacherList";
import { Teacher } from "@/types/user";

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  classGroup: {
    name: string;
  };
}

interface SearchFilters {
  search: string;
  subjectId?: string;
  classId?: string;
  status?: Status;
  campusId?: string;
}

interface TeacherManagementProps {
  role: string;
  campusId?: string;
  campusName?: string;
}

export const TeacherManagement = ({ role, campusId, campusName }: TeacherManagementProps) => {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    subjectId: "ALL",
    classId: "ALL",
    status: undefined,
    campusId: campusId
  });

  // Process filters before making API calls
  const processedFilters = {
    search: filters.search,
    subjectId: filters.subjectId === "ALL" ? undefined : filters.subjectId,
    classId: filters.classId === "ALL" ? undefined : filters.classId,
    status: filters.status === "ALL" ? undefined : filters.status,
    campusId: filters.campusId
  };

  // API queries with proper typing
  const { data: teachers, isLoading } = api.teacher.searchTeachers.useQuery(processedFilters);
  const { data: subjects } = api.subject.searchSubjects.useQuery({
    campusId: campusId
  });
  const { data: classes } = api.class.searchClasses.useQuery({
    campusId: campusId
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {campusName ? `${campusName} - Teachers` : 'Teacher Management'}
          </CardTitle>
          <div className="flex items-center gap-4">
            {!campusId && <BulkTeacherUpload />}
            <Button onClick={() => router.push(`/dashboard/${role}/teacher/create${campusId ? `?campusId=${campusId}` : ''}`)}>
              Add Teacher
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex space-x-4">
              <Input
                placeholder="Search teachers..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="max-w-sm"
              />
              <Select
                value={filters.subjectId}
                onValueChange={(value) => setFilters({ ...filters, subjectId: value })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Subjects</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.classId}
                onValueChange={(value) => setFilters({ ...filters, classId: value })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status || "ALL"}
                onValueChange={(value) => setFilters({ ...filters, status: value === "ALL" ? undefined : value as Status })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  {Object.values(Status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TeacherList
            teachers={teachers || []}
            onSelect={(id) => router.push(`/dashboard/${role}/teacher/${id}`)}
            onEdit={(id) => router.push(`/dashboard/${role}/teacher/${id}/edit${campusId ? `?campusId=${campusId}` : ''}`)}
          />

        </CardContent>
      </Card>
    </div>
  );
};

