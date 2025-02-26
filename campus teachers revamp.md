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


Part 2 ui updates

# Next Steps to Complete Teacher-Campus Relationship Implementation

Based on the code changes you've already made, you've successfully implemented the backend infrastructure for the direct many-to-many relationship between teachers and campuses. Here are the next steps to complete the implementation:

## 1. UI Components Development

### Teacher Management UI
- **Create a Campus Assignment Panel**:
  ```tsx
  // src/components/teacher/TeacherCampusAssignment.tsx
  import { useState, useEffect } from 'react';
  import { api } from '@/utils/api';
  import { Button, Select, Switch, Badge } from '@/components/ui';
  
  export function TeacherCampusAssignment({ teacherId }: { teacherId: string }) {
    const [selectedCampus, setSelectedCampus] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    
    const { data: campuses } = api.campus.getAll.useQuery();
    const { data: teacherCampuses, refetch } = api.teacher.getTeacherCampuses.useQuery({ teacherId });
    
    const assignMutation = api.campus.assignTeacherToCampus.useMutation({
      onSuccess: () => refetch()
    });
    
    const removeMutation = api.campus.removeTeacherFromCampus.useMutation({
      onSuccess: () => refetch()
    });
    
    const setPrimaryMutation = api.campus.setPrimaryCampus.useMutation({
      onSuccess: () => refetch()
    });
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Campus Assignments</h3>
        
        {/* Assignment Form */}
        <div className="flex gap-4 items-end">
          <Select
            label="Select Campus"
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            options={campuses?.map(c => ({ value: c.id, label: c.name })) || []}
          />
          <Switch 
            label="Primary Campus"
            checked={isPrimary}
            onChange={() => setIsPrimary(!isPrimary)}
          />
          <Button 
            onClick={() => {
              if (selectedCampus) {
                assignMutation.mutate({
                  campusId: selectedCampus,
                  teacherId,
                  isPrimary
                });
              }
            }}
            disabled={!selectedCampus}
          >
            Assign
          </Button>
        </div>
        
        {/* Current Assignments */}
        <div className="mt-4">
          <h4 className="text-md font-medium">Current Assignments</h4>
          <ul className="divide-y">
            {teacherCampuses?.map(campus => (
              <li key={campus.id} className="py-2 flex justify-between items-center">
                <div>
                  {campus.name}
                  {campus.isPrimary && <Badge className="ml-2">Primary</Badge>}
                </div>
                <div className="flex gap-2">
                  {!campus.isPrimary && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPrimaryMutation.mutate({
                        teacherId,
                        campusId: campus.id
                      })}
                    >
                      Set as Primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeMutation.mutate({
                      teacherId,
                      campusId: campus.id
                    })}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  ```

### Campus Management UI
- **Create a Teacher Assignment Panel**:
  ```tsx
  // src/components/campus/CampusTeacherManagement.tsx
  import { useState } from 'react';
  import { api } from '@/utils/api';
  import { Button, Select, Table, Badge, Dialog } from '@/components/ui';
  
  export function CampusTeacherManagement({ campusId }: { campusId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    
    const { data: teachers, refetch } = api.campus.getTeachers.useQuery({ 
      campusId,
      includeInactive: true
    });
    
    const { data: availableTeachers } = api.teacher.getAll.useQuery();
    
    const assignMutation = api.campus.assignTeacherToCampus.useMutation({
      onSuccess: () => {
        refetch();
        setIsOpen(false);
      }
    });
    
    const removeMutation = api.campus.removeTeacherFromCampus.useMutation({
      onSuccess: () => refetch()
    });
    
    const updateStatusMutation = api.campus.updateTeacherCampusStatus.useMutation({
      onSuccess: () => refetch()
    });
    
    return (
      <div>
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Campus Teachers</h2>
          <Button onClick={() => setIsOpen(true)}>Add Teacher</Button>
        </div>
        
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Primary</Table.Head>
              <Table.Head>Actions</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {teachers?.map(teacher => (
              <Table.Row key={teacher.teacherProfile.id}>
                <Table.Cell>{teacher.name}</Table.Cell>
                <Table.Cell>{teacher.email}</Table.Cell>
                <Table.Cell>
                  <Badge 
                    variant={teacher.teacherProfile.campuses[0].status === 'ACTIVE' ? 'success' : 'warning'}
                  >
                    {teacher.teacherProfile.campuses[0].status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {teacher.teacherProfile.campuses[0].isPrimary ? 'Yes' : 'No'}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    {teacher.teacherProfile.campuses[0].status === 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({
                          campusId,
                          teacherId: teacher.teacherProfile.id,
                          status: 'INACTIVE'
                        })}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({
                          campusId,
                          teacherId: teacher.teacherProfile.id,
                          status: 'ACTIVE'
                        })}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeMutation.mutate({
                        campusId,
                        teacherId: teacher.teacherProfile.id
                      })}
                    >
                      Remove
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Add Teacher to Campus</Dialog.Title>
            </Dialog.Header>
            <Select
              label="Select Teacher"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              options={availableTeachers?.map(t => ({ 
                value: t.teacherProfile.id, 
                label: t.name 
              })) || []}
            />
            <Dialog.Footer>
              <Button
                onClick={() => {
                  if (selectedTeacher) {
                    assignMutation.mutate({
                      campusId,
                      teacherId: selectedTeacher,
                      isPrimary: false
                    });
                  }
                }}
                disabled={!selectedTeacher}
              >
                Assign Teacher
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </div>
    );
  }
  ```

