"use client";

import { useState } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CampusTeacherManagementProps {
  campusId: string;
}

export default function CampusTeacherManagement({ campusId }: CampusTeacherManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Get teachers for this campus
  const { data: teachers, refetch } = api.campus.getTeachers.useQuery({
    campusId,
    includeInactive,
  });

  // Get all teachers to show in the dialog
  const { data: allTeachers } = api.teacher.searchTeachers.useQuery({
    status: "ACTIVE",
  });

  // Filter out teachers that are already assigned to this campus
  const availableTeachers = allTeachers?.filter(
    (teacher) => !teachers?.some((t) => t.id === teacher.id)
  );

  // Mutations for managing teacher-campus relationships
  const assignMutation = api.campus.assignTeacherToCampus.useMutation({
    onSuccess: () => {
      toast.success("Teacher assigned to campus successfully");
      void refetch();
      setIsOpen(false);
      setSelectedTeacher("");
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

  const updateStatusMutation = api.campus.updateTeacherCampusStatus.useMutation({
    onSuccess: () => {
      toast.success("Teacher status updated successfully");
      void refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update teacher status: ${error.message}`);
    },
  });

  const handleAssign = () => {
    if (!selectedTeacher) return;

    assignMutation.mutate({
      teacherId: selectedTeacher,
      campusId,
      isPrimary,
    });
  };

  const handleRemove = (teacherId: string) => {
    if (confirm("Are you sure you want to remove this teacher from the campus?")) {
      removeMutation.mutate({
        teacherId,
        campusId,
      });
    }
  };

  const handleSetPrimary = (teacherId: string) => {
    setPrimaryMutation.mutate({
      teacherId,
      campusId,
    });
  };

  const handleToggleStatus = (teacherId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateStatusMutation.mutate({
      teacherId,
      campusId,
      status: newStatus as "ACTIVE" | "INACTIVE" | "ARCHIVED",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="include-inactive"
            checked={includeInactive}
            onCheckedChange={setIncludeInactive}
          />
          <Label htmlFor="include-inactive">Include Inactive Teachers</Label>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Teacher to Campus</DialogTitle>
              <DialogDescription>
                Select a teacher to assign to this campus.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="teacher-select">Select Teacher</Label>
                <Select
                  value={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger id="teacher-select">
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers?.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="primary-campus"
                  checked={isPrimary}
                  onCheckedChange={setIsPrimary}
                />
                <Label htmlFor="primary-campus">Set as Primary Campus</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAssign}
                disabled={!selectedTeacher || assignMutation.isPending}
              >
                {assignMutation.isPending ? "Assigning..." : "Assign Teacher"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campus Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No teachers assigned to this campus.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers?.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          teacher.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {teacher.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {teacher.isPrimary ? (
                        <Badge variant="outline" className="bg-yellow-100">
                          <Star className="mr-1 h-3 w-3 text-yellow-500" />
                          Primary
                        </Badge>
                      ) : (
                        "No"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(teacher.id, teacher.status)
                          }
                        >
                          {teacher.status === "ACTIVE"
                            ? "Deactivate"
                            : "Activate"}
                        </Button>
                        {!teacher.isPrimary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(teacher.id)}
                          >
                            <Star className="mr-1 h-4 w-4" />
                            Set Primary
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemove(teacher.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 