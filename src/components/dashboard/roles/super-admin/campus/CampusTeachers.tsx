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

interface CampusTeachersProps {
  campusId: string;
}

const CampusTeachers: FC<CampusTeachersProps> = ({ campusId }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | undefined>("ACTIVE");

  const { data: teachers, isLoading } = api.campus.getTeachers.useQuery({
    campusId,
    search,
    status,
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
                onValueChange={(value: typeof status) => setStatus(value)}
              >
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                teachers?.map((teacher) => (
                  <Card key={teacher.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {teacher.user.firstName} {teacher.user.lastName}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {teacher.teacherId}
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
                          {teacher.user.email}
                        </div>

                        <div>
                          <span className="font-medium">Teaching Assignments: </span>
                          <div className="mt-2 space-y-2">
                            {teacher.teacherAllocations.map((allocation) => (
                              <div
                                key={allocation.id}
                                className="rounded-lg border p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {allocation.campusClass.name}
                                  </span>
                                  <Badge variant="outline">
                                    {allocation.subject.name}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {allocation.campusClass.classGroup.name}
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

