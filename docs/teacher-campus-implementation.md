# Teacher-Campus Relationship Implementation

This document outlines the implementation of the direct many-to-many relationship between teachers and campuses.

## Overview

Previously, teachers were only associated with campuses through their class assignments. This indirect relationship caused several issues:

1. Complex queries to find teachers for a campus
2. Data integrity issues when teachers were removed from classes
3. No way to assign teachers to a campus before assigning them to specific classes

The new implementation creates a direct many-to-many relationship between teachers and campuses, which simplifies queries, improves data integrity, and provides more flexibility in teacher assignments.

## Database Schema

The implementation adds a new `TeacherCampus` model to the Prisma schema:

```prisma
model TeacherCampus {
  id          String         @id @default(cuid())
  teacherId   String
  campusId    String
  isPrimary   Boolean        @default(false)
  status      Status         @default(ACTIVE)
  joinedAt    DateTime       @default(now())
  teacher     TeacherProfile @relation(fields: [teacherId], references: [id])
  campus      Campus         @relation(fields: [campusId], references: [id])
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  
  @@unique([teacherId, campusId])
  @@map("teacher_campuses")
}
```

The `TeacherProfile` and `Campus` models have been updated to include the new relationship:

```prisma
model TeacherProfile {
  // existing fields
  campuses       TeacherCampus[]
  // other existing fields
}

model Campus {
  // existing fields
  teachers  TeacherCampus[]
  // other existing fields
}
```

## Service Layer

A new `CampusTeacherService` has been implemented to manage the teacher-campus relationship:

```typescript
export class CampusTeacherService {
  constructor(private db: PrismaClient, private userService: CampusUserService) {}
  
  async assignTeacherToCampus(userId: string, campusId: string, teacherId: string, isPrimary: boolean = false): Promise<TeacherCampusAssignment>;
  async removeTeacherFromCampus(userId: string, campusId: string, teacherId: string): Promise<{ success: boolean }>;
  async getTeachersForCampus(userId: string, campusId: string, includeInactive: boolean = false);
  async getCampusesForTeacher(userId: string, teacherId: string, includeInactive: boolean = false);
  async updateTeacherCampusStatus(userId: string, campusId: string, teacherId: string, status: Status): Promise<TeacherCampusAssignment>;
  async setPrimaryCampus(userId: string, teacherId: string, campusId: string): Promise<TeacherCampusAssignment>;
}
```

## API Endpoints

The following API endpoints have been added to the campus router:

- `assignTeacherToCampus`: Assigns a teacher to a campus
- `removeTeacherFromCampus`: Removes a teacher from a campus
- `updateTeacherCampusStatus`: Updates the status of a teacher-campus relationship
- `setPrimaryCampus`: Sets a campus as the primary campus for a teacher

The teacher router has been updated with a new endpoint:

- `getTeacherCampuses`: Gets all campuses for a teacher

## Migration

A migration script has been created to populate the `TeacherCampus` table with existing teacher-class-campus relationships:

```bash
npm run migrate:teacher-campus
```

The migration script performs the following steps:

1. Finds all teachers with class assignments
2. Creates `TeacherCampus` entries based on the campuses of those classes
3. Validates that all teachers have at least one campus
4. Sets a primary campus for teachers who don't have one

## Usage Examples

### Assigning a Teacher to a Campus

```typescript
const result = await api.campus.assignTeacherToCampus.mutate({
  campusId: "campus123",
  teacherId: "teacher456",
  isPrimary: true
});
```

### Getting Teachers for a Campus

```typescript
const teachers = await api.campus.getTeachers.query({
  campusId: "campus123",
  includeInactive: false
});
```

### Getting Campuses for a Teacher

```typescript
const campuses = await api.teacher.getTeacherCampuses.query({
  teacherId: "teacher456",
  includeInactive: false
});
```

## Benefits

The new implementation provides several benefits:

1. **Simplified Queries**: Direct relationship makes it easier to query teachers for a campus and campuses for a teacher
2. **Improved Data Integrity**: Teachers maintain their campus association even when removed from classes
3. **More Flexibility**: Teachers can be assigned to a campus before being assigned to specific classes
4. **Primary Campus**: Teachers can have a designated primary campus
5. **Status Management**: Teacher-campus relationships can be marked as active, inactive, or archived

## Future Improvements

Potential future improvements include:

1. Adding a UI for managing teacher-campus relationships
2. Implementing batch operations for assigning multiple teachers to a campus
3. Adding reporting features based on teacher-campus assignments 