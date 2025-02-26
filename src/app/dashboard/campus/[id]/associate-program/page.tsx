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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const associateProgramSchema = z.object({
  programId: z.string().min(1, "Program is required"),
});

type AssociateProgramForm = z.infer<typeof associateProgramSchema>;

const AssociateProgramPage: FC = () => {
  const pathname = usePathname();
  const campusId = pathname.split("/")[3]; // Get ID from path
  const router = useRouter();
  const { toast } = useToast();

  const { data } = api.program.getAll.useQuery({});
  const { mutate } = api.campus.addProgram.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program associated successfully",
      });
      router.push(`/dashboard/campus/${campusId}`);
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

  const form = useForm<AssociateProgramForm>({
    resolver: zodResolver(associateProgramSchema),
  });

  const onSubmit = (data: AssociateProgramForm) => {
    mutate({
      campusId,
      programId: data.programId,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Associate Program</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="programId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {data?.programs?.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Associate Program</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AssociateProgramPage;
