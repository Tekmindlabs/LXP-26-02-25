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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type DefaultErrorShape } from "@trpc/server";

const editStudentSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.date(),
  classId: z.string().min(1, "Class is required"),
  parentEmail: z.string().email("Invalid parent email").optional(),
});

type EditStudentForm = z.infer<typeof editStudentSchema>;

const EditStudentPage: FC = () => {
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const campusId = pathParts[3];
  const studentId = pathParts[5];
  const router = useRouter();
  const { toast } = useToast();

  const { data: student } = api.student.getOne.useQuery({ id: studentId });
  const { data: classes } = api.campus.getClasses.useQuery({
    campusId,
    status: "ACTIVE",
  });

  const form = useForm<EditStudentForm>({
    resolver: zodResolver(editStudentSchema),
    defaultValues: {
      email: student?.user.email,
      firstName: student?.user.firstName,
      lastName: student?.user.lastName,
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth) : new Date(),
      classId: student?.classId,
      parentEmail: student?.parentEmail,
    },
  });

  const editStudentMutation = api.student.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student updated successfully",
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

  const onSubmit = (data: EditStudentForm) => {
    editStudentMutation.mutate({
      id: studentId,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      classId: data.classId,
      parentEmail: data.parentEmail,
    });
  };

  if (!student) {
    return <div>Student not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Student</CardTitle>
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
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes?.map((cls: { id: string; name: string }) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
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
              name="parentEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Email (Optional)</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={editStudentMutation.isPending}
              className="w-full"
            >
              Update Student
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditStudentPage;
