'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  dateOfBirth: z.date({ message: 'Date of birth is required' }),
  classId: z.string().min(1, { message: 'Class is required' }),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateStudentPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const router = useRouter();
  const campusId = params.id;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      parentName: '',
      parentEmail: '',
    },
  });

  const { data: classes } = api.campus.getClasses.useQuery({ campusId });
  const { mutateAsync: createStudent } = api.student.createStudent.useMutation();

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await createStudent({
        ...data,
        campusId,
      });
      toast({
        title: 'Success',
        description: 'Student created successfully',
      });
      router.push(`/dashboard/${params.role}/campus/${campusId}/students`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create student',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Add New Student</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter student name" {...field} />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter student email" {...field} />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                  />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="classId"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>Class</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="parentName"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>Parent Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter parent name" {...field} />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="parentEmail"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>Parent Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter parent email" {...field} />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Student'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
