'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Status } from "@prisma/client";
import { useRouter } from "next/navigation";
import type { StudentProfile } from "@/types/student";
import type { User } from "@/types/user";

interface Student {
	id: string;
	name: string | null;
	email: string | null;
	status: Status;
	student: {
		id: string;
		userId: string;
		dateOfBirth: Date;
		class?: {
			id: string;
			name: string;
		} | null;
		parent?: {
			id: string;
			name: string;
			email: string;
		} | null;
	};
}

interface StudentListProps {
	students: Student[];
	selectedStudents: string[];
	onSelectStudent: (studentId: string) => void;
	onViewDetails: (studentId: string) => void;
}

export default function StudentList({
	students,
	selectedStudents,
	onSelectStudent,
	onViewDetails,
}: StudentListProps) {
	const router = useRouter();

	if (!students?.length) {
		return (
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[100px]">Select</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Class</TableHead>
							<TableHead>Parent</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell colSpan={7} className="text-center py-8">
								No students found
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[100px]">Select</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Class</TableHead>
						<TableHead>Parent</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{students.map((student) => (
						<TableRow key={student.id}>
							<TableCell>
								<input
									type="checkbox"
									checked={selectedStudents.includes(student.id)}
									onChange={() => onSelectStudent(student.id)}
									className="h-4 w-4 rounded border-gray-300"
								/>
							</TableCell>
							<TableCell>{student.name}</TableCell>
							<TableCell>{student.email}</TableCell>
							<TableCell>{student.student.class?.name || "Not Assigned"}</TableCell>
							<TableCell>{student.student.parent?.name || "Not Assigned"}</TableCell>
							<TableCell>
								<Badge
									variant={student.status === "ACTIVE" ? "default" : "secondary"}
								>
									{student.status}
								</Badge>
							</TableCell>
							<TableCell className="text-right">
								<Button
									variant="ghost"
									onClick={() => onViewDetails(student.id)}
								>
									View Details
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

