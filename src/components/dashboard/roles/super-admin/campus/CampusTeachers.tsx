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
import { Users2, Search } from "lucide-react";
import { useState } from "react";
import { type Status } from "@prisma/client";

interface CampusTeachersProps {
  campusId: string;
}

// Define the teacher type based on the API response
interface TeacherWithClasses {
  id: string;
  name: string | null;
  email: string | null;
  status: Status;
  isPrimary: boolean;
  teacherType: string | null;
  specialization: string | null;
  classes: {
    id: string;
    name: string;
    classGroup: {
      id: string;
      name: string;
    };
    subject: {
      id: string;
      name: string;
    };
  }[];
}

const CampusTeachers: FC<CampusTeachersProps> = ({ campusId }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: teachers, isLoading } = api.campus.getTeachers.useQuery({
    campusId,
    search,
    includeInactive: status === "ALL" || includeInactive,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading teachers...</CardTitle>
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
              <Users2 className="h-5 w-5" />
              Campus Teachers
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
                  className="h-8 w-[150px] lg:w-[250px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as "ACTIVE" | "INACTIVE" | "ALL");
                  setIncludeInactive(value === "ALL" || value === "INACTIVE");
                }}
              >
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {teachers?.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No teachers found
                </p>
              ) : (
                teachers?.map((teacher: TeacherWithClasses) => (
                  <Card key={teacher.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {teacher.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {teacher.id}
                          </p>
                        </div>
                        <Badge
                          variant={
                            teacher.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {teacher.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <span className="font-medium">Email: </span>
                          {teacher.email}
                        </div>
                        <div>
                          <span className="font-medium">Teaching Assignments: </span>
                          <div className="mt-2 space-y-2">
                            {teacher.classes.map((classItem) => (
                              <div
                                key={classItem.id}
                                className="rounded-lg border p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {classItem.name}
                                  </span>
                                  <Badge variant="outline">
                                    {classItem.subject.name}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {classItem.classGroup.name}
                                </p>
                              </div>
                            ))}
                          </div>
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

export default CampusTeachers;
