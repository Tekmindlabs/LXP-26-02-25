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

const createCoordinatorSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

type CreateCoordinatorForm = z.infer<typeof createCoordinatorSchema>;

const CreateCoordinatorPage: FC = () => {
  const pathname = usePathname();
  const campusId = pathname.split("/").slice(-3)[0] as string;
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CreateCoordinatorForm>({
    resolver: zodResolver(createCoordinatorSchema),
  });

  const createCoordinatorMutation = api.coordinator.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Coordinator added successfully",
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

  const onSubmit = (data: CreateCoordinatorForm) => {
    createCoordinatorMutation.mutate({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phoneNumber: data.phoneNumber,
      type: "CAMPUS_PROGRAM_COORDINATOR",
      campusId,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Campus Coordinator</CardTitle>
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
              disabled={createCoordinatorMutation.isPending}
              className="w-full"
            >
              Add Coordinator
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateCoordinatorPage;
