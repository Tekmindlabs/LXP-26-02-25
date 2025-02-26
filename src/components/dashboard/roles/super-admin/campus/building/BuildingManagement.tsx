import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BuildingForm } from "./BuildingForm";
import { useToast } from "../../../../../../hooks/use-toast";
import type { Building } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Building2 } from "lucide-react";
import { FC } from "react";
import { BuildingDetails } from "./BuildingDetails";
import { Skeleton } from "@/components/ui/skeleton";

interface BuildingManagementProps {
  campusId: string;
}

export const BuildingManagement: FC<BuildingManagementProps> = ({ campusId }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedBuildingForDetails, setSelectedBuildingForDetails] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: campus } = api.campus.getById.useQuery(campusId);
  const { data: buildings, refetch } = api.building.getAll.useQuery({ campusId });
  
  const deleteMutation = api.building.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Building deleted",
        description: "The building has been deleted successfully",
      });
      refetch();
    },
  });

  const handleEdit = (building: Building) => {
    setSelectedBuilding(building);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete building",
        variant: "destructive",
      });
    }
  };

  if (!campus) {
    return <Skeleton className="w-full h-[200px]" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Buildings - {campus.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage buildings for {campus.name} campus
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Building
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {buildings?.map((building) => (
              <Card
                key={building.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setSelectedBuildingForDetails(building.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{building.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Code: {building.code}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(building);
                        }}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(building.id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedBuildingForDetails && (
        <BuildingDetails
          buildingId={selectedBuildingForDetails}
          onUpdate={refetch}
        />
      )}

      <BuildingForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedBuilding(null);
        }}
        building={selectedBuilding}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedBuilding(null);
          refetch();
        }}
        campusId={campusId}
      />
    </div>
  );
};
