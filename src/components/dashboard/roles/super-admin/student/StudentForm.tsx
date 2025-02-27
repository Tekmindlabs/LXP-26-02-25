'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Status } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { StudentProfile } from "@/types/student";
import { MultiSelect } from "@/components/ui/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	dateOfBirth: z.string().min(1, "Date of birth is required"),
	classId: z.string().min(1, "Class is required"),
	parentId: z.string().optional(),
	guardianInfo: z.object({
		name: z.string(),
		relationship: z.string(),
		contact: z.string(),
	}).optional(),
	status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]),
	campusIds: z.array(z.string()).min(1, "At least one campus must be selected"),
	primaryCampusId: z.string().min(1, "Primary campus is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
	selectedStudent?: {
		id: string;
		name: string;
		email: string;
		status: Status;
		studentProfile: StudentProfile;
	};
	classes: { 
		id: string; 
		name: string;
		campusId: string; 
		classGroup: { 
			id: string;
			name: string;
			program: { name: string | null; };
		}; 
	}[];
	campuses: { id: string; name: string; }[];
	onSuccess: () => void;
}

export const StudentForm = ({ selectedStudent, classes, campuses, onSuccess }: StudentFormProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const utils = api.useContext();
	const { toast } = useToast();

	if (!classes || !campuses) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Required data is missing</AlertTitle>
			</Alert>
		);
	}

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: selectedStudent?.name || "",
			email: selectedStudent?.email || "",
			dateOfBirth: selectedStudent?.studentProfile.dateOfBirth 
				? (() => {
					const date = new Date(selectedStudent.studentProfile.dateOfBirth);
					return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : "";
				})()
				: "",
			classId: selectedStudent?.studentProfile.class?.id || "",
			status: selectedStudent?.status || Status.ACTIVE,
			campusIds: selectedStudent?.studentProfile.campuses?.map(c => c.campus.id) || [],
			primaryCampusId: selectedStudent?.studentProfile.campuses?.find(c => c.isPrimary)?.campus.id || "",
		},
	});

	const createStudent = api.student.createStudent.useMutation({
		onSuccess: () => {
			utils.student.searchStudents.invalidate();
			form.reset();
			onSuccess();
			toast({
				title: "Success",
				description: "Student created successfully",
			});
		},
	});

	const updateStudent = api.student.updateStudent.useMutation({
		onSuccess: () => {
			utils.student.searchStudents.invalidate();
			onSuccess();
			toast({
				title: "Success",
				description: "Student updated successfully",
			});
		},
	});

	const onSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		try {
			const selectedClass = classes.find(c => c.id === values.classId);
			if (!selectedClass) {
				throw new Error("Selected class not found");
			}

			const formData = {
				name: values.name,
				email: values.email,
				dateOfBirth: new Date(values.dateOfBirth),
				classId: values.classId,
				status: values.status,
				campusAssignments: values.campusIds.map(campusId => ({
					campusId,
					isPrimary: campusId === values.primaryCampusId
				})),
				...(values.parentId && { parentId: values.parentId }),
				...(values.guardianInfo && { guardianInfo: values.guardianInfo })
			};

			if (selectedStudent) {
				await updateStudent.mutateAsync({
					id: selectedStudent.id,
					...formData
				});
			} else {
				await createStudent.mutateAsync(formData);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "An error occurred",
				variant: "destructive"
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
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
							name="dateOfBirth"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Date of Birth</FormLabel>
									<FormControl>
										<Input 
											type="date"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											name={field.name}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<Select onValueChange={field.onChange} value={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Object.values(Status).map((status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Campus Assignment</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="campusIds"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Assigned Campuses</FormLabel>
									<FormControl>
										<MultiSelect
											value={field.value}
											options={campuses.map(campus => ({
												label: campus.name,
												value: campus.id,
											}))}
											onChange={field.onChange}
											placeholder="Select campuses"
										/>
									</FormControl>
									<FormDescription>
										Select one or more campuses to assign this student to
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{form.watch("campusIds")?.length > 0 && (
							<FormField
								control={form.control}
								name="primaryCampusId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Primary Campus</FormLabel>
										<Select 
											onValueChange={field.onChange} 
											value={field.value}
											disabled={form.watch("campusIds")?.length === 0}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select primary campus" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{form.watch("campusIds")?.map((campusId) => {
													const campus = campuses.find(c => c.id === campusId);
													return (
														<SelectItem key={campusId} value={campusId}>
															{campus?.name || campusId}
														</SelectItem>
													);
												})}
											</SelectContent>
										</Select>
										<FormDescription>
											The primary campus is where the student is primarily based
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="classId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Class</FormLabel>
									<Select 
										onValueChange={field.onChange} 
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a class" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{classes
												.filter(cls => form.watch("campusIds")?.includes(cls.campusId))
												.map((cls) => (
													<SelectItem key={cls.id} value={cls.id}>
														{`${cls.name} (${cls.classGroup.name})`}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
									<FormDescription>
										Only classes from selected campuses are shown
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? "Saving..." : selectedStudent ? "Update" : "Create"} Student
				</Button>
			</form>
		</Form>
	);
};
