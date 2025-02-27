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
    
    try {
      // Check if teacher exists
      const teacher = await this.db.teacherProfile.findUnique({
        where: { id: teacherId },
        include: { user: true }
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
      
      // Check if relationship already exists
      const existingAssignment = await this.db.teacherCampus.findUnique({
        where: {
          teacherId_campusId: {
            teacherId,
            campusId
          }
        }
      });
      
      if (existingAssignment) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Teacher is already assigned to this campus"
        });
      }
      
      // If this is primary, unset other primary assignments
      if (isPrimary) {
        await this.db.teacherCampus.updateMany({
          where: {
            teacherId,
            isPrimary: true
          },
          data: {
            isPrimary: false
          }
        });
      }
      
      // Create the assignment
      const assignment = await this.db.teacherCampus.create({
        data: {
          teacherId,
          campusId,
          isPrimary,
          status: Status.ACTIVE,
          joinedAt: new Date()
        },
        include: {
          campus: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      });
      
      return {
        id: assignment.id,
        teacherId: assignment.teacherId,
        campusId: assignment.campusId,
        isPrimary: assignment.isPrimary,
        status: assignment.status,
        joinedAt: assignment.joinedAt,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        campus: {
          id: assignment.campus.id,
          name: assignment.campus.name
        },
        teacher: {
          id: assignment.teacher.id,
          user: {
            id: assignment.teacher.user.id,
            name: assignment.teacher.user.name,
            email: assignment.teacher.user.email
          }
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign teacher to campus",
        cause: error
      });
    }
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
    const relationship = await this.db.teacherCampus.findUnique({
      where: {
        teacherId_campusId: {
          teacherId,
          campusId
        }
      }
    });
    
    if (!relationship) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Teacher is not assigned to this campus"
      });
    }
    
    // Delete the relationship
    await this.db.teacherCampus.delete({
      where: {
        teacherId_campusId: {
          teacherId,
          campusId
        }
      }
    });
    
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
    
    // Get all teachers for this campus
    const teacherCampuses = await this.db.teacherCampus.findMany({
      where: {
        campusId,
        status: includeInactive ? undefined : Status.ACTIVE
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    });
    
    // Get classes for each teacher
    const result: TeacherWithClasses[] = [];
    
    for (const tc of teacherCampuses) {
      // Get classes and subjects for this teacher
      const teacherClasses = await this.db.teacherClass.findMany({
        where: {
          teacherId: tc.teacherId,
          class: {
            campusId
          }
        },
        include: {
          class: {
            include: {
              classGroup: true,
              subject: true
            }
          }
        }
      });
      
      result.push({
        id: tc.teacherId,
        name: tc.teacher.user.name,
        email: tc.teacher.user.email,
        status: tc.status,
        isPrimary: tc.isPrimary,
        joinedAt: tc.joinedAt,
        teacherType: tc.teacher.teacherType,
        specialization: tc.teacher.specialization,
        classes: teacherClasses.map(c => ({
          id: c.class.id,
          name: c.class.name,
          classGroup: {
            id: c.class.classGroupId,
            name: c.class.classGroup.name
          },
          subject: {
            id: c.class.subjectId,
            name: c.class.subject.name
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
    
    // Get all campuses for this teacher
    const teacherCampuses = await this.db.teacherCampus.findMany({
      where: {
        teacherId,
        status: includeInactive ? undefined : Status.ACTIVE
      },
      include: {
        campus: true
      }
    });
    
    // Map to a more usable format
    return teacherCampuses.map(tc => ({
      id: tc.campus.id,
      name: tc.campus.name,
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
    const relationship = await this.db.teacherCampus.findUnique({
      where: {
        teacherId_campusId: {
          teacherId,
          campusId
        }
      }
    });
    
    if (!relationship) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Teacher is not assigned to this campus"
      });
    }
    
    // Update the status
    const updatedRelationship = await this.db.teacherCampus.update({
      where: {
        teacherId_campusId: {
          teacherId,
          campusId
        }
      },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        campus: true,
        teacher: {
          include: {
            user: true
          }
        }
      }
    });
    
    return {
      id: updatedRelationship.id,
      teacherId: updatedRelationship.teacherId,
      campusId: updatedRelationship.campusId,
      isPrimary: updatedRelationship.isPrimary,
      status: updatedRelationship.status,
      joinedAt: updatedRelationship.joinedAt,
      createdAt: updatedRelationship.createdAt,
      updatedAt: updatedRelationship.updatedAt,
      campus: {
        id: updatedRelationship.campus.id,
        name: updatedRelationship.campus.name
      },
      teacher: {
        id: updatedRelationship.teacher.id,
        user: {
          id: updatedRelationship.teacher.user.id,
          name: updatedRelationship.teacher.user.name,
          email: updatedRelationship.teacher.user.email
        }
      }
    };
  }
  
  async setPrimaryCampus(
    userId: string,
    teacherId: string,
    campusId: string
  ): Promise<TeacherCampusAssignment> {
    try {
      // Check if relationship exists
      const existingAssignment = await this.db.teacherCampus.findUnique({
        where: {
          teacherId_campusId: {
            teacherId,
            campusId
          }
        }
      });
      
      if (!existingAssignment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher is not assigned to this campus"
        });
      }
      
      // Unset any existing primary campus
      await this.db.teacherCampus.updateMany({
        where: {
          teacherId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
      
      // Set this campus as primary
      const updatedAssignment = await this.db.teacherCampus.update({
        where: {
          teacherId_campusId: {
            teacherId,
            campusId
          }
        },
        data: {
          isPrimary: true
        },
        include: {
          campus: true,
          teacher: {
            include: {
              user: true
            }
          }
        }
      });
      
      return {
        id: updatedAssignment.id,
        teacherId: updatedAssignment.teacherId,
        campusId: updatedAssignment.campusId,
        isPrimary: updatedAssignment.isPrimary,
        status: updatedAssignment.status,
        joinedAt: updatedAssignment.joinedAt,
        createdAt: updatedAssignment.createdAt,
        updatedAt: updatedAssignment.updatedAt,
        campus: {
          id: updatedAssignment.campus.id,
          name: updatedAssignment.campus.name
        },
        teacher: {
          id: updatedAssignment.teacher.id,
          user: {
            id: updatedAssignment.teacher.user.id,
            name: updatedAssignment.teacher.user.name,
            email: updatedAssignment.teacher.user.email
          }
        }
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to set primary campus",
        cause: error
      });
    }
  }
} 