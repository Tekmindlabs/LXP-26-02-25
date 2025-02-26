export enum Status {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	ARCHIVED = 'ARCHIVED'
}

export enum UserType {
	SUPER_ADMIN = 'super-admin',
	ADMIN = 'ADMIN',
	COORDINATOR = 'COORDINATOR',
	TEACHER = 'TEACHER',
	STUDENT = 'STUDENT',
	PARENT = 'PARENT'
}

export enum RoomType {
	CLASSROOM = 'CLASSROOM',
	LAB = 'LAB',
	ACTIVITY_ROOM = 'ACTIVITY_ROOM',
	LECTURE_HALL = 'LECTURE_HALL'
}

export enum RoomStatus {
	ACTIVE = 'ACTIVE',
	MAINTENANCE = 'MAINTENANCE',
	INACTIVE = 'INACTIVE'
}

export enum CampusType {
	MAIN = 'MAIN',
	BRANCH = 'BRANCH'
}

export enum CampusRole {
    CAMPUS_ADMIN = 'CAMPUS_ADMIN',
    CAMPUS_MANAGER = 'CAMPUS_MANAGER',
    CAMPUS_COORDINATOR = 'CAMPUS_COORDINATOR',
    CAMPUS_TEACHER = 'CAMPUS_TEACHER',
    CAMPUS_STUDENT = 'CAMPUS_STUDENT'
}

export enum CampusPermission {
	MANAGE_CAMPUS = 'MANAGE_CAMPUS',
	MANAGE_CAMPUS_CLASSES = 'MANAGE_CAMPUS_CLASSES',
	MANAGE_CAMPUS_TEACHERS = 'MANAGE_CAMPUS_TEACHERS',
	MANAGE_CAMPUS_STUDENTS = 'MANAGE_CAMPUS_STUDENTS',
	MANAGE_CAMPUS_TIMETABLES = 'MANAGE_CAMPUS_TIMETABLES',
	MANAGE_CAMPUS_ATTENDANCE = 'MANAGE_CAMPUS_ATTENDANCE',
	VIEW_CAMPUS_ANALYTICS = 'VIEW_CAMPUS_ANALYTICS',
	VIEW_PROGRAMS = 'VIEW_PROGRAMS',
	VIEW_CAMPUS_CLASSES = 'VIEW_CAMPUS_CLASSES',
	VIEW_CLASS_GROUPS = 'VIEW_CLASS_GROUPS'
}

export enum AttendanceStatus {
	PRESENT = 'PRESENT',
	ABSENT = 'ABSENT',
	LATE = 'LATE',
	EXCUSED = 'EXCUSED'
}

export enum TeacherType {
	CLASS = 'CLASS',
	SUBJECT = 'SUBJECT'
}

export enum ActivityType {
	QUIZ_MULTIPLE_CHOICE = 'QUIZ_MULTIPLE_CHOICE',
	QUIZ_DRAG_DROP = 'QUIZ_DRAG_DROP',
	QUIZ_FILL_BLANKS = 'QUIZ_FILL_BLANKS',
	QUIZ_MEMORY = 'QUIZ_MEMORY',
	QUIZ_TRUE_FALSE = 'QUIZ_TRUE_FALSE',
	GAME_WORD_SEARCH = 'GAME_WORD_SEARCH',
	GAME_CROSSWORD = 'GAME_CROSSWORD',
	GAME_FLASHCARDS = 'GAME_FLASHCARDS',
	VIDEO_YOUTUBE = 'VIDEO_YOUTUBE',
	READING = 'READING',
	CLASS_ASSIGNMENT = 'CLASS_ASSIGNMENT',
	CLASS_PROJECT = 'CLASS_PROJECT',
	CLASS_PRESENTATION = 'CLASS_PRESENTATION',
	CLASS_TEST = 'CLASS_TEST',
	CLASS_EXAM = 'CLASS_EXAM'
}

export enum ActivityStatus {
	DRAFT = 'DRAFT',
	PUBLISHED = 'PUBLISHED',
	ARCHIVED = 'ARCHIVED'
}

export enum ActivityScope {
	CURRICULUM = 'CURRICULUM',
	CLASS = 'CLASS'
}

export enum SubmissionStatus {
	PENDING = 'PENDING',
	SUBMITTED = 'SUBMITTED',
	GRADED = 'GRADED',
	LATE = 'LATE',
	MISSED = 'MISSED'
}