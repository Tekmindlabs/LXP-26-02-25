import { academicCalendarRouter } from "./routers/academic-calendar";
import { createTRPCRouter } from "./trpc";
import { activityRouter } from "./routers/activity";
import { curriculumRouter } from "./routers/curriculum";
import { classRouter } from "./routers/class";
import { classGroupRouter } from "./routers/class-group";
import { subjectRouter } from "./routers/subject";
import { campusRouter } from "./routers/campus";
import { programRouter } from "./routers/program";
import { calendarRouter } from "./routers/calendar";
import { studentRouter } from "./routers/student";
import { teacherRouter } from "./routers/teacher";
import { workspaceRouter } from "./routers/workspace";
import { campusRolePermissionRouter } from "./routers/campus-role-permission";
import { roleRouter } from "./routers/role";
import { coordinatorRouter } from "./routers/coordinator";
import { campusClassGroupRouter } from "./routers/campusClassGroup";
import { buildingRouter } from "./routers/building";
import { floorRouter } from "./routers/floor";
import { wingRouter } from "./routers/wing";
import { roomRouter } from "./routers/room";
import { academicYearRouter } from "./routers/academic-year";

export const appRouter = createTRPCRouter({
  academicCalendar: academicCalendarRouter,
  academicYear: academicYearRouter,
  campusRolePermission: campusRolePermissionRouter,
  role: roleRouter,
  activity: activityRouter,
  curriculum: curriculumRouter,
  class: classRouter,
  classGroup: classGroupRouter,
  subject: subjectRouter,
  campus: campusRouter,
  program: programRouter,
  calendar: calendarRouter,
  student: studentRouter,
  teacher: teacherRouter,
  workspace: workspaceRouter,
  coordinator: coordinatorRouter,
  campusClassGroup: campusClassGroupRouter,
  building: buildingRouter,
  floor: floorRouter,
  wing: wingRouter,
  room: roomRouter,
});

export type AppRouter = typeof appRouter;
