# System Analysis for Teacher-Campus Relationship Implementation

After analyzing the codebase, I'll provide a comprehensive assessment of potential conflicts and required updates when implementing the recommended direct many-to-many relationship between teachers and campuses.

## Current System Analysis

The current system has several limitations:

1. **Indirect Teacher-Campus Relationship**: Teachers are only associated with campuses through their class assignments (`teacherProfile.classes.some.class.campusId`).

2. **Query Complexity**: The current approach in `campus.ts` (line 868) uses a complex nested query to find teachers for a campus.

3. **Data Integrity Issues**: When a teacher is removed from a class, they lose their campus association entirely.

4. **Management Limitations**: No way to assign teachers to a campus before assigning them to specific classes.

## Potential Conflicts

Implementing the proposed changes may cause conflicts in these areas:

### 1. Database Schema Conflicts

- **Existing Queries**: Queries in `campus.ts` that filter teachers by campus will need updating.
- **Migration Complexity**: Existing teacher-campus relationships through classes need migration to the new direct relationship.

### 2. Service Layer Conflicts

- **CampusTeacherAllocationService**: This service currently manages teacher-class relationships and would need to be updated or coordinated with the new CampusTeacherService.
- **Permission Checks**: Current permission checks in `campus-user.ts` may need updating to include the new relationship.

### 3. API Router Conflicts

- **Duplicate Procedures**: The `getTeachers` procedure in `campus.ts` (line 859) is duplicated and will need refactoring.
- **Inconsistent Teacher Retrieval**: Different parts of the code retrieve teachers differently, which will need standardization.

### 4. UI/UX Conflicts

- **Teacher Management Screens**: Current UI likely assumes teachers are only associated with campuses through classes.
- **Permission Management**: UI for managing permissions may need updates to reflect new capabilities.

## Required Code Updates

### 1. Prisma Schema Updates

```prisma
// Add to schema.prisma
model TeacherCampus {
  id          String         @id @default(cuid())
  teacherId   String
  campusId    String
  isPrimary   Boolean        @default(false)
  status      Status         @default(ACTIVE)
  joinedAt    DateTime       @default(now())
  teacher     TeacherProfile @relation(fields: [teacherId], references: [id])
  campus      Campus         @relation(fields: [campusId], references: [id])
  
  @@unique([teacherId, campusId])
}

// Update TeacherProfile model
model TeacherProfile {
  // existing fields
  campuses TeacherCampus[]
}

// Update Campus model
model Campus {
  // existing fields
  teachers TeacherCampus[]
}
```

### 2. Type Definition Updates

```typescript
// src/types/teacher.ts
export interface TeacherProfile {
  // existing properties
  campuses: TeacherCampusAssignment[];
}

export interface TeacherCampusAssignment {
  id: string;
  campus: {
    id: string;
    name: string;
  };
  isPrimary: boolean;
  status: Status;
  joinedAt: Date;
}

// src/types/campus.ts
export interface Campus {
  // existing properties
  teacherAssignments?: TeacherCampusAssignment[];
}
```

### 3. New Service Implementation

```typescript
// src/server/services/CampusTeacherService.ts
export class CampusTeacherService {
  constructor(private db: PrismaClient, private userService: CampusUserService) {}
  
  async assignTeacherToCampus(
    userId: string, 
    campusId: string, 
    teacherId: string, 
    isPrimary: boolean = false
  ): Promise<TeacherCampusAssignment> {
    // Permission check
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_TEACHERS
    );
    
    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to assign teachers to this campus'
      });
    }
    
    // Check if assignment already exists
    const existingAssignment = await this.db.teacherCampus.findUnique({
      where: {
        teacherId_campusId: {
          teacherId,
          campusId
        }
      }
    });
    
    if (existingAssignment) {
      // Update existing assignment
      return this.db.teacherCampus.update({
        where: {
          id: existingAssignment.id
        },
        data: {
          isPrimary,
          status: 'ACTIVE'
        },
        include: {
          campus: true
        }
      });
    }
    
    // Create new assignment
    return this.db.teacherCampus.create({
      data: {
        teacherId,
        campusId,
        isPrimary,
        status: 'ACTIVE'
      },
      include: {
        campus: true
      }
    });
  }
  
  // Additional methods for managing teacher-campus relationships
  async removeTeacherFromCampus(userId: string, campusId: string, teacherId: string): Promise<void> {
    // Implementation
  }
  
  async getTeachersForCampus(userId: string, campusId: string): Promise<TeacherProfile[]> {
    // Implementation
  }
  
  async getCampusesForTeacher(userId: string, teacherId: string): Promise<Campus[]> {
    // Implementation
  }
}
```

