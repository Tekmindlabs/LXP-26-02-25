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
import { X } from "lucide-react";
import { type TRPCClientErrorLike } from "@trpc/client";
import { TeacherType } from "@prisma/client";
import { type AppRouter } from "@/server/api/root";

const createTeacherSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  classId: z.string().min(1, "Class is required"),
  subjectIds: z.array(z.string()).min(1, "At least one subject is required"),
  isClassTeacher: z.boolean().default(false),
});

type CreateTeacherForm = z.infer<typeof createTeacherSchema>;

const CreateTeacherPage: FC = () => {
  const pathname = usePathname();
  const campusId = pathname.split("/")[3]; // Get ID from path
  const router = useRouter();
  const { toast } = useToast();

  const { data: campus } = api.campus.getById.useQuery(campusId);
  const { data: classes } = api.campus.getClasses.useQuery({ campusId });
  const { data: subjects } = api.subject.getAll.useQuery();

  const { mutate: createTeacher, isPending } = api.teacher.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher created successfully",
      });
      router.push(`/dashboard/campus/${campusId}/teachers`);
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

  const form = useForm<CreateTeacherForm>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      subjectIds: [],
      isClassTeacher: false,
    },
  });

  const onSubmit = (data: CreateTeacherForm) => {
    createTeacher({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      teacherType: data.isClassTeacher ? TeacherType.CLASS : TeacherType.SUBJECT,
      classId: data.classId,
      subjectIds: data.subjectIds,
      campusId,
    });
  };

  if (!campus || !classes || !subjects) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Teacher</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((cls) => (
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
                      if (currentValues.includes(value)) {
                        field.onChange(currentValues.filter((v) => v !== value));
                      } else {
                        field.onChange([...currentValues, value]);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subjects" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value?.map((subjectId) => {
                      const subject = subjects.find((s) => s.id === subjectId);
                      return (
                        <Badge
                          key={subjectId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {subject?.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() =>
                              field.onChange(
                                field.value?.filter((id) => id !== subjectId)
                              )
                            }
                          />
                        </Badge>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              Create Teacher
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateTeacherPage;
