"use client";

import { type FC } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Plus } from "lucide-react";
import { useState } from "react";
import { Status } from "@prisma/client";

type ClassStatus = "ACTIVE" | "INACTIVE" | "COMPLETED";

interface CampusClassWithRelations {
  id: string;
  name: string;
  status: ClassStatus;
  classGroup: {
    name: string;
    program: {
      name: string;
    };
  };
  _count: {
    students: number;
    teachers: number;
  };
  teachers: Array<{
    id: string;
    teacher: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
    subject: {
      name: string | null;
    };
  }>;
}

interface CampusClassesProps {
  campusId: string;
}

const CampusClasses: FC<CampusClassesProps> = ({ campusId }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClassStatus | undefined>("ACTIVE");
  const router = useRouter();

  const { data: classes, isLoading } = api.campus.getClasses.useQuery({
    campusId,
    search,
    status,
  });

  const handleAddClass = () => {
    router.push(`/dashboard/super-admin/campus/${campusId}/classes/new`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading classes...</CardTitle>
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
              <Users className="h-5 w-5" />
              Campus Classes
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  className="h-8 pl-8 w-[150px] lg:w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={status ?? "ALL"}
                onValueChange={(value) =>
                  setStatus(value === "ALL" ? undefined : value as ClassStatus)
                }
              >
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8"
                onClick={handleAddClass}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {classes?.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No classes found
                </p>
              ) : (
                classes?.map((campusClass: CampusClassWithRelations) => (
                  <Card key={campusClass.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {campusClass.name}
                          </CardTitle>
                        </div>
                        <Badge
                          variant={
                            campusClass.status === "ACTIVE"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {campusClass.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <span className="font-medium">Program: </span>
                          {campusClass.classGroup.program.name}
                        </div>
                        <div>
                          <span className="font-medium">Class Group: </span>
                          {campusClass.classGroup.name}
                        </div>
                        <div>
                          <span className="font-medium">Students: </span>
                          {campusClass._count?.students ?? 0}
                        </div>
                        <div>
                          <span className="font-medium">Teachers: </span>
                          {campusClass._count?.teachers ?? 0}
                        </div>
                        <div className="mt-1 space-y-1">
                          {campusClass.teachers.map((teacher) => (
                            <div
                              key={teacher.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                {teacher.teacher.user.firstName} {teacher.teacher.user.lastName}
                              </span>
                              <span className="text-gray-500">
                                {teacher.subject?.name ?? 'No Subject'}
                              </span>
                            </div>
                          ))}
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

export default CampusClasses;
