import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { CampusPermission } from "@/types/enums";
import { CampusRoleType } from "@/types/campus";
import { DefaultRoles } from "@/utils/permissions";
import { CampusUserService } from "@/server/services/CampusUserService";
import { CampusClassService } from "@/server/services/CampusClassService";
import type { Context } from "../trpc";
import { type PrismaClient, Prisma, type Status } from "@prisma/client";
import { CampusTeacherService } from "@/server/services/CampusTeacherService";

const campusCreateInput = z.object({ 
  name: z.string(),
  code: z.string(),
  establishmentDate: z.string().transform((str) => new Date(str)),
  type: z.enum(["MAIN", "BRANCH"]),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  primaryPhone: z.string(),
  email: z.string().email(),
  emergencyContact: z.string(),
  secondaryPhone: z.string().optional(),
  gpsCoordinates: z.string().optional(),
});

const campusUpdateInput = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  establishmentDate: z.string().transform((str) => new Date(str)),
  type: z.enum(["MAIN", "BRANCH"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
  primaryPhone: z.string(),
  email: z.string().email(),
  emergencyContact: z.string(),
  secondaryPhone: z.string().optional(),
  gpsCoordinates: z.string().optional(),
});

interface ProgramSubject {
  subject: {
    id: string;
    name: string;
  }
}

