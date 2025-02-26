import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { RoomForm } from "./RoomForm";
import { useToast } from "../../../../../../hooks/use-toast";
import type { Room } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, DoorClosed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RoomManagementProps {
  wingId: string;
}

export const RoomManagement = ({ wingId }: RoomManagementProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { toast } = useToast();

  const { data: rooms, refetch, isLoading } = api.room.getAll.useQuery({ wingId });
  const deleteMutation = api.room.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Room deleted",
        description: "The room has been deleted successfully",
      });
      refetch();
    },
  });

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
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
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <DoorClosed className="h-4 w-4" />
            Rooms
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage rooms in this wing
          </p>
        </div>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms?.map((room) => (
          <Card key={room.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  Room {room.number}
                  <Badge 
                    variant={
                      room.status === "ACTIVE" 
                        ? "default" 
                        : room.status === "MAINTENANCE" 
                        ? "warning" 
                        : "secondary"
                    }
                  >
                    {room.status.toLowerCase()}
                  </Badge>
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(room)}>
                      Edit Room
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(room.id)}
                    >
                      Delete Room
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Type:</span>
                  <span>{room.type.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Capacity:</span>
                  <span>{room.capacity}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rooms?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-6 text-center text-muted-foreground">
              No rooms added yet. Click "Add Room" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <RoomForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        wingId={wingId}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedRoom(null);
          refetch();
        }}
      />
    </div>
  );
};