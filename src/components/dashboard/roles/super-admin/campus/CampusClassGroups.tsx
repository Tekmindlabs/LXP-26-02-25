"use client";

import { type FC } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LuBookOpen } from "react-icons/lu";

interface CampusClassGroupsProps {
  campusId: string;
}

const CampusClassGroups: FC<CampusClassGroupsProps> = ({ campusId }) => {
  const { data: classGroups, isLoading } = api.campusClassGroup.getForCampus.useQuery(campusId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading class groups...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!classGroups?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No class groups</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This campus has no inherited class groups.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LuBookOpen className="h-5 w-5" />
            Inherited Class Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {classGroups.map((cg) => (
                <Card key={cg.classGroup.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{cg.classGroup.name}</CardTitle>
                      <Badge variant={cg.classGroup.status === "ACTIVE" ? "default" : "secondary"}>
                        {cg.classGroup.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Program: </span>
                        {cg.classGroup.program.name}
                      </div>
                      <div>
                        <span className="font-medium">Term System: </span>
                        {cg.classGroup.program.termSystem}
                      </div>
                      {cg.classGroup.description && (
                        <div>
                          <span className="font-medium">Description: </span>
                          {cg.classGroup.description}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampusClassGroups;
