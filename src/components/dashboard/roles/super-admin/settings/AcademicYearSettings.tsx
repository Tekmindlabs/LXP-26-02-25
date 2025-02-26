"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Status, CalendarType } from "@prisma/client";
import { TermSettings } from "./TermSettings";

type CalendarFormState = {
	name: string;
	description: string;
	type: CalendarType;
};

export const AcademicYearSettings = () => {
	const [settings, setSettings] = useState({
		startMonth: 1,
		startDay: 1,
		endMonth: 12,
		endDay: 31,
	});

	const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
	const [calendar, setCalendar] = useState<CalendarFormState>({
		name: "",
		description: "",
		type: CalendarType.PRIMARY,
	});

	const { toast } = useToast();
	const utils = api.useContext();

	const { data: academicYears, isLoading } = api.academicYear.getAll.useQuery();
	const { data: calendars } = api.academicCalendar.getAllCalendars.useQuery();
	const updateSettings = api.academicYear.updateSettings.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Academic year settings updated successfully",
			});
			utils.academicYear.getSettings.invalidate();
		},
	});

	const createCalendar = api.academicCalendar.createCalendar.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Calendar created successfully",
			});
			setIsCalendarDialogOpen(false);
			utils.academicCalendar.getAllCalendars.invalidate();
		},
	});

	const months = Array.from({ length: 12 }, (_, i) => ({
		value: i + 1,
		label: new Date(0, i).toLocaleString('default', { month: 'long' })
	}));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateSettings.mutate(settings);
	};

	const handleCalendarSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		const currentYear = new Date().getFullYear();
		createCalendar.mutate({
			...calendar,
			...(academicYears?.[0]?.id && { academicYearId: academicYears[0].id }),
			startDate: new Date(currentYear, settings.startMonth - 1, settings.startDay),
			endDate: new Date(currentYear + 1, settings.endMonth - 1, settings.endDay),
			status: Status.ACTIVE,
		});
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Academic Year Configuration</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-4">
								<h3 className="font-medium">Academic Year Start</h3>
								<div className="space-y-2">
									<Label>Month</Label>
									<Select
										value={settings.startMonth.toString()}
										onValueChange={(value) =>
											setSettings({ ...settings, startMonth: parseInt(value) })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{months.map((month) => (
												<SelectItem key={month.value} value={month.value.toString()}>
													{month.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Day</Label>
									<Input
										type="number"
										min={1}
										max={31}
										value={settings.startDay}
										onChange={(e) =>
											setSettings({ ...settings, startDay: parseInt(e.target.value) })
										}
									/>
								</div>
							</div>
							<div className="space-y-4">
								<h3 className="font-medium">Academic Year End</h3>
								<div className="space-y-2">
									<Label>Month</Label>
									<Select
										value={settings.endMonth.toString()}
										onValueChange={(value) =>
											setSettings({ ...settings, endMonth: parseInt(value) })
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{months.map((month) => (
												<SelectItem key={month.value} value={month.value.toString()}>
													{month.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Day</Label>
									<Input
										type="number"
										min={1}
										max={31}
										value={settings.endDay}
										onChange={(e) =>
											setSettings({ ...settings, endDay: parseInt(e.target.value) })
										}
									/>
								</div>
							</div>
						</div>
						<Button type="submit" disabled={updateSettings.isPending}>
							{updateSettings.isPending ? "Saving..." : "Save Settings"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Calendar Management</CardTitle>
					<Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen}>
						<DialogTrigger asChild>
							<Button>Add Calendar</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create New Calendar</DialogTitle>
							</DialogHeader>
							<form onSubmit={handleCalendarSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label>Name</Label>
									<Input
										value={calendar.name}
										onChange={(e) => setCalendar({ ...calendar, name: e.target.value })}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label>Description</Label>
									<Input
										value={calendar.description}
										onChange={(e) => setCalendar({ ...calendar, description: e.target.value })}
									/>
								</div>
								<Button type="submit" disabled={createCalendar.isPending}>
									{createCalendar.isPending ? "Creating..." : "Create Calendar"}
								</Button>
							</form>
						</DialogContent>
					</Dialog>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{calendars?.map((calendar) => (
							<Card key={calendar.id} className="p-4">
								<div className="flex flex-col space-y-2">
									<h3 className="font-semibold">{calendar.name}</h3>
									<p className="text-sm text-gray-500">{calendar.description}</p>
								</div>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};