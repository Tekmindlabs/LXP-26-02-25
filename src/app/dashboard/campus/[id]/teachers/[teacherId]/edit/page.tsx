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
import { X } from "lucide-react";
import { type TRPCClientErrorLike } from "@trpc/client";
import { type DefaultErrorShape } from "@trpc/server";
import { type TeacherType } from "@prisma/client";

const editTeacherSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  classId: z.string().min(1, "Class is required"),
  subjectIds: z.array(z.string()).min(1, "At least one subject is required"),
  isClassTeacher: z.boolean().default(false),
});

type EditTeacherForm = z.infer<typeof editTeacherSchema>;

const EditTeacherPage: FC = () => {
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const campusId = pathParts[3];
  const teacherId = pathParts[5];
  const router = useRouter();
  const { toast } = useToast();

  const { data: teacher } = api.teacher.getOne.useQuery({ id: teacherId });
  const { data: classes } = api.campus.getClasses.useQuery({
    campusId,
    status: "ACTIVE",
  });
  const { data: subjects } = api.subject.getAll.useQuery();

  const form = useForm<EditTeacherForm>({
    resolver: zodResolver(editTeacherSchema),
    defaultValues: {
      email: teacher?.user.email,
      firstName: teacher?.user.firstName,
      lastName: teacher?.user.lastName,
      classId: teacher?.classes?.[0]?.classId,
      subjectIds: teacher?.subjects?.map(s => s.subjectId) || [],
      isClassTeacher: teacher?.teacherType === "CLASS_TEACHER",
    },
  });

  const editTeacherMutation = api.teacher.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher updated successfully",
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

  const onSubmit = (data: EditTeacherForm) => {
    editTeacherMutation.mutate({
      id: teacherId,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      teacherType: data.isClassTeacher ? "CLASS_TEACHER" as TeacherType : "SUBJECT_TEACHER" as TeacherType,
      subjectIds: data.subjectIds,
      classIds: [data.classId],
    });
  };

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Teacher</CardTitle>
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
              name="subjectIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subjects</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const currentValues = field.value || [];
                      const newValues = currentValues.includes(value)
                        ? currentValues.filter((v) => v !== value)
                        : [...currentValues, value];
                      field.onChange(newValues);
                    }}
                    defaultValue={field.value?.[0]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subjects" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    {field.value?.map((subjectId) => (
                      <div
                        key={subjectId}
                        className="mr-2 mb-2 inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground"
                      >
                        {subjects?.find((s) => s.id === subjectId)?.name}
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(
                              field.value?.filter((id) => id !== subjectId)
                            );
                          }}
                          className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full hover:bg-secondary/80"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isClassTeacher"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Is Class Teacher</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={editTeacherMutation.isPending}
              className="w-full"
            >
              Update Teacher
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditTeacherPage;
