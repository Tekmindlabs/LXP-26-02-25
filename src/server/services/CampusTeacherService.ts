import { PrismaClient, Status, Prisma } from "@prisma/client";
import { CampusUserService } from "./CampusUserService";
import { CampusPermission } from "../../types/enums";
import { TRPCError } from "@trpc/server";

// Define custom types for the teacher-campus relationship
export interface TeacherCampusAssignment {
  id?: string;
  teacherId: string;
  campusId: string;
  isPrimary: boolean;
  status: Status;
  joinedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
  campus?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  };
}

// Define a type for the teacher with classes
export interface TeacherWithClasses {
  id: string;
  name: string | null;
  email: string | null;
  status: Status;
  isPrimary: boolean;
  joinedAt: Date;
  teacherType: string | null;
  specialization: string | null;
  classes: {
    id: string;
    name: string;
    classGroup: {
      id: string;
      name: string;
    };
    subject: {
      id: string;
      name: string;
    };
  }[];
}

// Define a type for campus with assignment
export interface CampusWithAssignment {
  id: string;
  name: string;
  status: Status;
  isPrimary: boolean;
  joinedAt: Date;
  campusId: string;
}

export class CampusTeacherService {
  constructor(private db: PrismaClient, private userService: CampusUserService) {}
  
  async assignTeacherToCampus(
    userId: string, 
    campusId: string, 
    teacherId: string, 
    isPrimary: boolean = false
  ): Promise<TeacherCampusAssignment> {
    // Check if user has permission to manage campus teachers
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_TEACHERS
    );
    
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to manage teachers in this campus"
      });
    }
    
    // Check if teacher exists
    const teacher = await this.db.teacherProfile.findUnique({
      where: { id: teacherId }
    });
    
    if (!teacher) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Teacher not found"
      });
    }
    
    // Check if campus exists
    const campus = await this.db.campus.findUnique({
      where: { id: campusId }
    });
    
    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found"
      });
    }
    
    // Since teacherCampus doesn't exist in Prisma, we'll use a custom implementation
    // First check if relationship already exists
    const existingRelationship = await this.db.$queryRaw`
      SELECT * FROM "TeacherCampus" 
      WHERE "teacherId" = ${teacherId} AND "campusId" = ${campusId}
    `;
    
    if (Array.isArray(existingRelationship) && existingRelationship.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Teacher is already assigned to this campus"
      });
    }
    
    // If this is the primary campus, unset any existing primary campus
    if (isPrimary) {
      await this.db.$executeRaw`
        UPDATE "TeacherCampus" 
        SET "isPrimary" = false 
        WHERE "teacherId" = ${teacherId} AND "isPrimary" = true
      `;
    }
    
    // Create the relationship
    const result = await this.db.$executeRaw`
      INSERT INTO "TeacherCampus" ("teacherId", "campusId", "isPrimary", "status", "joinedAt", "createdAt", "updatedAt")
      VALUES (${teacherId}, ${campusId}, ${isPrimary}, ${Status.ACTIVE}, ${new Date()}, ${new Date()}, ${new Date()})
      RETURNING *
    `;
    
    // Fetch the created relationship with includes
    const teacherCampus: TeacherCampusAssignment = {
      teacherId,
      campusId,
      isPrimary,
      status: Status.ACTIVE,
      joinedAt: new Date(),
      campus: {
        id: campus.id,
        name: campus.name
      },
      teacher: {
        id: teacher.id,
        user: {
          id: teacher.userId,
          name: null,
          email: null
        }
      }
    };
    
    // Get user details
    const user = await this.db.user.findUnique({
      where: { id: teacher.userId }
    });
    
    if (user && teacherCampus.teacher) {
      teacherCampus.teacher.user.name = user.name;
      teacherCampus.teacher.user.email = user.email;
    }
    
    return teacherCampus;
  }
  
  async removeTeacherFromCampus(
    userId: string, 
    campusId: string, 
    teacherId: string
  ): Promise<{ success: boolean }> {
    // Check if user has permission to manage campus teachers
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_TEACHERS
    );
    
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to manage teachers in this campus"
      });
    }
    
    // Check if relationship exists
    const relationship = await this.db.$queryRaw`
      SELECT * FROM "TeacherCampus" 
      WHERE "teacherId" = ${teacherId} AND "campusId" = ${campusId}
    `;
    
    if (!Array.isArray(relationship) || relationship.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Teacher is not assigned to this campus"
      });
    }
    
    // Delete the relationship
    await this.db.$executeRaw`
      DELETE FROM "TeacherCampus" 
      WHERE "teacherId" = ${teacherId} AND "campusId" = ${campusId}
    `;
    
    return { success: true };
  }
  
  async getTeachersForCampus(
    userId: string, 
    campusId: string,
    includeInactive: boolean = false
  ): Promise<TeacherWithClasses[]> {
    // Check if user has permission to view campus classes
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.VIEW_CAMPUS_CLASSES
    );
    
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to view this campus"
      });
    }
    
    // Check if campus exists
    const campus = await this.db.campus.findUnique({
      where: { id: campusId }
    });
    
    if (!campus) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Campus not found"
      });
    }
    
    // Get all teachers for this campus using raw query
    const statusCondition = includeInactive ? '' : ` AND tc."status" = 'ACTIVE'`;
    const teacherCampuses = await this.db.$queryRaw<any[]>`
      SELECT 
        tc."teacherId", tc."status", tc."isPrimary", tc."joinedAt",
        tp."id" as "teacherId", tp."teacherType", tp."specialization",
        u."id" as "userId", u."name", u."email"
      FROM "TeacherCampus" tc
      JOIN "TeacherProfile" tp ON tc."teacherId" = tp."id"
      JOIN "User" u ON tp."userId" = u."id"
      WHERE tc."campusId" = ${campusId} ${Prisma.raw(statusCondition)}
    `;
    
    // Get classes for each teacher
    const result: TeacherWithClasses[] = [];
    
    for (const tc of teacherCampuses) {
      // Get classes and subjects for this teacher
      const teacherClasses = await this.db.$queryRaw<any[]>`
        SELECT 
          tc.id as "teacherClassId",
          c.id as "classId", c.name as "className",
          cg.id as "classGroupId", cg.name as "classGroupName",
          s.id as "subjectId", s.name as "subjectName"
        FROM "TeacherClass" tc
        JOIN "Class" c ON tc."classId" = c.id
        JOIN "ClassGroup" cg ON c."classGroupId" = cg.id
        LEFT JOIN "Subject" s ON s.id = tc."subjectId"
        WHERE tc."teacherId" = ${tc.teacherId}
        AND c."campusId" = ${campusId}
      `;
      
      result.push({
        id: tc.teacherId,
        name: tc.name,
        email: tc.email,
        status: tc.status,
        isPrimary: tc.isPrimary,
        joinedAt: tc.joinedAt,
        teacherType: tc.teacherType,
        specialization: tc.specialization,
        classes: teacherClasses.map(c => ({
          id: c.classId,
          name: c.className,
          classGroup: {
            id: c.classGroupId,
            name: c.classGroupName
          },
          subject: {
            id: c.subjectId,
            name: c.subjectName
          }
        }))
      });
    }
    
    return result;
  }
  
  async getCampusesForTeacher(
    userId: string, 
    teacherId: string,
    includeInactive: boolean = false
  ): Promise<CampusWithAssignment[]> {
    // Check if teacher exists
    const teacher = await this.db.teacherProfile.findUnique({
      where: { id: teacherId }
    });
    
    if (!teacher) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Teacher not found"
      });
    }
    
    // Get all campuses for this teacher using raw query
    const statusCondition = includeInactive ? '' : ` AND tc."status" = 'ACTIVE'`;
    const teacherCampuses = await this.db.$queryRaw<any[]>`
      SELECT 
        c."id", c."name",
        tc."status", tc."isPrimary", tc."joinedAt", tc."campusId"
      FROM "TeacherCampus" tc
      JOIN "Campus" c ON tc."campusId" = c."id"
      WHERE tc."teacherId" = ${teacherId} ${Prisma.raw(statusCondition)}
    `;
    
    // Map to a more usable format
    return teacherCampuses.map(tc => ({
      id: tc.id,
      name: tc.name,
      status: tc.status,
      isPrimary: tc.isPrimary,
      joinedAt: tc.joinedAt,
      campusId: tc.campusId
    }));
  }
  
  async updateTeacherCampusStatus(
    userId: string,
    campusId: string,
    teacherId: string,
    status: Status
  ): Promise<TeacherCampusAssignment> {
    // Check if user has permission to manage campus teachers
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_TEACHERS
    );
    
    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have permission to manage teachers in this campus"
      });
    }
    
    // Check if relationship exists
    const relationship = await this.db.$queryRaw`
      SELECT * FROM "TeacherCampus" 
      WHERE "teacherId" = ${teacherId} AND "campusId" = ${campusId}
    `;
    
    if (!Array.isArray(relationship) || relationship.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Teacher is not assigned to this campus"
      });
    }
    
    // Update the status
    await this.db.$executeRaw`
      UPDATE "TeacherCampus" 
      SET "status" = ${status}, "updatedAt" = ${new Date()}
      WHERE "teacherId" = ${teacherId} AND "campusId" = ${campusId}
    `;
    
    // Get the updated relationship
    const teacher = await this.db.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        user: true
      }
    });
    
    const campus = await this.db.campus.findUnique({
      where: { id: campusId }
    });
    
    if (!teacher || !campus) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve updated relationship"
      });
    }
    
    // Return the updated relationship
    return {
      teacherId,
      campusId,
      status,
      isPrimary: (relationship[0] as any).isPrimary,
      joinedAt: (relationship[0] as any).joinedAt,
      campus: {
        id: campus.id,
        name: campus.name
      },
      teacher: {
        id: teacher.id,
        user: {
          id: teacher.user.id,
          name: teacher.user.name,
          email: teacher.user.email
        }
      }
    };
  }
  
  async setPrimaryCampus(
    userId: string,
    teacherId: string,
    campusId: string
  ): Promise<TeacherCampusAssignment> {
    // Check if relationship exists
    const relationship = await this.db.$queryRaw`
      SELECT * FROM "TeacherCampus" 
      WHERE "teacherId" = ${teacherId} AND "campusId" = ${campusId}
    `;
    
    if (!Array.isArray(relationship) || relationship.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Teacher is not assigned to this campus"
      });
    }
    
    // Unset any existing primary campus
    await this.db.$executeRaw`
      UPDATE "TeacherCampus" 
      SET "isPrimary" = false, "updatedAt" = ${new Date()}
      WHERE "teacherId" = ${teacherId} AND "isPrimary" = true
    `;
    
    // Set this campus as primary
    await this.db.$executeRaw`
      UPDATE "TeacherCampus" 
      SET "isPrimary" = true, "updatedAt" = ${new Date()}
      WHERE "teacherId" = ${teacherId} AND "campusId" = ${campusId}
    `;
    
    // Get the updated relationship
    const teacher = await this.db.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        user: true
      }
    });
    
    const campus = await this.db.campus.findUnique({
      where: { id: campusId }
    });
    
    if (!teacher || !campus) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve updated relationship"
      });
    }
    
    // Return the updated relationship
    return {
      teacherId,
      campusId,
      status: (relationship[0] as any).status,
      isPrimary: true,
      joinedAt: (relationship[0] as any).joinedAt,
      campus: {
        id: campus.id,
        name: campus.name
      },
      teacher: {
        id: teacher.id,
        user: {
          id: teacher.user.id,
          name: teacher.user.name,
          email: teacher.user.email
        }
      }
    };
  }
} 