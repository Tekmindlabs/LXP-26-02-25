'use client';

import { api } from "@/utils/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Status, TeacherType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

// Type definitions
interface Campus {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface ApiError {
  message: string;
}

// Form schema matching the backend expectations
const teacherFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  teacherType: z.nativeEnum(TeacherType),
  specialization: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
  classIds: z.array(z.string()).optional(),
  campusIds: z.array(z.string()).optional(),
  primaryCampusId: z.string().optional(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  initialData?: Partial<TeacherFormValues> & { campusId?: string };
  teacherId?: string;
  isCreate?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function TeacherForm({
  initialData = {},
  teacherId,
  isCreate,
  onClose,
  onSuccess,
}: TeacherFormProps) {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;
  const [loading, setLoading] = useState(false);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: initialData.name ?? "",
      email: initialData.email ?? "",
      phoneNumber: initialData.phoneNumber ?? "",
      teacherType: initialData.teacherType ?? TeacherType.SUBJECT,
      specialization: initialData.specialization ?? "",
      subjectIds: initialData.subjectIds ?? [],
      classIds: initialData.classIds ?? [],
      campusIds: initialData.campusId ? [initialData.campusId] : [],
      primaryCampusId: initialData.campusId ?? "",
    },
  });

  // Get all campuses
  const { data: campuses = [], isLoading: isLoadingCampuses } = api.campus.getAll.useQuery();

  // Get all subjects
  const { data: subjects = [], isLoading: isLoadingSubjects } = api.subject.getAll.useQuery();

  // Get teacher data if editing
  const { data: teacherData, isLoading: isLoadingTeacher } = api.teacher.getById.useQuery(
    teacherId!,
    { enabled: !!teacherId }
  );

  // Get teacher campuses if editing
  const { data: teacherCampuses = [], isLoading: isLoadingTeacherCampuses, refetch: refetchTeacherCampuses } = api.teacher.getTeacherCampuses.useQuery(
    { teacherId: teacherId! },
    { enabled: !!teacherId }
  );

  // Get selected campus IDs from form
  const selectedCampusIds = form.watch("campusIds") || [];

  // Get classes based on selected campuses
  const { data: classes = [], isLoading: isLoadingClasses } = api.class.searchClasses.useQuery(
    { campusIds: selectedCampusIds },
    { enabled: selectedCampusIds.length > 0 }
  );

  // Create teacher mutation
  const createTeacher = api.teacher.createTeacher.useMutation({
    onSuccess: async (data) => {
      try {
        // If campuses are selected, assign them
        if (form.getValues().campusIds?.length) {
          const primaryCampusId = form.getValues().primaryCampusId;
          
          // Assign each campus sequentially
          for (const campusId of form.getValues().campusIds) {
            await assignTeacherToCampus.mutateAsync({
              teacherId: data.id,
              campusId,
              isPrimary: campusId === primaryCampusId
            });
          }
        }
        
        toast.success("Teacher created successfully");
        setLoading(false);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/dashboard/${role}/teacher`);
        }
      } catch (error) {
        console.error("Error in campus assignments:", error);
        toast.error("Teacher created but campus assignments failed");
        setLoading(false);
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
      setLoading(false);
    },
  });

  // Update teacher mutation
  const updateTeacher = api.teacher.updateTeacher.useMutation({
    onSuccess: async (data) => {
      try {
        // Handle campus assignments if needed
        const newCampusIds = form.getValues().campusIds || [];
        const primaryCampusId = form.getValues().primaryCampusId;
        const currentCampusIds = teacherCampuses?.map(tc => tc.campusId) || [];

        // Step 1: Handle removals first
        for (const tc of teacherCampuses || []) {
          if (!newCampusIds.includes(tc.campusId)) {
            await removeTeacherFromCampus.mutateAsync({
              teacherId: data.id,
              campusId: tc.campusId
            });
          }
        }

        // Step 2: Handle new assignments
        for (const campusId of newCampusIds) {
          if (!currentCampusIds.includes(campusId)) {
            await assignTeacherToCampus.mutateAsync({
              teacherId: data.id,
              campusId,
              isPrimary: campusId === primaryCampusId
            });
          }
        }

        // Step 3: Update primary campus if it has changed
        if (primaryCampusId && newCampusIds.includes(primaryCampusId)) {
          const currentPrimaryCampus = teacherCampuses?.find(tc => tc.isPrimary);
          if (currentPrimaryCampus?.campusId !== primaryCampusId) {
            await setPrimaryCampus.mutateAsync({
              teacherId: data.id,
              campusId: primaryCampusId
            });
          }
        }

        // Refetch teacher data to ensure UI is updated
        await refetchTeacherCampuses();
        
        toast.success("Teacher updated successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/dashboard/${role}/teacher`);
        }
      } catch (error) {
        console.error("Error in campus assignments:", error);
        toast.error("Some campus assignments could not be completed. Please check and try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
      setLoading(false);
    },
  });

  // Campus assignment mutations
  const assignTeacherToCampus = api.campus.assignTeacherToCampus.useMutation();
  const removeTeacherFromCampus = api.campus.removeTeacherFromCampus.useMutation();
  const setPrimaryCampus = api.campus.setPrimaryCampus.useMutation();

  // Set form default values when teacher data is loaded
  useEffect(() => {
    if (teacherData && teacherCampuses) {
      const campusIds = teacherCampuses.map(tc => tc.campusId);
      const primaryCampus = teacherCampuses.find(tc => tc.isPrimary);
      
      form.reset({
        name: teacherData.name || "",
        email: teacherData.email || "",
        phoneNumber: teacherData.phoneNumber || "",
        teacherType: teacherData.teacher?.teacherType || TeacherType.SUBJECT,
        specialization: teacherData.teacher?.specialization || "",
        subjectIds: teacherData.teacher?.subjects?.map(s => s.id) ?? [],
        classIds: teacherData.teacher?.classes?.map(c => c.id) ?? [],
        campusIds: campusIds,
        primaryCampusId: primaryCampus?.campusId || "",
      });
    }
  }, [teacherData, teacherCampuses, form]);

  const onSubmit = async (data: TeacherFormValues) => {
    try {
      setLoading(true);
      const formData = {
        ...data,
        teacherType: data.teacherType || TeacherType.SUBJECT,
        subjectIds: data.subjectIds || [],
        classIds: data.classIds || [],
      };

      if (isCreate) {
        await createTeacher.mutateAsync(formData);
      } else if (teacherId) {
        await updateTeacher.mutateAsync({
          ...formData,
          id: teacherId,
        });
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || "Something went wrong");
      setLoading(false);
    }
  };

  // Show loading state while fetching teacher data
  if ((teacherId && isLoadingTeacher) || isLoadingTeacherCampuses) {
    return <div>Loading teacher data...</div>;
  }

  // Show error if teacher data failed to load
  if (teacherId && !teacherData && !isLoadingTeacher) {
    return <div>Error loading teacher data. Please try again later.</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" />
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
                  <Input {...field} type="email" placeholder="john.doe@example.com" />
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
                  <Input {...field} placeholder="+1234567890" />
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
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={TeacherType.CLASS}>Class Teacher</SelectItem>
                    <SelectItem value={TeacherType.SUBJECT}>Subject Teacher</SelectItem>
                  </SelectContent>
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
                  <Input {...field} placeholder="e.g., Mathematics, Science" />
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
                <FormLabel>Assigned Subjects</FormLabel>
                <FormControl>
                  <MultiSelect<string>
                    value={field.value ?? []}
                    options={
                      subjects?.map((subject: Subject) => ({
                        label: subject.name,
                        value: subject.id,
                      })) ?? []
                    }
                    onChange={field.onChange}
                    placeholder={
                      isLoadingSubjects
                        ? "Loading subjects..."
                        : subjects?.length === 0
                        ? "No subjects available"
                        : "Select subjects"
                    }
                    disabled={isLoadingSubjects}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("teacherType") === TeacherType.SUBJECT && (
            <FormField
              control={form.control}
              name="classIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Classes</FormLabel>
                  <FormControl>
                    <MultiSelect<string>
                      value={field.value ?? []}
                      options={
                        classes?.map((class_) => ({
                          label: `${class_.name} (${class_.classGroup?.name || 'No Group'})`,
                          value: class_.id,
                        })) ?? []
                      }
                      onChange={field.onChange}
                      placeholder={
                        selectedCampusIds.length === 0 
                          ? "Please select campuses first"
                          : isLoadingClasses
                          ? "Loading classes..."
                          : classes.length === 0
                          ? "No classes available in selected campuses"
                          : "Select classes"
                      }
                      disabled={selectedCampusIds.length === 0 || isLoadingClasses}
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedCampusIds.length === 0 
                      ? "You must select at least one campus before assigning classes" 
                      : classes.length === 0 && !isLoadingClasses
                      ? "No classes found in the selected campuses. Please create classes first."
                      : "Select the classes this teacher will be teaching"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Campus Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="campusIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Campuses</FormLabel>
                    <FormControl>
                      <MultiSelect<string>
                        value={field.value ?? []}
                        options={
                          campuses?.map((campus: Campus) => ({
                            label: campus.name,
                            value: campus.id,
                          })) ?? []
                        }
                        onChange={(values) => {
                          field.onChange(values);
                          
                          // Handle primary campus changes
                          const currentPrimaryCampusId = form.getValues().primaryCampusId;
                          if (values.length === 0) {
                            // If no campuses selected, clear primary campus
                            form.setValue("primaryCampusId", "");
                          } else if (!values.includes(currentPrimaryCampusId)) {
                            // If current primary campus is not in selection, set first campus as primary
                            form.setValue("primaryCampusId", values[0]);
                          }
                        }}
                        placeholder={
                          isLoadingCampuses
                            ? "Loading campuses..."
                            : campuses.length === 0
                            ? "No campuses available"
                            : "Select campuses"
                        }
                        disabled={isLoadingCampuses}
                      />
                    </FormControl>
                    <FormDescription>
                      {isLoadingCampuses
                        ? "Loading available campuses..."
                        : campuses.length === 0
                        ? "No campuses are available. Please create campuses first."
                        : "Select the campuses where this teacher will be assigned"}
                    </FormDescription>
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
                      onValueChange={field.onChange} 
                      value={field.value || ""}
                      disabled={form.watch("campusIds")?.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary campus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch("campusIds")?.map((campusId) => {
                          const campus = campuses.find((c: Campus) => c.id === campusId);
                          return (
                            <SelectItem key={campusId} value={campusId}>
                              {campus?.name || campusId}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The primary campus is where the teacher is primarily based
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          {loading ? (teacherId ? "Updating..." : "Creating...") : teacherId ? "Update Teacher" : "Create Teacher"}
        </Button>
      </form>
    </Form>
  );
}
