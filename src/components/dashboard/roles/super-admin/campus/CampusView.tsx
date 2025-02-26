"use client";

import { type FC, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LuMapPin, LuPhone, LuMail, LuCalendar, LuBuilding, LuPlus } from "react-icons/lu";
import CampusForm from "./CampusForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampusClassGroups from "./CampusClassGroups";
import { CampusPrograms } from "./CampusPrograms";
import CampusClasses from "./CampusClasses";
import CampusTeachers from "./CampusTeachers";
import CampusStudents from "./CampusStudents";
import CampusCoordinators from "./CampusCoordinators";
import { useRouter } from "next/navigation";

interface CampusViewProps {
  id: string;
}

export const CampusView: FC<CampusViewProps> = ({ id }) => {
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const { data: campus, isLoading } = api.campus.getById.useQuery(id);
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!campus) {
    return <div>Campus not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{campus.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={campus.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {campus.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {campus.type} Campus
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsEditFormOpen(true)}>
          Edit Campus
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="classGroups">Class Groups</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="coordinators">Coordinators</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LuBuilding className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Campus Code</p>
                  <p className="text-sm text-muted-foreground">{campus.code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Establishment Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(campus.establishmentDate).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LuMapPin className="h-5 w-5" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{campus.streetAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">City, State</p>
                  <p className="text-sm text-muted-foreground">
                    {campus.city}, {campus.state}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Country</p>
                  <p className="text-sm text-muted-foreground">{campus.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Postal Code</p>
                  <p className="text-sm text-muted-foreground">{campus.postalCode}</p>
                </div>
                {campus.gpsCoordinates && (
                  <div>
                    <p className="text-sm font-medium">GPS Coordinates</p>
                    <p className="text-sm text-muted-foreground">{campus.gpsCoordinates}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LuPhone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Primary Phone</p>
                  <p className="text-sm text-muted-foreground">{campus.primaryPhone}</p>
                </div>
                {campus.secondaryPhone && (
                  <div>
                    <p className="text-sm font-medium">Secondary Phone</p>
                    <p className="text-sm text-muted-foreground">{campus.secondaryPhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{campus.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Emergency Contact</p>
                  <p className="text-sm text-muted-foreground">{campus.emergencyContact}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classGroups">
          <CampusClassGroups campusId={id} />
        </TabsContent>

        <TabsContent value="programs">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${id}/associate-program`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Associate Program
            </Button>
          </div>
          <CampusPrograms campusId={id} />
        </TabsContent>

        <TabsContent value="classes">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${id}/classes/new`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Create Class
            </Button>
          </div>
          <CampusClasses campusId={id} />
        </TabsContent>

        <TabsContent value="teachers">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${id}/teachers/new`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </div>
          <CampusTeachers campusId={id} />
        </TabsContent>

        <TabsContent value="students">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${id}/students/new`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
          <CampusStudents campusId={id} />
        </TabsContent>

        <TabsContent value="coordinators">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => router.push(`/dashboard/campus/${id}/coordinators/new`)}>
              <LuPlus className="mr-2 h-4 w-4" />
              Add Coordinator
            </Button>
          </div>
          <CampusCoordinators campusId={id} />
        </TabsContent>
      </Tabs>

      {isEditFormOpen && (
        <CampusForm 
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          campusId={id}
        />
      )}
    </div>
  );
};