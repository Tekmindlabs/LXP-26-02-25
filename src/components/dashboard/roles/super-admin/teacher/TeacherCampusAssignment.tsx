"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, StarOff, X } from "lucide-react";
import { toast } from "sonner";
import { type Status } from "@prisma/client";

interface TeacherCampusAssignmentProps {
  teacherId: string;
}

// Define the campus type based on the API response
interface CampusWithAssignment {
  id: string;
  name: string;
  status: Status;
  isPrimary: boolean;
  joinedAt: Date;
  campusId: string;
}

// Define a simple campus type
interface Campus {
  id: string;
  name: string;
  code?: string;
  type?: string;
  status?: Status;
}

const TeacherCampusAssignment: React.FC<TeacherCampusAssignmentProps> = ({
  teacherId,
}) => {
  const [selectedCampus, setSelectedCampus] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Fetch all available campuses
  const { data: allCampuses } = api.campus.getAll.useQuery();

  // Fetch campuses assigned to this teacher
  const { 
    data: assignedCampuses, 
    refetch: refetchAssignedCampuses 
  } = api.campus.getTeacherCampuses.useQuery({ teacherId });

  // Mutations
  const assignCampusMutation = api.campus.assignTeacherToCampus.useMutation({
    onSuccess: () => {
      toast.success("Campus assigned successfully");
      setSelectedCampus("");
      setIsPrimary(false);
      void refetchAssignedCampuses();
    },
    onError: (error) => {
      toast.error(`Failed to assign campus: ${error.message}`);
    },
  });

  const removeCampusMutation = api.campus.removeTeacherFromCampus.useMutation({
    onSuccess: () => {
      toast.success("Campus removed successfully");
      void refetchAssignedCampuses();
    },
    onError: (error) => {
      toast.error(`Failed to remove campus: ${error.message}`);
    },
  });

  const setPrimaryCampusMutation = api.campus.setPrimaryCampus.useMutation({
    onSuccess: () => {
      toast.success("Primary campus set successfully");
      void refetchAssignedCampuses();
    },
    onError: (error) => {
      toast.error(`Failed to set primary campus: ${error.message}`);
    },
  });

  // Filter out already assigned campuses
  const availableCampuses = allCampuses?.filter(
    (campus: Campus) => !assignedCampuses?.some((ac: CampusWithAssignment) => ac.id === campus.id)
  );

  // Handle assignment
  const handleAssign = () => {
    if (!selectedCampus) {
      toast.error("Please select a campus");
      return;
    }

    assignCampusMutation.mutate({
      teacherId,
      campusId: selectedCampus,
      isPrimary,
    });
  };

  // Handle removal
  const handleRemove = (campusId: string) => {
    removeCampusMutation.mutate({
      teacherId,
      campusId,
    });
  };

  // Handle setting primary campus
  const handleSetPrimary = (campusId: string) => {
    setPrimaryCampusMutation.mutate({
      teacherId,
      campusId,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign to Campus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="campus">Select Campus</Label>
                <Select
                  value={selectedCampus}
                  onValueChange={setSelectedCampus}
                >
                  <SelectTrigger id="campus">
                    <SelectValue placeholder="Select a campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCampuses?.map((campus: Campus) => (
                      <SelectItem key={campus.id} value={campus.id}>
                        {campus.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="primary"
                  checked={isPrimary}
                  onCheckedChange={setIsPrimary}
                />
                <Label htmlFor="primary">Set as primary campus</Label>
              </div>
            </div>
            <Button
              onClick={handleAssign}
              disabled={!selectedCampus || assignCampusMutation.isPending}
            >
              {assignCampusMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Campuses</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedCampuses?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No campuses assigned
            </p>
          ) : (
            <div className="space-y-4">
              {assignedCampuses?.map((campus: CampusWithAssignment) => (
                <div
                  key={campus.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{campus.name}</h3>
                      {campus.isPrimary && (
                        <Badge variant="default" className="ml-2">
                          Primary
                        </Badge>
                      )}
                      <Badge
                        variant={
                          campus.status === "ACTIVE" ? "outline" : "secondary"
                        }
                      >
                        {campus.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Joined:{" "}
                      {campus.joinedAt
                        ? new Date(campus.joinedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!campus.isPrimary && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleSetPrimary(campus.id)}
                        disabled={setPrimaryCampusMutation.isPending}
                        title="Set as primary campus"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    {campus.isPrimary && (
                      <Button
                        variant="outline"
                        size="icon"
                        disabled
                        title="Primary campus"
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemove(campus.id)}
                      disabled={removeCampusMutation.isPending}
                      title="Remove from campus"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherCampusAssignment; 