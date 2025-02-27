import { PrismaClient, Status, Prisma, TeacherType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Validation schemas
export const teacherProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  teacherType: z.nativeEnum(TeacherType),
  specialization: z.string().optional(),
});

export const teacherAssignmentSchema = z.object({
  campusId: z.string(),
  isPrimary: z.boolean().default(false),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
});

export type TeacherProfileInput = z.infer<typeof teacherProfileSchema>;
export type TeacherAssignmentInput = z.infer<typeof teacherAssignmentSchema>;

export class TeacherService {
  constructor(private db: PrismaClient) {}

  /**
   * Create or update a teacher profile with campus assignments in a single transaction
   */
  async upsertTeacher(data: {
    profile: TeacherProfileInput;
    assignments?: TeacherAssignmentInput[];
    subjects?: string[];
    classes?: string[];
  }) {
    try {
      // Validate input data
      const validatedProfile = teacherProfileSchema.parse(data.profile);
      const validatedAssignments = data.assignments?.map(a => 
        teacherAssignmentSchema.parse(a)
      ) || [];

      return await this.db.$transaction(async (tx) => {
        // Create or update teacher profile
        const profile = await tx.teacherProfile.upsert({
          where: { 
            userId: validatedProfile.userId 
          },
          create: {
            userId: validatedProfile.userId,
            teacherType: validatedProfile.teacherType,
            specialization: validatedProfile.specialization,
          },
          update: {
            teacherType: validatedProfile.teacherType,
            specialization: validatedProfile.specialization,
          }
        });

        // Handle campus assignments
        if (validatedAssignments.length > 0) {
          // Remove existing assignments that are not in the new list
          await tx.teacherCampus.deleteMany({
            where: {
              teacherId: profile.id,
              campusId: { notIn: validatedAssignments.map(a => a.campusId) }
            }
          });

          // Update or create new assignments
          for (const assignment of validatedAssignments) {
            await tx.teacherCampus.upsert({
              where: {
                teacherId_campusId: {
                  teacherId: profile.id,
                  campusId: assignment.campusId
                }
              },
              create: {
                teacherId: profile.id,
                campusId: assignment.campusId,
                isPrimary: assignment.isPrimary,
                status: assignment.status,
                joinedAt: new Date()
              },
              update: {
                isPrimary: assignment.isPrimary,
                status: assignment.status
              }
            });
          }
        }

        // Handle subject assignments
        if (data.subjects?.length) {
          await tx.teacherSubject.deleteMany({
            where: { 
              teacherId: profile.id,
              subjectId: { notIn: data.subjects }
            }
          });

          await tx.teacherSubject.createMany({
            data: data.subjects.map(subjectId => ({
              teacherId: profile.id,
              subjectId,
              status: Status.ACTIVE
            })),
            skipDuplicates: true
          });
        }

        // Handle class assignments
        if (data.classes?.length) {
          await tx.teacherClass.deleteMany({
            where: {
              teacherId: profile.id,
              classId: { notIn: data.classes }
            }
          });

          await tx.teacherClass.createMany({
            data: data.classes.map(classId => ({
              teacherId: profile.id,
              classId,
              status: Status.ACTIVE
            })),
            skipDuplicates: true
          });
        }

        return profile;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid teacher data",
          cause: error.errors
        });
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Teacher already exists with this user ID"
          });
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create/update teacher",
        cause: error
      });
    }
  }

  /**
   * Get teacher profile with all related data
   */
  async getTeacherProfile(teacherId: string) {
    try {
      const profile = await this.db.teacherProfile.findUnique({
        where: { id: teacherId },
        include: {
          user: true,
          campuses: {
            include: {
              campus: true
            }
          },
          subjects: {
            include: {
              subject: true
            }
          },
          classes: {
            include: {
              class: {
                include: {
                  classGroup: true
                }
              }
            }
          }
        }
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Teacher not found"
        });
      }

      return profile;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch teacher profile",
        cause: error
      });
    }
  }

  /**
   * Update teacher status across all assignments
   */
  async updateTeacherStatus(teacherId: string, newStatus: Status) {
    try {
      return await this.db.$transaction(async (tx) => {
        // Get teacher profile to get userId
        const profile = await tx.teacherProfile.findUnique({
          where: { id: teacherId },
          include: { user: true }
        });

        if (!profile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher not found"
          });
        }

        // Update user status
        await tx.user.update({
          where: { id: profile.userId },
          data: { status: newStatus }
        });

        // Update all campus assignments
        await tx.teacherCampus.updateMany({
          where: { teacherId },
          data: { status: newStatus }
        });

        // Update all subject assignments
        await tx.teacherSubject.updateMany({
          where: { teacherId },
          data: { status: newStatus }
        });

        // Update all class assignments
        await tx.teacherClass.updateMany({
          where: { teacherId },
          data: { status: newStatus }
        });

        return profile;
      });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher not found"
          });
        }
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update teacher status",
        cause: error
      });
    }
  }
} 