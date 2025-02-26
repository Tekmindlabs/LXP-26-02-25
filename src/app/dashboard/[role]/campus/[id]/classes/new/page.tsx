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
  FormDescription,
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
import { Loader2 } from "lucide-react";

const createClassSchema = z.object({
  classGroupId: z.string().min(1, "Class group is required"),
  name: z.string().min(1, "Name is required"),
  buildingId: z.string().optional(),
  roomId: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

const CreateClassPage: FC = () => {
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const role = pathParts[2];
  const campusId = pathParts[4];
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      capacity: 30,
    },
  });

  const { data: campus } = api.campus.getById.useQuery(campusId);
  const { data: classGroups } = api.campus.getInheritedClassGroups.useQuery({ 
    campusId,
    status: "ACTIVE" 
  });
  const { data: buildings } = api.campus.getBuildings.useQuery({ campusId });
  const { data: rooms } = api.campus.getRooms.useQuery({ 
    campusId,
    buildingId: form.getValues("buildingId")
  }, {
    enabled: !!form.getValues("buildingId")
  });

  const { mutate: createClass, isPending } = api.campus.createClass.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class created successfully with inherited settings",
      });
      router.push(`/dashboard/${role}/campus/${campusId}/classes`);
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

  const selectedClassGroupId = form.watch("classGroupId");
  const selectedClassGroup = classGroups?.find(
    (group) => group.id === selectedClassGroupId
  );

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="classGroupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Group</FormLabel>
                  <FormDescription>
                    Select a class group to inherit subjects and settings from
                  </FormDescription>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classGroups?.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.program.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedClassGroup && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter class name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buildingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Reset room when building changes
                          form.setValue("roomId", undefined);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a building" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buildings?.map((building) => (
                            <SelectItem key={building.id} value={building.id}>
                              {building.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.getValues("buildingId") && (
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a room" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rooms?.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter capacity"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : ""
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedClassGroup && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-medium">Settings to be inherited:</h3>
                    <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                      <li>Subjects from {selectedClassGroup.program.name}</li>
                      <li>Gradebook configuration</li>
                      <li>Attendance settings</li>
                      <li>Academic calendar</li>
                    </ul>
                  </div>
                )}
              </>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Class
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateClassPage;
