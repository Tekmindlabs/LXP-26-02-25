"use client";

import { type FC } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Status } from "@prisma/client";

interface CoordinatorWithUser {
  id: string;
  status: Status;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
}

interface CampusCoordinatorsProps {
  campusId: string;
}

const CampusCoordinators: FC<CampusCoordinatorsProps> = ({ campusId }) => {
  const router = useRouter();
  const { data: coordinators, isLoading } = api.coordinator.getAllByCampus.useQuery({
    campusId,
    status: "ACTIVE",
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading coordinators...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!coordinators?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No coordinators</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This campus has no coordinators assigned.
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
            <Users2 className="h-5 w-5" />
            Campus Coordinators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {coordinators.map((coordinator: CoordinatorWithUser) => (
                <Card key={coordinator.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {coordinator.user.firstName} {coordinator.user.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={coordinator.status === "ACTIVE" ? "default" : "secondary"}>
                          {coordinator.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/campus/${campusId}/coordinators/${coordinator.id}/edit`)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Email: </span>
                        {coordinator.user.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone: </span>
                        {coordinator.user.phone || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Joined: </span>
                        {new Date(coordinator.createdAt).toLocaleDateString()}
                      </div>
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

export default CampusCoordinators;
