import { User } from "./user";
import { Class } from "./class";
import { AttendanceStatus } from "./enums";

export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED" | "WITHDRAWN";

export interface StudentProfile {
	id: string;
	userId: string;
	user: User;
	dateOfBirth?: Date;
	class?: Class;
	classId?: string;
	parentId?: string;
	status: StudentStatus;
	studentId: string;
	attendance?: {
		id: string;
		date: Date;
		status: AttendanceStatus;
		notes?: string;
	}[];
}