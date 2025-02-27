'use client';

import React from 'react';
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
	params: Promise<{
		id: string;
		role: string;
	}>;
}

export default function CampusPage({ params }: CampusPageProps) {
	// Unwrap params using React.use()
	const unwrappedParams = React.use(params);
	const { id, role } = unwrappedParams;
	
	const router = useRouter();
	const { data: metrics, isLoading } = api.campus.getMetrics.useQuery({ campusId: id });
	const { data: campusDetails } = api.campus.getAll.useQuery();
	const campus = campusDetails?.find(c => c.id === id);

	const content = isLoading ? (
		<div className="space-y-6">
			<Skeleton className="h-8 w-64" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[...Array(6)].map((_, i) => (
					<Skeleton key={i} className="h-32" />
				))}
			</div>
		</div>
	) : !campus || !metrics ? (
		<div>Campus not found</div>
	) : (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">{campus.name}</h2>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card className="cursor-pointer" onClick={() => router.push(`/dashboard/${role}/campus/${id}/programs`)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Programs</CardTitle>
						<GraduationCap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.programCount}</div>
						<p className="text-xs text-muted-foreground">Active academic programs</p>
					</CardContent>
				</Card>

				<Card className="cursor-pointer" onClick={() => router.push(`/dashboard/${role}/campus/${id}/class-groups`)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Class Groups</CardTitle>
						<School className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.classGroupCount}</div>
						<p className="text-xs text-muted-foreground">Active class groups</p>
					</CardContent>
				</Card>

				<Card className="cursor-pointer" onClick={() => router.push(`/dashboard/${role}/campus/${id}/classes`)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Classes</CardTitle>
						<BookOpen className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.classGroupCount}</div>
						<p className="text-xs text-muted-foreground">Active classes</p>
					</CardContent>
				</Card>

				<Card className="cursor-pointer" onClick={() => router.push(`/dashboard/${role}/campus/${id}/teachers`)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Teachers</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.teacherCount}</div>
						<p className="text-xs text-muted-foreground">Active teachers</p>
					</CardContent>
				</Card>

				<Card className="cursor-pointer" onClick={() => router.push(`/dashboard/${role}/campus/${id}/coordinators`)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Coordinators</CardTitle>
						<UserCog className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.teacherCount}</div>
						<p className="text-xs text-muted-foreground">Active coordinators</p>
					</CardContent>
				</Card>

				<Card className="cursor-pointer" onClick={() => router.push(`/dashboard/${role}/campus/${id}/students`)}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Students</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.studentCount}</div>
						<p className="text-xs text-muted-foreground">Active students</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);

	return (
		<DashboardContent role={role} campusId={id}>
			{content}
		</DashboardContent>
	);
}