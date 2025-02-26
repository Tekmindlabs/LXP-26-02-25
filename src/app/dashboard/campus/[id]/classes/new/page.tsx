"use client";

import { type FC } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type AppRouter } from "@/server/api/root";

const createClassSchema = z.object({
  name: z.string().min(1, "Name is required"),
  classGroupId: z.string().min(1, "Class group is required"),
  buildingId: z.string().optional(),
  roomId: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

const CreateClassPage: FC = () => {
  const pathname = usePathname();
  const campusId = pathname.split("/")[3]; // Get ID from path
  const router = useRouter();
  const { toast } = useToast();

  const { data: campus } = api.campus.getById.useQuery(campusId);
  const { data: classGroups } = api.campus.getClassGroups.useQuery({ campusId });
  const { data: buildings } = api.campus.getBuildings.useQuery({ campusId });
  const { data: rooms } = api.campus.getRooms.useQuery({ campusId });

  const { mutate: createClass, isPending } = api.class.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class created successfully",
      });
      router.push(`/dashboard/campus/${campusId}/classes`);
      router.refresh();
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      capacity: 30,
    },
  });

  const onSubmit = (data: CreateClassForm) => {
    createClass({
      ...data,
      campusId,
    });
  };

  if (!campus) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Class</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classGroupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classGroups?.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buildingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a building" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {buildings?.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms?.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
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
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              Create Class
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateClassPage;
