'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Status, TeacherType } from "@prisma/client";

interface Teacher {
	id: string;
	name: string | null;
	email: string | null;
	status: Status;
	teacher?: {
		teacherType: TeacherType;
		specialization: string | null;
		campuses?: Array<{
			campus: {
				id: string;
				name: string;
			};
			isPrimary: boolean;
		}>;
		subjects?: Array<{
			name: string;
		}>;
		classes?: Array<{
			name: string;
			classGroup: {
				name: string;
			};
		}>;
	};
}

interface TeacherListProps {
	teachers: Teacher[];
	onSelect: (id: string) => void;
	onEdit: (id: string) => void;
}

export const TeacherList = ({ teachers, onSelect, onEdit }: TeacherListProps) => {
	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Teacher Type</TableHead>
						<TableHead>Specialization</TableHead>
						<TableHead>Campus</TableHead>
						<TableHead>Subjects</TableHead>
						<TableHead>Classes</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{teachers.map((teacher) => (
						<TableRow key={teacher.id}>
							<TableCell>{teacher.name || '-'}</TableCell>
							<TableCell>{teacher.email || '-'}</TableCell>
							<TableCell>
								<Badge variant="outline">
									{teacher.teacher?.teacherType || 'SUBJECT'}
								</Badge>
							</TableCell>
							<TableCell>{teacher.teacher?.specialization || '-'}</TableCell>
							<TableCell>
								{teacher.teacher?.campuses?.map(tc => (
									<Badge 
										key={tc.campus.id} 
										variant={tc.isPrimary ? "default" : "outline"}
										className="mr-1"
									>
										{tc.campus.name}
										{tc.isPrimary && " (Primary)"}
									</Badge>
								)) || '-'}
							</TableCell>
							<TableCell>
								{teacher.teacher?.subjects?.map(s => s.name).join(", ") || '-'}
							</TableCell>
							<TableCell>
								{teacher.teacher?.classes?.map(c => 
									`${c.name} (${c.classGroup.name})`
								).join(", ") || '-'}
							</TableCell>
							<TableCell>
								<Badge variant={teacher.status === "ACTIVE" ? "default" : "secondary"}>
									{teacher.status}
								</Badge>
							</TableCell>
							<TableCell>
								<div className="flex space-x-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => onSelect(teacher.id)}
									>
										View
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => onEdit(teacher.id)}
									>
										Edit
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
};