import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Status, TeacherType, type User, type Class, type Subject, type Campus } from "@prisma/client";
import { z } from "zod";
import { useTeacher } from "@/hooks/useTeacher";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { api } from "@/utils/api";

const teacherFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  teacherType: z.nativeEnum(TeacherType),
  specialization: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
  classIds: z.array(z.string()).optional(),
  campusIds: z.array(z.string()).optional(),
  primaryCampusId: z.string().optional(),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  teacher?: User & { 
    teacherProfile: {
      id: string;
      teacherType: TeacherType;
      specialization?: string;
      subjects: Array<{ subjectId: string }>;
      classes: Array<{ classId: string }>;
      campuses: Array<{ campusId: string; isPrimary: boolean }>;
    }
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TeacherForm({ teacher, onSuccess, onCancel }: TeacherFormProps) {
  const { upsertTeacher } = useTeacher({
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      teacherType: TeacherType.SUBJECT,
      specialization: "",
      subjectIds: [],
      classIds: [],
      campusIds: [],
      primaryCampusId: undefined,
    },
  });

  // Fetch available subjects, classes, and campuses
  const { data: subjects } = api.subject.list.useQuery();
  const { data: classes } = api.class.list.useQuery();
  const { data: campuses } = api.campus.list.useQuery();

  useEffect(() => {
    if (teacher) {
      form.reset({
        name: teacher.name || "",
        email: teacher.email || "",
        phoneNumber: teacher.phoneNumber || "",
        teacherType: teacher.teacherProfile?.teacherType || TeacherType.SUBJECT,
        specialization: teacher.teacherProfile?.specialization || "",
        subjectIds: teacher.teacherProfile?.subjects?.map(s => s.subjectId) || [],
        classIds: teacher.teacherProfile?.classes?.map(c => c.classId) || [],
        campusIds: teacher.teacherProfile?.campuses?.map(c => c.campusId) || [],
        primaryCampusId: teacher.teacherProfile?.campuses?.find(c => c.isPrimary)?.campusId,
      });
    }
  }, [teacher, form]);

  const onSubmit = async (data: TeacherFormData) => {
    try {
      if (teacher) {
        // Update existing teacher
        await upsertTeacher({
          profile: {
            userId: teacher.id,
            teacherType: data.teacherType,
            specialization: data.specialization,
          },
          assignments: data.campusIds?.map(campusId => ({
            campusId,
            isPrimary: campusId === data.primaryCampusId,
            status: Status.ACTIVE,
          })),
          subjects: data.subjectIds,
          classes: data.classIds,
        });
      } else {
        // Create new teacher
        await api.teacher.createTeacher.mutateAsync({
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          teacherType: data.teacherType,
          specialization: data.specialization,
          subjectIds: data.subjectIds,
          classIds: data.classIds,
          campusIds: data.campusIds,
          primaryCampusId: data.primaryCampusId,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save teacher:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
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
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teacherType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teacher Type</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <option value={TeacherType.CLASS}>Class Teacher</option>
                <option value={TeacherType.SUBJECT}>Subject Teacher</option>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialization</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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
              <MultiSelect
                value={field.value}
                onChange={field.onChange}
                options={subjects?.map(subject => ({
                  label: subject.name,
                  value: subject.id,
                })) || []}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="classIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Classes</FormLabel>
              <MultiSelect
                value={field.value}
                onChange={field.onChange}
                options={classes?.map((cls: Class & { classGroup: { name: string } }) => ({
                  label: `${cls.name} (${cls.classGroup.name})`,
                  value: cls.id,
                })) || []}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="campusIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campuses</FormLabel>
              <MultiSelect
                value={field.value}
                onChange={field.onChange}
                options={campuses?.map((campus: Campus) => ({
                  label: campus.name,
                  value: campus.id,
                })) || []}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryCampusId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Campus</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <option value="">Select Primary Campus</option>
                {form.watch("campusIds")?.map(campusId => {
                  const campus = campuses?.find(c => c.id === campusId);
                  return campus ? (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ) : null;
                })}
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {teacher ? "Update Teacher" : "Create Teacher"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 