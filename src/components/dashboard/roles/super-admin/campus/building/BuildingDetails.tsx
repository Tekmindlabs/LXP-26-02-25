import { type FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FloorManagement } from "./FloorManagement";
import { api } from "@/utils/api";
import { Building } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BuildingSummary } from "./BuildingSummary";

interface BuildingDetailsProps {
  buildingId: string;
  onUpdate: () => void;
}

export const BuildingDetails: FC<BuildingDetailsProps> = ({ buildingId, onUpdate }) => {
  const { data: building, isLoading } = api.building.getById.useQuery({ id: buildingId });

  if (isLoading) {
    return <Skeleton className="w-full h-[200px]" />;
  }

  if (!building) {
    return <div>Building not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{building.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="floors">Floors</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <BuildingSummary building={building as Building & {
              floors: Array<{
                id: string;
                name: string;
                wings: Array<{
                  id: string;
                  name: string;
                  rooms: Array<{
                    id: string;
                    name: string;
                  }>;
                }>;
              }>;
            }} />
          </TabsContent>

          <TabsContent value="floors">
            <FloorManagement buildingId={buildingId} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Building Settings</h3>
              {/* Add building settings here */}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
