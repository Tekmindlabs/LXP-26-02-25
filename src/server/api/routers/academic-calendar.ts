import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { EventType, Status, CalendarType } from "@prisma/client";

export const academicCalendarRouter = createTRPCRouter({
	// Calendar Operations
	createCalendar: protectedProcedure
		.input(z.object({
			name: z.string(),
			description: z.string().optional(),
			startDate: z.date(),
			endDate: z.date(),
			type: z.enum([CalendarType.PRIMARY, CalendarType.SECONDARY, CalendarType.EXAM, CalendarType.ACTIVITY]).default(CalendarType.PRIMARY),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
			isDefault: z.boolean().default(false),
			visibility: z.enum(['ALL', 'STAFF', 'STUDENTS', 'PARENTS']).default('ALL'),
			metadata: z.any().optional(),
			academicYearId: z.string().optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			try {
				// Extract academicYearId from input or get the latest one
				let { academicYearId, ...restInput } = input;
				
				// If academicYearId is not provided, get the latest academic year
				if (!academicYearId) {
					const latestAcademicYear = await ctx.prisma.academicYear.findFirst({
						orderBy: { startDate: 'desc' },
					});
					
					// If no academic year exists, create one
					if (!latestAcademicYear) {
						const currentYear = new Date().getFullYear();
						const nextYear = currentYear + 1;
						
						const newAcademicYear = await ctx.prisma.academicYear.create({
							data: {
								name: `${currentYear}-${nextYear}`,
								startDate: new Date(currentYear, 7, 1), // August 1st of current year
								endDate: new Date(nextYear, 4, 31),     // May 31st of next year
								status: Status.ACTIVE,
							},
						});
						
						academicYearId = newAcademicYear.id;
					} else {
						academicYearId = latestAcademicYear.id;
					}
				}
				
				// Create the calendar with the academicYear connection
				return ctx.prisma.calendar.create({
					data: {
						...restInput,
						status: input.status || Status.ACTIVE,
						academicYear: {
							connect: { id: academicYearId }
						}
					},
					include: {
						events: true,
						academicYear: true
					},
				});
			} catch (error) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create calendar',
					cause: error,
				});
			}
		}),

	getAllCalendars: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.prisma.calendar.findMany({
				include: {
					events: true,
				},
			});
		}),

	getCalendarById: protectedProcedure
		.input(z.object({
			id: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			return ctx.prisma.calendar.findUnique({
				where: { id: input.id },
				include: {
					events: true,
				},
			});
		}),

	updateCalendar: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			description: z.string().optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			type: z.enum([CalendarType.PRIMARY, CalendarType.SECONDARY, CalendarType.EXAM, CalendarType.ACTIVITY]).optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
			visibility: z.enum(['ALL', 'STAFF', 'STUDENTS', 'PARENTS']).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.calendar.update({
				where: { id },
				data,
				include: {
					events: true,
				},
			});
		}),

	// Event Operations
	createEvent: protectedProcedure
		.input(z.object({
			title: z.string(),
			description: z.string().optional(),
			eventType: z.enum([EventType.ACADEMIC, EventType.HOLIDAY, EventType.EXAM, EventType.ACTIVITY, EventType.OTHER]),
			startDate: z.date(),
			endDate: z.date(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
			calendarId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const { calendarId, ...eventData } = input;
			return ctx.prisma.event.upsert({
				where: {
					title_calendarId_eventType: {
						title: eventData.title,
						calendarId: calendarId,
						eventType: eventData.eventType
					}
				},
				update: {
					...eventData,
					calendar: {
						connect: { id: calendarId }
					}
				},
				create: {
					...eventData,
					calendar: {
						connect: { id: calendarId }
					}
				},
				include: {
					calendar: true
				}
			});
		}),

	updateEvent: protectedProcedure
		.input(z.object({
			id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			eventType: z.enum([EventType.ACADEMIC, EventType.HOLIDAY, EventType.EXAM, EventType.ACTIVITY, EventType.OTHER]).optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.event.update({
				where: { id },
				data,
			});
		}),

	deleteEvent: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.event.delete({
				where: { id: input },
			});
		}),

	getEvent: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.event.findUnique({
				where: { id: input },
			});
		}),

	getEventsByDateRange: protectedProcedure
		.input(z.object({
			eventType: z.enum([EventType.ACADEMIC, EventType.HOLIDAY, EventType.EXAM, EventType.ACTIVITY, EventType.OTHER]).optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			calendarId: z.string()
		}))
		.query(async ({ ctx, input }) => {
			const { eventType, startDate, endDate, calendarId } = input;
			
			return ctx.prisma.event.findMany({
				where: {
					...(eventType && { eventType }),
					...(startDate && { startDate: { gte: startDate } }),
					...(endDate && { endDate: { lte: endDate } }),
					calendarId,
					status: Status.ACTIVE,
				},
				orderBy: {
					startDate: 'asc',
				},
				include: {
					calendar: true
				}
			});
		}),
});
