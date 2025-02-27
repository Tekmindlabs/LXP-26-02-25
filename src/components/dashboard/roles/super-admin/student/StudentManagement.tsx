'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Status, Program as PrismaProgram } from "@prisma/client";
import { api } from "@/utils/api";
import { StudentList } from "./StudentList";
import { StudentForm } from "./StudentForm";
import { StudentDetails } from "./StudentDetails";
import { BulkStudentUpload } from "./BulkStudentUpload";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useDebounce } from "@/hooks/use-debounce";
import type { StudentProfile } from "@/types/student";
import type { User } from "@/types/user";

interface Program extends PrismaProgram {
	name: string;
}

interface SearchFilters {
	search: string;
	classId?: string;
	programId?: string;
	status?: Status;
}

interface Student {
	id: string;
	name: string | null;
	email: string | null;
	status: Status;
	studentProfile: {
		id: string;
		userId: string;
		dateOfBirth: Date;
		class?: {
			id: string;
			name: string;
			classGroup: {
				id: string;
				name: string;
				program: {
					id: string;
					name: string;
				};
			};
		};
		parent?: {
			id: string;
			user: {
				id: string;
				name: string | null;
			};
		};
	};
}

export const StudentManagement = () => {
	const router = useRouter();
	const params = useParams();
	const role = params.role as string;
	const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
	const [showDetails, setShowDetails] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const [filters, setFilters] = useState<SearchFilters>({
		search: "",
	});

	// Debounce search input
	const debouncedSearch = useDebounce(searchInput, 300);

	// Update filters when debounced search changes
	useEffect(() => {
		setFilters(prev => ({ ...prev, search: debouncedSearch }));
	}, [debouncedSearch]);

	const {
		data: studentsData,
		isLoading: isLoadingStudents,
		error: studentsError,
		refetch: refetchStudents
	} = api.student.searchStudents.useQuery(filters, {
		retry: 1,
		refetchOnWindowFocus: false,
	});

	const {
		data: classes,
		isLoading: isLoadingClasses
	} = api.class.searchClasses.useQuery({}, {
		retry: 1,
		refetchOnWindowFocus: false
	});

	const {
		data: programsData,
		isLoading: isLoadingPrograms
	} = api.program.getAll.useQuery({
		page: 1,
		pageSize: 50
	}, {
		retry: 1,
		refetchOnWindowFocus: false
	});

	const isLoading = isLoadingStudents || isLoadingClasses || isLoadingPrograms;

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (studentsError) {
		return <ErrorDisplay 
			error={new Error(studentsError.message || "Failed to load students")} 
			onRetry={refetchStudents} 
		/>;
	}

	const handleFilterChange = (key: keyof SearchFilters, value: string) => {
		setFilters(prev => ({
			...prev,
			[key]: value === "ALL" ? undefined : value
		}));
	};

	const students = studentsData?.map(student => ({
		id: student.id,
		name: student.name || '',
		email: student.email || '',
		status: student.status,
		studentProfile: {
			id: student.student?.id || '',
			userId: student.id,
			dateOfBirth: student.student?.dateOfBirth || new Date(),
			class: student.student?.class ? {
				id: student.student.class.id,
				name: student.student.class.name,
				classGroup: {
					id: student.student.class.classGroup.id,
					name: student.student.class.classGroup.name,
					program: {
						id: student.student.class.classGroup.program.id,
						name: student.student.class.classGroup.program.name
					}
				}
			} : undefined,
			parent: student.student?.parent ? {
				id: student.student.parent.id,
				user: {
					id: student.student.parent.user.id,
					name: student.student.parent.user.name
				}
			} : undefined
		}
	})) || [];

	const programs = programsData?.programs || [];

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Student Management</CardTitle>
					<div className="flex items-center gap-4">
						<BulkStudentUpload onSuccess={() => refetchStudents()} />
						<Button onClick={() => router.push(`/dashboard/${role}/student/create`)}>
							Enroll Student
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="mb-6 space-y-4">
						<div className="flex space-x-4">
							<Input
								placeholder="Search students..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								className="max-w-sm"
							/>
							<Select
								value={filters.programId || "ALL"}
								onValueChange={(value) => handleFilterChange("programId", value)}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Program" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All Programs</SelectItem>
									{programs.map((program) => (
										<SelectItem key={program.id} value={program.id}>
											{program.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.classId || "ALL"}
								onValueChange={(value) => handleFilterChange("classId", value)}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Class" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All Classes</SelectItem>
									{classes?.map((cls) => (
										<SelectItem key={cls.id} value={cls.id}>
											{cls.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.status || "ALL"}
								onValueChange={(value) => handleFilterChange("status", value)}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">All Status</SelectItem>
									{Object.values(Status).map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-4">
						{showDetails && selectedStudentId ? (
							<StudentDetails
								studentId={selectedStudentId}
								onBack={() => {
									setShowDetails(false);
									setSelectedStudentId(null);
								}}
							/>
						) : (
							<>
								<StudentList
									students={students}
									onSelect={(id) => {
										setSelectedStudentId(id);
										setShowDetails(true);
									}}
								/>
								{selectedStudentId && (
									<StudentForm
										selectedStudent={students.find(s => s.id === selectedStudentId)}
										classes={classes || []}
										onSuccess={() => {
											setSelectedStudentId(null);
											void refetchStudents();
										}}
									/>
								)}
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
