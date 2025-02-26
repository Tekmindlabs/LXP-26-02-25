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
import { Star, X } from "lucide-react";
import { toast } from "sonner";

interface TeacherCampusAssignmentProps {
  teacherId: string;
}

export default function TeacherCampusAssignment({ teacherId }: TeacherCampusAssignmentProps) {
  const [selectedCampus, setSelectedCampus] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  // Get all available campuses
  const { data: campuses } = api.campus.getAll.useQuery();
  
  // Get campuses for this teacher
  const { data: teacherCampuses, refetch } = api.teacher.getTeacherCampuses.useQuery({
    teacherId,
  });

  // Mutations for managing teacher-campus relationships
  const assignMutation = api.campus.assignTeacherToCampus.useMutation({
    onSuccess: () => {
      toast.success("Teacher assigned to campus successfully");
      void refetch();
      setSelectedCampus("");
      setIsPrimary(false);
    },
    onError: (error) => {
      toast.error(`Failed to assign teacher to campus: ${error.message}`);
    },
  });

  const removeMutation = api.campus.removeTeacherFromCampus.useMutation({
    onSuccess: () => {
      toast.success("Teacher removed from campus successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to remove teacher from campus: ${error.message}`);
    },
  });

  const setPrimaryMutation = api.campus.setPrimaryCampus.useMutation({
    onSuccess: () => {
      toast.success("Primary campus updated successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update primary campus: ${error.message}`);
    },
  });

  // Filter out campuses that the teacher is already assigned to
  const availableCampuses = campuses?.filter(
    (campus) => !teacherCampuses?.some((tc) => tc.id === campus.id)
  );

  const handleAssign = () => {
    if (!selectedCampus) return;

    assignMutation.mutate({
      teacherId,
      campusId: selectedCampus,
      isPrimary,
    });
  };

  const handleRemove = (campusId: string) => {
    if (confirm("Are you sure you want to remove this campus assignment?")) {
      removeMutation.mutate({
        teacherId,
        campusId,
      });
    }
  };

  const handleSetPrimary = (campusId: string) => {
    setPrimaryMutation.mutate({
      teacherId,
      campusId,
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Campus Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assignment Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Assign to Campus</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="campus-select">Select Campus</Label>
              <Select
                value={selectedCampus}
                onValueChange={setSelectedCampus}
              >
                <SelectTrigger id="campus-select">
                  <SelectValue placeholder="Select a campus" />
                </SelectTrigger>
                <SelectContent>
                  {availableCampuses?.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="primary-campus"
                  checked={isPrimary}
                  onCheckedChange={setIsPrimary}
                />
                <Label htmlFor="primary-campus">Set as Primary Campus</Label>
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAssign}
                disabled={!selectedCampus || assignMutation.isPending}
              >
                {assignMutation.isPending ? "Assigning..." : "Assign to Campus"}
              </Button>
            </div>
          </div>
        </div>

        {/* Current Assignments */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Current Assignments</h3>
          {teacherCampuses?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This teacher is not assigned to any campuses.
            </p>
          ) : (
            <div className="space-y-2">
              {teacherCampuses?.map((campus) => (
                <div
                  key={campus.id}
                  className="flex items-center justify-between rounded-md border p-4"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{campus.name}</span>
                    {campus.isPrimary && (
                      <Badge variant="outline" className="bg-yellow-100">
                        <Star className="mr-1 h-3 w-3 text-yellow-500" />
                        Primary
                      </Badge>
                    )}
                    <Badge
                      variant={campus.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {campus.status}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    {!campus.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(campus.id)}
                        disabled={setPrimaryMutation.isPending}
                      >
                        <Star className="mr-1 h-4 w-4" />
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(campus.id)}
                      disabled={removeMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 