export const baseCampusRouter = createTRPCRouter({
  create: protectedProcedure
    .input(campusCreateInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Check for super-admin role directly from session token
      const isSuperAdmin = ctx.session.user.roles?.includes(DefaultRoles.SUPER_ADMIN);
      const hasManagePermission = ctx.session.user.permissions?.includes(CampusPermission.MANAGE_CAMPUS);

      if (!isSuperAdmin && !hasManagePermission) {
        console.log('Permission check failed:', {
          userRoles: ctx.session.user.roles,
          userPermissions: ctx.session.user.permissions,
          isSuperAdmin,
          hasManagePermission
        });
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create campuses',
        });
      }

      try {
        // Create the campus
        const campus = await ctx.prisma.campus.create({
          data: {
            name: input.name,
            code: input.code,
            establishmentDate: input.establishmentDate,
            type: input.type,
            status: 'ACTIVE', // Default status
            streetAddress: input.streetAddress,
            city: input.city,
            state: input.state,
            country: input.country,
            postalCode: input.postalCode,
            primaryPhone: input.primaryPhone,
            email: input.email,
            emergencyContact: input.emergencyContact,
            secondaryPhone: input.secondaryPhone,
            gpsCoordinates: input.gpsCoordinates,
          },
          include: {
            roles: true,
            buildings: true,
          },
        });

        // Create default campus role for the creator
        await ctx.prisma.campusRole.create({
          data: {
            userId: ctx.session.user.id,
            campusId: campus.id,
            roleId: CampusRoleType.CAMPUS_ADMIN,
          },
        });

        return campus;
      } catch (error) {
        console.error('Error creating campus:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create campus',
          cause: error,
        });
      }
    }),


  getAll: protectedProcedure
    .query(async ({ ctx }: { ctx: Context }) => {
      if (!ctx.session?.user?.id || !ctx.session?.user?.roles) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      console.log('Fetching campuses for user:', {
        userId: ctx.session.user.id,
        roles: ctx.session.user.roles
      });

      const isSuperAdmin = ctx.session.user.roles.includes(DefaultRoles.SUPER_ADMIN);
      console.log('User is super admin:', isSuperAdmin);

      if (isSuperAdmin) {
        const campuses = await ctx.prisma.campus.findMany({
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            roles: true,
            buildings: true,
          }
        });
        console.log('Found campuses:', campuses.length);
        return campuses;
      }

      const campuses = await ctx.prisma.campus.findMany({
        where: {
          roles: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          roles: true,
          buildings: true,
        }
      });
      console.log('Found campuses for regular user:', campuses.length);
      return campuses;
    }),

  getUserPermissions: protectedProcedure
    .query(async ({ ctx }: { ctx: Context }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const campusRole = await ctx.prisma.campusRole.findFirst({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          role: {
            include: {
              permissions: true
            }
          }
        }
      });

      if (!campusRole?.role?.permissions) {
        return [];
      }

      return campusRole.role.permissions.map((p: { permissionId: string }) => p.permissionId as CampusPermission);
    }),

  getMetrics: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [studentCount, teacherCount, programCount, classGroupCount] = await Promise.all([
        ctx.prisma.student.count({
          where: {
            class: {
              campusId: input.campusId,
            },
          },
        }),
        ctx.prisma.teacherProfile.count({
          where: {
            campuses: {
              some: {
                id: input.campusId,
              },
            },
          },
        }),
        ctx.prisma.program.count({
          where: {
            campuses: {
              some: {
                id: input.campusId,
              },
            },
          },
        }),
        ctx.prisma.classGroup.count({
          where: {
            campusClassGroups: {
              some: {
                campusId: input.campusId,
              },
            },
          },
        }),
      ]);

      return {
        studentCount,
        teacherCount,
        programCount,
        classGroupCount,
      };
    }),

  getPrograms: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ProgramWhereInput = {
        campuses: {
          some: {
            id: input.campusId,
          },
        },
        ...(input.status && { status: input.status }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
          ],
        }),
      };

      return ctx.prisma.program.findMany({
        where,
        orderBy: { name: "asc" },
      });
    }),

  getStudents: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.StudentWhereInput = {
        class: {
          campusId: input.campusId,
        },
        ...(input.status && { user: { status: input.status } }),
        ...(input.search && {
          OR: [
            { user: { name: { contains: input.search, mode: "insensitive" } } },
            { user: { email: { contains: input.search, mode: "insensitive" } } },
          ],
        }),
      };

      return ctx.prisma.student.findMany({
        where,
        include: {
          user: true,
          class: true,
        },
        orderBy: {
          user: {
            name: "asc",
          },
        },
      });
    }),

  getTeachers: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      search: z.string().optional(),
      includeInactive: z.boolean().optional()
    }))
    .query(async ({ ctx, input }) => {
      const campusTeacherService = new CampusTeacherService(
        ctx.prisma,
        new CampusUserService(ctx.prisma)
      );
      
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view teachers"
        });
      }
      
      const teachers = await campusTeacherService.getTeachersForCampus(
        ctx.session.user.id,
        input.campusId,
        input.includeInactive
      );
      
      // Apply search filter if provided
      if (input.search) {
        return teachers.filter((teacher: { name: string | null; email: string | null }) => 
          teacher.name?.toLowerCase().includes(input.search!.toLowerCase()) ||
          teacher.email?.toLowerCase().includes(input.search!.toLowerCase())
        );
      }
      
      return teachers;
    }),

  getBuildings: protectedProcedure
    .input(z.object({
      campusId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.building.findMany({
        where: {
          campusId: input.campusId
        },
        orderBy: {
          code: "asc"
        }
      });
    }),

  getRooms: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      buildingId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      if (!input.buildingId) return [];

      // First get all wings for this building
      const wings = await ctx.prisma.wing.findMany({
        where: {
          floor: {
            buildingId: input.buildingId
          }
        },
        select: { id: true }
      });

      const wingIds = wings.map(w => w.id);

      // Then get rooms for these wings
      return ctx.prisma.room.findMany({
        where: {
          wingId: {
            in: wingIds
          },
          status: "ACTIVE"
        },
        include: {
          wing: {
            include: {
              floor: true
            }
          }
        },
        orderBy: {
          number: "asc"
        }
      });
    }),

  getClasses: publicProcedure
    .input(z.object({ 
      campusId: z.string(),
      search: z.string().optional(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional()
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.class.findMany({
        where: {
          campusId: input.campusId,
          ...(input.status && { status: input.status }),
          ...(input.search && {
            name: { contains: input.search, mode: Prisma.QueryMode.insensitive }
          })
        },
        include: {
          classGroup: {
            include: {
              program: true
            }
          },
          teachers: {
            include: {
              teacher: {
                include: {
                  user: true
                }
              }
            }
          },
          _count: {
            select: {
              students: true,
              teachers: true
            }
          }
        },
        orderBy: { name: "asc" }
      });
    }),

  getClassGroups: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.ClassGroupWhereInput = {
        campusClassGroups: {
          some: {
            id: input.campusId,
          },
        },
        ...(input.status && { status: input.status }),
        ...(input.search && {
          name: { contains: input.search, mode: "insensitive" },
        }),
      };

      return ctx.prisma.classGroup.findMany({
        where,
        include: {
          classes: {
            include: {
              teachers: {
                include: {
                  teacher: {
                    include: {
                      user: true,
                      subjects: {
                        include: {
                          subject: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  createClass: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      classGroupId: z.string(),
      name: z.string(),
      buildingId: z.string().optional(),
      roomId: z.string().optional(),
      capacity: z.number(),
      code: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // First check if class with this name already exists in the class group
      const existingClass = await ctx.prisma.class.findFirst({
        where: {
          name: input.name,
          classGroupId: input.classGroupId
        }
      });

      if (existingClass) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A class with this name already exists in the selected class group'
        });
      }

      // Get the class group to inherit settings
      const classGroup = await ctx.prisma.classGroup.findUnique({
        where: { id: input.classGroupId },
        include: {
          program: true
        }
      });

      if (!classGroup) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class group not found'
        });
      }

      try {
        // Create the class
        const newClass = await ctx.prisma.class.create({
          data: {
            name: input.name,
            code: input.code,
            campusId: input.campusId,
            classGroupId: input.classGroupId,
            buildingId: input.buildingId,
            roomId: input.roomId,
            capacity: input.capacity,
            status: "ACTIVE"
          }
        });

        // Get program subjects
        const subjects = await ctx.prisma.subject.findMany({
          where: {
            OR: [
              {
                classGroups: {
                  some: {
                    id: classGroup.id
                  }
                }
              },
              {
                teachers: {
                  some: {
                    teacher: {
                      classes: {
                        some: {
                          class: {
                            classGroupId: classGroup.id
                          }
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        });

        // Create teacher assignments
        if (subjects.length > 0) {
          const activeTeachers = await ctx.prisma.teacherProfile.findMany({
            where: {
              campuses: {
                some: {
                  id: input.campusId,
                  status: "ACTIVE"
                }
              }
            },
            take: 1
          });

          if (activeTeachers.length > 0) {
            await Promise.all(subjects.map(subject => 
              ctx.prisma.teacherClass.create({
                data: {
                  classId: newClass.id,
                  teacherId: activeTeachers[0].id,
                  status: "ACTIVE"
                }
              })
            ));
          }
        }

        return ctx.prisma.class.findUnique({
          where: { id: newClass.id },
          include: {
            classGroup: {
              include: {
                program: true
              }
            },
            teachers: {
              include: {
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        });
      } catch (error) {
        // Handle any other database errors
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create class. Please try again.',
          cause: error
        });
      }
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }: { ctx: Context; input: string }) => {
      return ctx.prisma.campus.findUnique({
        where: { id: input },
        include: {
          roles: true,
          buildings: true,
        },
      });
    }),

  update: protectedProcedure
    .input(campusUpdateInput)
    .mutation(async ({ ctx, input }: { ctx: Context; input: z.infer<typeof campusUpdateInput> }) => {
      const { id, ...data } = input;
      return ctx.prisma.campus.update({
        where: { id },
        data,
        include: {
          roles: true,
          buildings: true,
        },
      });
    }),

  refreshClassGroups: protectedProcedure
    .input(z.object({
      campusId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      try {
        // Verify campus exists
        const campus = await ctx.prisma.campus.findUnique({
          where: { id: input.campusId }
        });

        if (!campus) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Campus not found',
          });
        }

        // Initialize services
        const campusUserService = new CampusUserService(ctx.prisma as PrismaClient);
        const campusClassService = new CampusClassService(
          ctx.prisma as PrismaClient, 
          campusUserService
        );

        // Check permissions
        const hasPermission = await campusUserService.hasPermission(
          ctx.session.user.id,
          input.campusId,
          CampusPermission.MANAGE_CAMPUS_CLASSES
        );

        const isSuperAdmin = ctx.session.user.roles?.includes(DefaultRoles.SUPER_ADMIN);

        if (!hasPermission && !isSuperAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to refresh class groups',
          });
        }

        // Execute within transaction
        await ctx.prisma.$transaction(async (prisma) => {
          const txCampusUserService = new CampusUserService(prisma as PrismaClient);
          const txCampusClassService = new CampusClassService(
            prisma as PrismaClient, 
            txCampusUserService
          );
        
          await txCampusClassService.inheritClassGroupsFromPrograms(
            ctx.session!.user.id,
            input.campusId
          );
        });

        return {
          success: true,
          message: 'Class groups refreshed successfully',
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Error refreshing class groups:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to refresh class groups',
          cause: error
        });
      }
    }),

  addProgram: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      programIds: z.array(z.string())
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const campus = await ctx.prisma.campus.findUnique({
        where: { id: input.campusId },
        include: {
          programs: true
        }
      });

      if (!campus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campus not found',
        });
      }

      // Get all programs at once
      const programs = await ctx.prisma.program.findMany({
        where: {
          id: {
            in: input.programIds
          }
        }
      });

      // Check if all programs exist
      if (programs.length !== input.programIds.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'One or more programs not found',
        });
      }

      // Filter out programs that are already associated
      const existingProgramIds = campus.programs.map(p => p.id);
      const newProgramIds = input.programIds.filter(id => !existingProgramIds.includes(id));

      if (newProgramIds.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'All programs are already associated with this campus',
        });
      }

      // Associate all new programs at once
      return ctx.prisma.campus.update({
        where: { id: input.campusId },
        data: {
          programs: {
            connect: newProgramIds.map(id => ({ id }))
          }
        },
        include: {
          programs: true
        }
      });
    }),

  getInheritedClassGroups: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }: { ctx: Context; input: { campusId: string } }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      const hasPermission = await ctx.prisma.campusRole.findFirst({
        where: {
          userId: ctx.session.user.id,
          campusId: input.campusId,
          role: {
            permissions: {
              some: {
                permissionId: CampusPermission.VIEW_CLASS_GROUPS
              }
            }
          }
        },
      });

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.prisma.classGroup.findMany({
        where: {
          campusClassGroups: {
            some: {
              campusId: input.campusId,
            },
          },
        },
      });
    }),

  // Add new teacher-campus management procedures
  assignTeacherToCampus: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      teacherId: z.string(),
      isPrimary: z.boolean().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const campusTeacherService = new CampusTeacherService(
        ctx.prisma,
        new CampusUserService(ctx.prisma)
      );
      
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to assign teachers to campus"
        });
      }
      
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
      
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to remove teachers from campus"
        });
      }
      
      return campusTeacherService.removeTeacherFromCampus(
        ctx.session.user.id,
        input.campusId,
        input.teacherId
      );
    }),

  updateTeacherCampusStatus: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      teacherId: z.string(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    }))
    .mutation(async ({ ctx, input }) => {
      const campusTeacherService = new CampusTeacherService(
        ctx.prisma,
        new CampusUserService(ctx.prisma)
      );
      
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to update teacher status"
        });
      }
      
      return campusTeacherService.updateTeacherCampusStatus(
        ctx.session.user.id,
        input.campusId,
        input.teacherId,
        input.status
      );
    }),

  setPrimaryCampus: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      campusId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const campusTeacherService = new CampusTeacherService(
        ctx.prisma,
        new CampusUserService(ctx.prisma)
      );
      
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to set primary campus"
        });
      }
      
      return campusTeacherService.setPrimaryCampus(
        ctx.session.user.id,
        input.teacherId,
        input.campusId
      );
    }),

  createClassFromTemplate: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      classGroupId: z.string(),
      name: z.string(),
      code: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Get class group
      const classGroup = await ctx.prisma.classGroup.findUnique({
        where: { id: input.classGroupId },
        include: {
          program: true
        }
      });

      if (!classGroup) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class group not found"
        });
      }

      // Create class
      const newClass = await ctx.prisma.class.create({
        data: {
          name: input.name,
          code: input.code,
          campusId: input.campusId,
          classGroupId: input.classGroupId,
          status: "ACTIVE"
        }
      });
      
      // Get program subjects
      const subjects = await ctx.prisma.subject.findMany({
        where: {
          OR: [
            {
              classGroups: {
                some: {
                  id: classGroup.id
                }
              }
            },
            {
              teachers: {
                some: {
                  teacher: {
                    classes: {
                      some: {
                        class: {
                          classGroupId: classGroup.id
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      });

      // Create teacher assignments
      if (subjects.length > 0) {
        const activeTeachers = await ctx.prisma.teacherProfile.findMany({
          where: {
            campuses: {
              some: {
                id: input.campusId,
                status: "ACTIVE"
              }
            }
          },
          take: 1
        });

        if (activeTeachers.length > 0) {
          await Promise.all(subjects.map(subject => 
            ctx.prisma.teacherClass.create({
              data: {
                classId: newClass.id,
                teacherId: activeTeachers[0].id,
                status: "ACTIVE"
              }
            })
          ));
        }
      }

      return newClass;
    }),

  // Add a new endpoint to get campuses for a teacher
  getTeacherCampuses: protectedProcedure
    .input(z.object({
      teacherId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session || !ctx.session.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view teacher campuses"
        });
      }
      
      const campusTeacherService = new CampusTeacherService(
        ctx.prisma,
        new CampusUserService(ctx.prisma)
      );
      
      return campusTeacherService.getCampusesForTeacher(
        ctx.session.user.id,
        input.teacherId
      );
    }),
});

export const campusViewRouter = createTRPCRouter({
  getInheritedPrograms: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }: { ctx: Context; input: { campusId: string } }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }
      const hasPermission = await ctx.prisma.campusRole.findFirst({
        where: {
          userId: ctx.session.user.id,
          campusId: input.campusId,
          role: {
            permissions: {
              some: {
                permissionId: CampusPermission.VIEW_PROGRAMS
              }
            }
          }
        },
      });

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.prisma.program.findMany({
        where: {
          campuses: {
            some: {
              id: input.campusId,
            },
          },
        },
      });
    }),

  getInheritedClassGroups: protectedProcedure
    .input(z.object({ campusId: z.string() }))
    .query(async ({ ctx, input }: { ctx: Context; input: { campusId: string } }) => {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }
      const hasPermission = await ctx.prisma.campusRole.findFirst({
        where: {
          userId: ctx.session.user.id,
          campusId: input.campusId,
          role: {
            permissions: {
              some: {
                permissionId: CampusPermission.VIEW_CLASS_GROUPS
              }
            }
          }
        },
      });

      if (!hasPermission) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.prisma.classGroup.findMany({
        where: {
          campusClassGroups: {
            some: {
              campusId: input.campusId,
            },
          },
        },
      });
    }),
});

