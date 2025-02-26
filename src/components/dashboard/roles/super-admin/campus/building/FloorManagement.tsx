import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { FloorForm } from "./FloorForm";
import { useToast } from "../../../../../../hooks/use-toast";
import type { Floor } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WingManagement } from "./WingManagement";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface FloorManagementProps {
  buildingId: string;
  onUpdate?: () => void;
}

export const FloorManagement = ({ buildingId, onUpdate }: FloorManagementProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const { toast } = useToast();

  const { data: floors, refetch } = api.floor.getAll.useQuery({ buildingId });
  const deleteMutation = api.floor.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Floor deleted",
        description: "The floor has been deleted successfully",
      });
      refetch();
      onUpdate?.();
    },
  });

  const handleEdit = (floor: Floor) => {
    setSelectedFloor(floor);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete floor",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Floors
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage floors, wings, and rooms in this building
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Floor
        </Button>
      </div>

      <div className="space-y-4">
        {floors?.map((floor) => (
          <Card key={floor.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {floor.name}
                  <Badge variant="outline">{floor.number}</Badge>
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(floor)}>
                      Edit Floor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(floor.id)}
                    >
                      Delete Floor
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="wings">
                  <AccordionTrigger>Wings</AccordionTrigger>
                  <AccordionContent>
                    <WingManagement
                      floorId={floor.id}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {floors?.length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              No floors added yet. Click "Add Floor" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <FloorForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedFloor(null);
        }}
        floor={selectedFloor}
        buildingId={buildingId}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedFloor(null);
          refetch();
          onUpdate?.();
        }}
      />
    </div>
  );
};
