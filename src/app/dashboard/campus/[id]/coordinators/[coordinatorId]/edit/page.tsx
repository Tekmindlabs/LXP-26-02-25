"use client";

import { type FC } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
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
import { type TRPCClientErrorLike } from "@trpc/client";
import { type DefaultErrorShape } from "@trpc/server";

const editCoordinatorSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

type EditCoordinatorForm = z.infer<typeof editCoordinatorSchema>;

const EditCoordinatorPage: FC = () => {
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const campusId = pathParts[3];
  const coordinatorId = pathParts[5];
  const router = useRouter();
  const { toast } = useToast();

  const { data: coordinator } = api.coordinator.getOne.useQuery({
    id: coordinatorId,
  });

  const form = useForm<EditCoordinatorForm>({
    resolver: zodResolver(editCoordinatorSchema),
    defaultValues: {
      email: coordinator?.user.email,
      firstName: coordinator?.user.firstName,
      lastName: coordinator?.user.lastName,
      phoneNumber: coordinator?.user.phone || "",
    },
  });

  const editCoordinatorMutation = api.coordinator.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coordinator updated successfully",
      });
      router.push(`/dashboard/campus/${campusId}`);
    },
    onError: (error: TRPCClientErrorLike<DefaultErrorShape>) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditCoordinatorForm) => {
    editCoordinatorMutation.mutate({
      id: coordinatorId,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phoneNumber: data.phoneNumber,
    });
  };

  if (!coordinator) {
    return <div>Coordinator not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Campus Coordinator</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={editCoordinatorMutation.isPending}
              className="w-full"
            >
              Update Coordinator
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditCoordinatorPage;