### Update Existing Pages
- **Teacher Profile Page**: Add the campus assignment component
- **Campus Management Page**: Add the teacher management component
- **Teacher Dashboard**: Show primary campus information

## 2. API Integration

### Update API Hooks
- Create custom hooks for teacher-campus operations:

```tsx
// src/hooks/useTeacherCampus.ts
import { api } from '@/utils/api';

export function useTeacherCampus(teacherId: string) {
  const utils = api.useContext();
  
  const { data: campuses, isLoading } = api.teacher.getTeacherCampuses.useQuery({ 
    teacherId,
    includeInactive: false
  });
  
  const assignMutation = api.campus.assignTeacherToCampus.useMutation({
    onSuccess: () => {
      utils.teacher.getTeacherCampuses.invalidate({ teacherId });
    }
  });
  
  const removeMutation = api.campus.removeTeacherFromCampus.useMutation({
    onSuccess: () => {
      utils.teacher.getTeacherCampuses.invalidate({ teacherId });
    }
  });
  
  const setPrimaryMutation = api.campus.setPrimaryCampus.useMutation({
    onSuccess: () => {
      utils.teacher.getTeacherCampuses.invalidate({ teacherId });
    }
  });
  
  return {
    campuses,
    isLoading,
    assignToCampus: (campusId: string, isPrimary: boolean = false) => 
      assignMutation.mutate({ campusId, teacherId, isPrimary }),
    removeFromCampus: (campusId: string) => 
      removeMutation.mutate({ campusId, teacherId }),
    setPrimaryCampus: (campusId: string) => 
      setPrimaryMutation.mutate({ teacherId, campusId })
  };
}
```

## 3. Update Navigation and Permissions

### Update Navigation
- Add new navigation items for teacher-campus management:

```tsx
// src/components/layout/CampusNavigation.tsx
// Add this to the existing navigation items
{
  hasPermission(CampusPermission.MANAGE_CAMPUS_TEACHERS) && (
    <NavItem 
      href={`/campus/${campusId}/teachers`}
      icon={<UserGroupIcon />}
      label="Teachers"
    />
  )
}
```

### Update Permission Checks
- Ensure the UI respects the new permission `MANAGE_CAMPUS_TEACHERS`:

```tsx
// src/utils/permissions.ts
// Add to existing permission checks
export function canManageCampusTeachers(permissions: string[]): boolean {
  return permissions.includes(CampusPermission.MANAGE_CAMPUS_TEACHERS);
}
```

## 4. Testing

### Create Test Plan
1. **Unit Tests**:
   - Test the `CampusTeacherService` methods
   - Test the API endpoints

2. **Integration Tests**:
   - Test the complete flow of assigning a teacher to a campus
   - Test setting a primary campus
   - Test removing a teacher from a campus

3. **UI Tests**:
   - Test the teacher campus assignment component
   - Test the campus teacher management component

### Manual Testing Checklist
- [ ] Assign a teacher to a campus
- [ ] Set a primary campus for a teacher
- [ ] Remove a teacher from a campus
- [ ] Update a teacher's campus status
- [ ] View all teachers for a campus
- [ ] View all campuses for a teacher
- [ ] Verify permissions are correctly enforced
- [ ] Test with different user roles

## 5. Documentation Updates

### Update User Documentation
- Create a guide for campus administrators on how to manage teacher assignments
- Create a guide for teachers on how to view their campus assignments

### Update API Documentation
- Document the new API endpoints
- Update the schema documentation to include the new `TeacherCampus` model

### Update Technical Documentation
- Update the architecture diagrams to show the new relationship
- Document the migration process for future reference

## 6. Deployment Plan

1. **Database Migration**:
   - Run the migration script to create the `TeacherCampus` table
   - Populate the table with existing relationships

2. **Code Deployment**:
   - Deploy the backend changes first
   - Deploy the UI changes after verifying the backend is working

3. **Post-Deployment Verification**:
   - Verify that all teachers have at least one campus assignment
   - Verify that all teachers have a primary campus
   - Check for any errors in the logs

## Conclusion

You've already completed the most complex part of the implementation by setting up the backend infrastructure. The next steps focus on creating a user-friendly interface for managing the teacher-campus relationships and ensuring that the system works correctly in all scenarios. By following this plan, you'll be able to complete the implementation successfully.