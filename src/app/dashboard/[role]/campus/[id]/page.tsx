'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Users,
	GraduationCap,
	BookOpen,
	School,
	UserCog,
	Building2
} from 'lucide-react';

interface CampusPageProps {
	params: {
		id: string;
		role: string;
	};
}

export default function CampusPage({ params }: CampusPageProps) {
	const router = useRouter();
	const { data: campus, isLoading } = api.campus.get.useQuery({ id: params.id });

	if (isLoading) {
		return (
			<DashboardContent role={params.role} campusId={params.id}>
				<div className="space-y-6">
					<Skeleton className="h-8 w-64" />
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<Skeleton key={i} className="h-40" />
						))}
					</div>
				</div>
			</DashboardContent>
		);
	}

	if (!campus) {
		return (
			<DashboardContent role={params.role} campusId={params.id}>
				<div>Campus not found</div>
			</DashboardContent>
		);
	}

	const sections = [
		{
			title: 'Programs',
			description: 'Manage academic programs',
			icon: School,
			href: `programs`,
			count: campus.programCount || 0,
		},
		{
			title: 'Class Groups',
			description: 'Manage class groups',
			icon: Building2,
			href: `class-groups`,
			count: campus.classGroupCount || 0,
		},
		{
			title: 'Classes',
			description: 'Manage classes and subjects',
			icon: BookOpen,
			href: `classes`,
			count: campus.classCount || 0,
		},
		{
			title: 'Teachers',
			description: 'Manage teaching staff',
			icon: Users,
			href: `teachers`,
			count: campus.teacherCount || 0,
		},
		{
			title: 'Students',
			description: 'Manage student enrollment',
			icon: GraduationCap,
			href: `students`,
			count: campus.studentCount || 0,
		},
		{
			title: 'Coordinators',
			description: 'Manage program coordinators',
			icon: UserCog,
			href: `coordinators`,
			count: campus.coordinatorCount || 0,
		},
	];

	return (
		<DashboardContent role={params.role} campusId={params.id}>
			<div className="space-y-6">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">{campus.name}</h2>
					<p className="text-muted-foreground">{campus.address}</p>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{sections.map((section) => (
						<Card
							key={section.href}
							className="cursor-pointer hover:bg-accent/50 transition-colors"
							onClick={() => router.push(`/dashboard/${params.role}/campus/${params.id}/${section.href}`)}
						>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									{section.title}
								</CardTitle>
								<section.icon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{section.count}</div>
								<p className="text-xs text-muted-foreground">
									{section.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</DashboardContent>
	);
}