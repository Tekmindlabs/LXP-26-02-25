import { useState, useCallback } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { WingForm } from "@/components/dashboard/roles/super-admin/campus/building/WingForm";
import { useToast } from "@/hooks/use-toast";
import type { Wing } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomManagement } from "./RoomManagement";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WingManagementProps {
  floorId: string;
}

export const WingManagement = ({ floorId }: WingManagementProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWing, setSelectedWing] = useState<Wing | null>(null);
  const { data: wings, refetch } = api.wing.getAll.useQuery({ floorId });
  const { toast } = useToast();

  const deleteMutation = api.wing.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Wing deleted",
        description: "The wing has been deleted successfully",
      });
      void refetch();
    },
  });

  const handleEdit = useCallback((wing: Wing) => {
    setSelectedWing(wing);
    setIsFormOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsFormOpen(false);
    setTimeout(() => {
      setSelectedWing(null);
    }, 0);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete wing",
        variant: "destructive",
      });
    }
  };

  if (!wings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Wings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage wings and their rooms
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Wing
        </Button>
      </div>

      <div className="space-y-4">
        {wings?.map((wing) => (
          <Card key={wing.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {wing.name}
                  <Badge variant="outline">{wing.rooms?.length || 0} rooms</Badge>
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(wing)}>
                      Edit Wing
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(wing.id)}
                    >
                      Delete Wing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="rooms">
                  <AccordionTrigger>Rooms</AccordionTrigger>
                  <AccordionContent>
                    <RoomManagement wingId={wing.id} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {wings?.length === 0 && (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              No wings added yet. Click "Add Wing" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <WingForm
        isOpen={isFormOpen}
        onClose={handleClose}
        wing={selectedWing}
        floorId={floorId}
        onSuccess={() => {
          handleClose();
          refetch();
        }}
      />
    </div>
  );
}