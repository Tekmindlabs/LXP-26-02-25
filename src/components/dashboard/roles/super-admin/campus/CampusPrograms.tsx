"use client";

import { type FC } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type DefaultErrorShape } from "@trpc/server";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";

interface CampusProgramsProps {
  campusId: string;
}

const ProgramsSkeleton: FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
};

export const CampusPrograms: FC<CampusProgramsProps> = ({ campusId }) => {
  const router = useRouter();

  const {
    data: programs,
    isLoading,
    error,
    refetch
  } = api.campus.getPrograms.useQuery({
    campusId,
    status: "ACTIVE",
  });

  const handleAddProgram = () => {
    router.push(`/dashboard/super-admin/campus/${campusId}/associate-program`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgramsSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Programs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">{error.message}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Programs</h3>
        <Button onClick={handleAddProgram}>
          <Plus className="mr-2 h-4 w-4" />
          Add Program
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Associated Programs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            {programs && programs.length > 0 ? (
              <div className="space-y-4">
                {programs.map((program) => (
                  <Card key={program.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <Badge variant={program.status === "ACTIVE" ? "default" : "secondary"}>
                          {program.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Term System: </span>
                          {program.termSystem}
                        </div>
                        {program.description && (
                          <div>
                            <span className="font-medium">Description: </span>
                            {program.description}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Created: </span>
                          {new Date(program.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            router.push(`/dashboard/campus/${campusId}/programs/${program.id}`)
                          }
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            router.push(`/dashboard/campus/${campusId}/programs/${program.id}/edit`)
                          }
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-sm text-gray-600">
                    No programs found. Click the button above to add a new program.
                  </p>
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
