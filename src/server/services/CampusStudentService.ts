import { PrismaClient, Status } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { CampusPermission } from "../../types/enums";
import { CampusUserService } from "./CampusUserService";

export interface StudentCampusAssignment {
  id?: string;
  studentId: string;
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
  student?: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  };
}

export interface StudentWithClasses {
  id: string;
  name: string | null;
  email: string | null;
  status: Status;
  isPrimary: boolean;
  joinedAt: Date;
  studentProfile: {
    id: string;
    enrollmentNumber: string | null;
    currentGrade: string | null;
  } | null;
  classes: {
    id: string;
    name: string;
    classGroup: {
      id: string;
      name: string;
    };
  }[];
}

export interface CampusWithAssignment {
  id: string;
  name: string;
  status: Status;
  isPrimary: boolean;
  joinedAt: Date;
  campusId: string;
}

export class CampusStudentService {
  constructor(private db: PrismaClient, private userService: CampusUserService) {}

  async assignStudentToCampus(
    userId: string,
    campusId: string,
    studentId: string,
    isPrimary: boolean = false
  ): Promise<StudentCampusAssignment> {
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_STUDENTS
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to assign students to this campus",
      });
    }

    try {
      // Check if student exists
      const student = await this.db.student.findUnique({
        where: { id: studentId },
        include: { user: true },
      });

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Student not found",
        });
      }

      // Check if campus exists
      const campus = await this.db.campus.findUnique({
        where: { id: campusId },
      });

      if (!campus) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campus not found",
        });
      }

      // Check if assignment already exists
      const existingAssignment = await this.db.studentCampus.findUnique({
        where: {
          studentId_campusId: {
            studentId,
            campusId,
          },
        },
      });

      if (existingAssignment) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Student is already assigned to this campus",
        });
      }

      // If this is primary, unset other primary assignments
      if (isPrimary) {
        await this.db.studentCampus.updateMany({
          where: {
            studentId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      // Create the assignment
      const assignment = await this.db.studentCampus.create({
        data: {
          studentId,
          campusId,
          isPrimary,
          status: Status.ACTIVE,
          joinedAt: new Date(),
        },
        include: {
          campus: {
            select: {
              id: true,
              name: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      return assignment;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to assign student to campus",
        cause: error,
      });
    }
  }

  async removeStudentFromCampus(
    userId: string,
    campusId: string,
    studentId: string
  ): Promise<{ success: boolean }> {
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_STUDENTS
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to remove students from this campus",
      });
    }

    try {
      await this.db.studentCampus.delete({
        where: {
          studentId_campusId: {
            studentId,
            campusId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove student from campus",
        cause: error,
      });
    }
  }

  async getStudentsForCampus(
    userId: string,
    campusId: string,
    includeInactive: boolean = false
  ): Promise<StudentWithClasses[]> {
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.VIEW_CAMPUS_CLASSES
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to view campus students",
      });
    }

    try {
      const students = await this.db.student.findMany({
        where: {
          campuses: {
            some: {
              campusId,
              ...(includeInactive ? {} : { status: Status.ACTIVE }),
            },
          },
        },
        include: {
          user: true,
          studentProfile: true,
          classes: {
            include: {
              class: {
                include: {
                  classGroup: true,
                },
              },
            },
          },
          campuses: {
            where: {
              campusId,
            },
            select: {
              isPrimary: true,
              status: true,
              joinedAt: true,
            },
          },
        },
      });

      return students.map((student) => ({
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        status: student.campuses[0]?.status || Status.ACTIVE,
        isPrimary: student.campuses[0]?.isPrimary || false,
        joinedAt: student.campuses[0]?.joinedAt || new Date(),
        studentProfile: student.studentProfile,
        classes: student.classes.map((c) => ({
          id: c.class.id,
          name: c.class.name,
          classGroup: {
            id: c.class.classGroup.id,
            name: c.class.classGroup.name,
          },
        })),
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch campus students",
        cause: error,
      });
    }
  }

  async getCampusesForStudent(
    userId: string,
    studentId: string,
    includeInactive: boolean = false
  ): Promise<CampusWithAssignment[]> {
    try {
      const campuses = await this.db.studentCampus.findMany({
        where: {
          studentId,
          ...(includeInactive ? {} : { status: Status.ACTIVE }),
        },
        include: {
          campus: true,
        },
      });

      return campuses.map((assignment) => ({
        id: assignment.campus.id,
        name: assignment.campus.name,
        status: assignment.status,
        isPrimary: assignment.isPrimary,
        joinedAt: assignment.joinedAt,
        campusId: assignment.campusId,
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch student campuses",
        cause: error,
      });
    }
  }

  async updateStudentCampusStatus(
    userId: string,
    campusId: string,
    studentId: string,
    status: Status
  ): Promise<StudentCampusAssignment> {
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_STUDENTS
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to update student status",
      });
    }

    try {
      const assignment = await this.db.studentCampus.update({
        where: {
          studentId_campusId: {
            studentId,
            campusId,
          },
        },
        data: {
          status,
        },
        include: {
          campus: {
            select: {
              id: true,
              name: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      return assignment;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update student status",
        cause: error,
      });
    }
  }

  async setPrimaryCampus(
    userId: string,
    studentId: string,
    campusId: string
  ): Promise<StudentCampusAssignment> {
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_STUDENTS
    );

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to set primary campus",
      });
    }

    try {
      // Unset other primary assignments
      await this.db.studentCampus.updateMany({
        where: {
          studentId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });

      // Set new primary campus
      const assignment = await this.db.studentCampus.update({
        where: {
          studentId_campusId: {
            studentId,
            campusId,
          },
        },
        data: {
          isPrimary: true,
        },
        include: {
          campus: {
            select: {
              id: true,
              name: true,
            },
          },
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      return assignment;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to set primary campus",
        cause: error,
      });
    }
  }
} 