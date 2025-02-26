import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const campusClassGroupRouter = createTRPCRouter({
  getForCampus: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: campusId }) => {
      return ctx.prisma.campusClassGroup.findMany({
        where: {
          campusId,
          status: Status.ACTIVE
        },
        include: {
          classGroup: {
            include: {
              program: true
            }
          }
        }
      });
    }),

  validateInheritance: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      classGroupId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const campusClassGroup = await ctx.prisma.campusClassGroup.findUnique({
        where: {
          campusId_classGroupId: {
            campusId: input.campusId,
            classGroupId: input.classGroupId
          }
        }
      });

      if (!campusClassGroup) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected class group is not available for this campus'
        });
      }

      return campusClassGroup;
    })
});
