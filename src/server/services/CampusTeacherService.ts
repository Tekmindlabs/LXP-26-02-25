import { PrismaClient, Status } from "@prisma/client";
import { CampusUserService } from "./CampusUserService";
import { CampusPermission } from "../../types/enums";
import { TRPCError } from "@trpc/server";

export interface TeacherCampusAssignment {
  id: string;
  teacherId: string;
  campusId: string;
  isPrimary: boolean;
  status: Status;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  campus?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

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
          campus: {
            select: {
              id: true,
              name: true
            }
          },
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
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
        campus: {
          select: {
            id: true,
            name: true
          }
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }
  
  async removeTeacherFromCampus(
    userId: string, 
    campusId: string, 
    teacherId: string
  ): Promise<{ success: boolean }> {
    // Permission check
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.MANAGE_CAMPUS_TEACHERS
    );
    
    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to remove teachers from this campus'
      });
    }
    
    // Check if assignment exists
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
        code: 'NOT_FOUND',
        message: 'Teacher is not assigned to this campus'
      });
    }
    
    // Delete the assignment
    await this.db.teacherCampus.delete({
      where: {
        id: existingAssignment.id
      }
    });
    
    return { success: true };
  }
  
  async getTeachersForCampus(
    userId: string, 
    campusId: string,
    includeInactive: boolean = false
  ) {
    // Permission check
    const hasPermission = await this.userService.hasPermission(
      userId,
      campusId,
      CampusPermission.VIEW_CAMPUS_CLASSES
    );
    
    if (!hasPermission) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view teachers for this campus'
      });
    }
    
    // Get teachers for campus
    const teachers = await this.db.user.findMany({
      where: {
        userType: 'TEACHER',
        teacherProfile: {
          campuses: {
            some: {
              campusId,
              ...(includeInactive ? {} : { status: 'ACTIVE' })
            }
          }
        }
      },
      include: {
        teacherProfile: {
          include: {
            subjects: {
              include: {
                subject: true
              }
            },
            classes: {
              include: {
                class: true
              }
            },
            campuses: {
              where: {
                campusId
              },
              include: {
                campus: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    return teachers;
  }
  
  async getCampusesForTeacher(
    userId: string, 
    teacherId: string,
    includeInactive: boolean = false
  ) {
    // Get teacher profile
    const teacherProfile = await this.db.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        user: true
      }
    });
    
    if (!teacherProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Teacher not found'
      });
    }
    
    // Check if user is the teacher or has permission to view
    const isTeacher = userId === teacherProfile.userId;
    
    if (!isTeacher) {
      // Get campuses where user has permission to view teachers
      const userCampuses = await this.db.campusRole.findMany({
        where: {
          userId,
          permissions: {
            has: CampusPermission.VIEW_CAMPUS_CLASSES
          }
        },
        select: {
          campusId: true
        }
      });
      
      if (userCampuses.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this teacher\'s campuses'
        });
      }
      
      // Get campuses for teacher that user has permission to view
      return this.db.campus.findMany({
        where: {
          id: {
            in: userCampuses.map(uc => uc.campusId)
          },
          teachers: {
            some: {
              teacherId,
              ...(includeInactive ? {} : { status: 'ACTIVE' })
            }
          }
        },
        include: {
          teachers: {
            where: {
              teacherId
            },
            include: {
              teacher: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    }
    
    // If user is the teacher, return all their campuses
    return this.db.campus.findMany({
      where: {
        teachers: {
          some: {
            teacherId,
            ...(includeInactive ? {} : { status: 'ACTIVE' })
          }
        }
      },
      include: {
        teachers: {
          where: {
            teacherId
          },
          include: {
            teacher: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  
  async updateTeacherCampusStatus(
    userId: string,
    campusId: string,
    teacherId: string,
    status: Status
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
        message: 'You do not have permission to update teacher status for this campus'
      });
    }
    
    // Check if assignment exists
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
        code: 'NOT_FOUND',
        message: 'Teacher is not assigned to this campus'
      });
    }
    
    // Update status
    return this.db.teacherCampus.update({
      where: {
        id: existingAssignment.id
      },
      data: {
        status
      },
      include: {
        campus: {
          select: {
            id: true,
            name: true
          }
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }
  
  async setPrimaryCampus(
    userId: string,
    teacherId: string,
    campusId: string
  ): Promise<TeacherCampusAssignment> {
    // Get teacher profile
    const teacherProfile = await this.db.teacherProfile.findUnique({
      where: { id: teacherId },
      include: {
        user: true
      }
    });
    
    if (!teacherProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Teacher not found'
      });
    }
    
    // Check if user is the teacher or has permission to manage
    const isTeacher = userId === teacherProfile.userId;
    
    if (!isTeacher) {
      // Check if user has permission to manage this teacher in this campus
      const hasPermission = await this.userService.hasPermission(
        userId,
        campusId,
        CampusPermission.MANAGE_CAMPUS_TEACHERS
      );
      
      if (!hasPermission) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to set primary campus for this teacher'
        });
      }
    }
    
    // Check if assignment exists
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
        code: 'NOT_FOUND',
        message: 'Teacher is not assigned to this campus'
      });
    }
    
    // Update all teacher's campus assignments to not primary
    await this.db.teacherCampus.updateMany({
      where: {
        teacherId
      },
      data: {
        isPrimary: false
      }
    });
    
    // Set the selected campus as primary
    return this.db.teacherCampus.update({
      where: {
        id: existingAssignment.id
      },
      data: {
        isPrimary: true
      },
      include: {
        campus: {
          select: {
            id: true,
            name: true
          }
        },
        teacher: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
  }
} 