// Create a combined router with all procedures
const combinedCampusRouter = createTRPCRouter({
  // Campus router procedures
  create: baseCampusRouter.create,
  getAll: baseCampusRouter.getAll,
  getUserPermissions: baseCampusRouter.getUserPermissions,
  getMetrics: baseCampusRouter.getMetrics,
  getPrograms: baseCampusRouter.getPrograms,
  getStudents: baseCampusRouter.getStudents,
  getTeachers: baseCampusRouter.getTeachers,
  getBuildings: baseCampusRouter.getBuildings,
  getRooms: baseCampusRouter.getRooms,
  getClasses: baseCampusRouter.getClasses,
  getClassGroups: baseCampusRouter.getClassGroups,
  createClass: baseCampusRouter.createClass,
  getById: baseCampusRouter.getById,
  update: baseCampusRouter.update,
  refreshClassGroups: baseCampusRouter.refreshClassGroups,
  addProgram: baseCampusRouter.addProgram,
  getInheritedClassGroups: baseCampusRouter.getInheritedClassGroups,
  assignTeacherToCampus: baseCampusRouter.assignTeacherToCampus,
  removeTeacherFromCampus: baseCampusRouter.removeTeacherFromCampus,
  updateTeacherCampusStatus: baseCampusRouter.updateTeacherCampusStatus,
  setPrimaryCampus: baseCampusRouter.setPrimaryCampus,
  createClassFromTemplate: baseCampusRouter.createClassFromTemplate,
  getTeacherCampuses: baseCampusRouter.getTeacherCampuses,
  
  // Campus view router procedures
  getInheritedPrograms: campusViewRouter.getInheritedPrograms,
  // getInheritedClassGroups is already in baseCampusRouter
});

// Export the combined router as the main campus router
export { combinedCampusRouter as campusRouter };