### 4. API Router Updates

```typescript
// Update campus.ts router
// Replace the duplicate getTeachers procedure
getCampusTeachers: protectedProcedure
  .input(z.object({
    campusId: z.string()
  }))
  .query(async ({ ctx, input }) => {
    const campusTeacherService = new CampusTeacherService(
      ctx.prisma,
      new CampusUserService(ctx.prisma)
    );
    
    return campusTeacherService.getTeachersForCampus(
      ctx.session.user.id,
      input.campusId
    );
  }),

// Add new procedures
assignTeacherToCampus: protectedProcedure
  .input(z.object({
    campusId: z.string(),
    teacherId: z.string(),
    isPrimary: z.boolean().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const campusTeacherService = new CampusTeacherService(
      ctx.prisma,
      new CampusUserService(ctx.prisma)
    );
    
    return campusTeacherService.assignTeacherToCampus(
      ctx.session.user.id,
      input.campusId,
      input.teacherId,
      input.isPrimary
    );
  }),

removeTeacherFromCampus: protectedProcedure
  .input(z.object({
    campusId: z.string(),
    teacherId: z.string()
  }))
  .mutation(async ({ ctx, input }) => {
    const campusTeacherService = new CampusTeacherService(
      ctx.prisma,
      new CampusUserService(ctx.prisma)
    );
    
    return campusTeacherService.removeTeacherFromCampus(
      ctx.session.user.id,
      input.campusId,
      input.teacherId
    );
  }),
```

### 5. Update Teacher Router

```typescript
// Add to teacher.ts router
getTeacherCampuses: protectedProcedure
  .input(z.object({
    teacherId: z.string()
  }))
  .query(async ({ ctx, input }) => {
    const campusTeacherService = new CampusTeacherService(
      ctx.prisma,
      new CampusUserService(ctx.prisma)
    );
    
    return campusTeacherService.getCampusesForTeacher(
      ctx.session.user.id,
      input.teacherId
    );
  }),
```

### 6. Migration Script

```typescript
// src/server/migrations/teacherCampusMigration.ts
export async function migrateTeacherCampusRelationships(prisma: PrismaClient) {
  // Get all teachers with class assignments
  const teachers = await prisma.teacherProfile.findMany({
    include: {
      classes: {
        include: {
          class: true
        }
      }
    }
  });
  
  // Create TeacherCampus entries based on existing class assignments
  for (const teacher of teachers) {
    // Get unique campuses from teacher's classes
    const campusIds = new Set<string>();
    for (const classAssignment of teacher.classes) {
      if (classAssignment.class.campusId) {
        campusIds.add(classAssignment.class.campusId);
      }
    }
    
    // Create TeacherCampus entries
    for (const campusId of campusIds) {
      await prisma.teacherCampus.create({
        data: {
          teacherId: teacher.id,
          campusId,
          isPrimary: false, // Default to false, can be updated later
          status: 'ACTIVE'
        }
      });
    }
  }
  
  console.log(`Migrated ${teachers.length} teachers to direct campus relationships`);
}
```

## Implementation Strategy

1. **Database Migration**: 
   - Create the new `TeacherCampus` table
   - Run the migration script to populate initial data

2. **Service Layer Updates**:
   - Implement the `CampusTeacherService`
   - Update `CampusTeacherAllocationService` to work with the new relationship

3. **API Router Updates**:
   - Update the campus router to use the new service
   - Add new endpoints for managing teacher-campus relationships
   - Fix the duplicate `getTeachers` procedure

4. **UI Updates**:
   - Add a "Campus Assignment" tab to teacher management
   - Create forms for assigning teachers to campuses
   - Update teacher lists to show campus affiliations

5. **Testing**:
   - Test all new endpoints
   - Verify that existing functionality still works
   - Check that permissions are correctly enforced

## Conclusion

The proposed changes will significantly improve the teacher management system by creating a direct relationship between teachers and campuses. This will simplify queries, improve data integrity, and provide more flexibility in teacher assignments. The main challenges will be updating existing code that assumes the indirect relationship and ensuring a smooth migration of data. With careful planning and thorough testing, these changes can be implemented successfully.