import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/utils/api";
import { useToast } from "../../../../../../hooks/use-toast";
import type { Room, RoomType, RoomStatus } from "@prisma/client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const roomSchema = z.object({
  number: z.string().min(1, "Room number is required"),
  type: z.enum(["CLASSROOM", "LAB", "ACTIVITY_ROOM", "LECTURE_HALL"]),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface RoomFormProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room | null;
  wingId: string;
  onSuccess: () => void;
}

export const RoomForm = ({
  isOpen,
  onClose,
  room,
  wingId,
  onSuccess,
}: RoomFormProps) => {
  const { toast } = useToast();
  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      number: room?.number ?? "",
      type: room?.type ?? "CLASSROOM",
      capacity: room?.capacity ?? 30,
      status: room?.status ?? "ACTIVE",
    },
  });

  // Reset form when room changes
  React.useEffect(() => {
    if (room) {
      form.reset({
        number: room.number,
        type: room.type,
        capacity: room.capacity,
        status: room.status,
      });
    }
  }, [room, form]);

  const createMutation = api.room.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Room created",
        description: "The room has been created successfully",
      });
      form.reset();
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
        variant: "destructive",
      });
    },
  });

  const updateMutation = api.room.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Room updated",
        description: "The room has been updated successfully",
      });
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update room",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RoomFormData) => {
    try {
      if (room) {
        await updateMutation.mutateAsync({
          id: room.id,
          ...data,
        });
      } else {
        await createMutation.mutateAsync({
          wingId,
          ...data,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save room",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{room ? "Edit Room" : "Add Room"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Room number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CLASSROOM">Classroom</SelectItem>
                      <SelectItem value="LAB">Laboratory</SelectItem>
                      <SelectItem value="ACTIVITY_ROOM">Activity Room</SelectItem>
                      <SelectItem value="LECTURE_HALL">Lecture Hall</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Room capacity"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {room ? "Update Room" : "Create Room"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
