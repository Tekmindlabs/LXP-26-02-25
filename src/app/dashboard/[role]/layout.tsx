import { redirect } from "next/dist/client/components/navigation";
import { getServerAuthSession } from "@/server/auth";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import SuperAdminSidebar from "@/components/dashboard/roles/super-admin/layout/SuperAdminSidebar";

interface LayoutProps {
	children: React.ReactNode;
	params: {
		role: string;
	};
}

const superAdminNavItems = [
	{
		title: "Overview",
		href: "/dashboard/[role]",
	},
	{
		title: "Academic Calendar",
		href: "/dashboard/[role]/academic-calendar",
	},
	{
		title: "Programs",
		href: "/dashboard/[role]/program",
	},
	{
		title: "Class Groups",
		href: "/dashboard/[role]/class-group",
	},
	{
		title: "Classes",
		href: "/dashboard/[role]/class",
	},
	{
		title: "Teachers",
		href: "/dashboard/[role]/teacher",
	},
	{
		title: "Students",
		href: "/dashboard/[role]/student",
	},
	{
		title: "Subjects",
		href: "/dashboard/[role]/subject",
	},
	{
		title: "Timetables",
		href: "/dashboard/[role]/timetable",
	},
	{
		title: "Classrooms",
		href: "/dashboard/[role]/classroom",
	},
	{
		title: "Users",
		href: "/dashboard/[role]/users",
	},
	{
		title: "Class Activities",
		href: "/dashboard/[role]/class-activity",
	},
	{
		title: "Attendance Management",
		href: "/dashboard/[role]/attendance",
	},
	{
		title: "Messaging",
		href: "/dashboard/[role]/messaging",
	},
	{
		title: "Notifications",
		href: "/dashboard/[role]/notification",
	},
	{
		title: "Settings",
		href: "/dashboard/[role]/settings",
	},
	{
		title: "Knowledge Base",
		href: "/dashboard/[role]/knowledge-base",
	},
];

const coordinatorNavItems = [
	{
		title: "Overview",
		href: "/dashboard/[role]",
	},
	{
		title: "Academic Calendar",
		href: "/dashboard/[role]/academic-calendar",
	},
	{
		title: "Programs",
		href: "/dashboard/[role]/program",
	},
	{
		title: "Class Groups",
		href: "/dashboard/[role]/class",
	},
	{
		title: "Teachers",
		href: "/dashboard/[role]/teacher",
	},
	{
		title: "Students",
		href: "/dashboard/[role]/student",
	},
	{
		title: "Activities",
		href: "/dashboard/[role]/class-activity",
	},
	{
		title: "Timetables",
		href: "/dashboard/[role]/timetable",
	},
	{
		title: "Messaging",
		href: "/dashboard/[role]/messaging",
	},
	{
		title: "Notifications",
		href: "/dashboard/[role]/notification",
	},
	{
		title: "Knowledge Base",
		href: "/dashboard/[role]/knowledge-base",
	},
];

const teacherNavItems = [
	{
		title: "Overview",
		href: "/dashboard/[role]",
	},
	{
		title: "Academic Calendar",
		href: "/dashboard/[role]/academic-calendar",
	},
	{
		title: "Classes",
		href: "/dashboard/[role]/class",
	},
	{
		title: "Students",
		href: "/dashboard/[role]/student",
	},
	{
		title: "Activities",
		href: "/dashboard/[role]/class-activity",
	},
	{
		title: "Messaging",
		href: "/dashboard/[role]/messaging",
	},
	{
		title: "Notifications",
		href: "/dashboard/[role]/notification",
	},
	{
		title: "Knowledge Base",
		href: "/dashboard/[role]/knowledge-base",
	},
];

const studentNavItems = [
	{
		title: "Overview",
		href: "/dashboard/[role]",
	},
	{
		title: "Activities",
		href: "/dashboard/[role]/class-activity",
	},
	{
		title: "Knowledge Base",
		href: "/dashboard/[role]/knowledge-base",
	},
];

export default async function Layout({
	children,
	params,
}: LayoutProps) {
	const session = await getServerAuthSession();
	const role = params.role;

	if (!session) {
		redirect("/auth/signin");
	}

	const userRoles = session?.user?.roles?.map((r) => r.toLowerCase()) ?? [];
	const currentRole = role.toLowerCase();

	if (!currentRole || !userRoles.includes(currentRole)) {
		redirect(`/dashboard/${userRoles[0]?.toLowerCase() ?? ''}`);
	}

	const getNavItems = (role: string) => {
		switch (role) {
			case 'super-admin':
				return superAdminNavItems;
			case 'coordinator':
				return coordinatorNavItems;
			case 'teacher':
				return teacherNavItems;
			case 'student':
				return studentNavItems;
			default:
				return [];
		}
	};

	const navItems = getNavItems(currentRole).map((item) => ({
		...item,
		href: item.href.replace('[role]', currentRole),
	}));

	return (
		<div className="flex min-h-screen flex-col space-y-6">
			<aside className="fixed inset-y-0 left-0 w-[200px] border-r">
				<div className="flex h-full flex-col">
					<SidebarNav items={navItems} />
				</div>
			</aside>
			<div className="pl-[200px]">
				<div className="p-8">{children}</div>
			</div>
		</div>
	);
}
