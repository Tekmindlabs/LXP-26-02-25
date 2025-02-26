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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppRouter } from "@/server/api/root";
import type { TRPCClientErrorLike } from "@trpc/client";

const associateProgramSchema = z.object({
  programIds: z.array(z.string()).min(1, "Select at least one program"),
});

type AssociateProgramForm = z.infer<typeof associateProgramSchema>;

const AssociateProgramPage: FC = () => {
  const pathname = usePathname();
  const pathParts = pathname.split("/");
  const role = pathParts[2];
  const campusId = pathParts[4];
  const router = useRouter();
  const { toast } = useToast();

  const { data } = api.program.getAll.useQuery({});
  const { mutate } = api.campus.addProgram.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Programs associated successfully",
      });
      router.push(`/dashboard/${role}/campus/${campusId}`);
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
    defaultValues: {
      programIds: [],
    },
  });

  const onSubmit = (data: AssociateProgramForm) => {
    mutate({
      campusId,
      programIds: data.programIds,
    });
  };

  const selectedPrograms = form.watch("programIds");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Associate Programs</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="programIds"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Programs</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value?.length > 0
                            ? `${field.value.length} programs selected`
                            : "Select programs"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Search programs..." />
                        <CommandEmpty>No programs found.</CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-72">
                            {data?.programs?.map((program) => (
                              <CommandItem
                                value={program.id}
                                key={program.id}
                                onSelect={() => {
                                  const newValue = field.value.includes(program.id)
                                    ? field.value.filter((id) => id !== program.id)
                                    : [...field.value, program.id];
                                  form.setValue("programIds", newValue);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value?.includes(program.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {program.name}
                              </CommandItem>
                            ))}
                          </ScrollArea>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedPrograms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPrograms.map((id) => {
                        const program = data?.programs?.find((p) => p.id === id);
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="text-sm"
                            onClick={() => {
                              form.setValue(
                                "programIds",
                                selectedPrograms.filter((pid) => pid !== id)
                              );
                            }}
                          >
                            {program?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Associate Programs</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AssociateProgramPage;
