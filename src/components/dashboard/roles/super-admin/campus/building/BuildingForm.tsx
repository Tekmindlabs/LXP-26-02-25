import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import { useToast } from "../../../../../../hooks/use-toast";
import type { Building } from "@prisma/client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildingSchema } from "@/types/validation/building";
import type { z } from "zod";

interface BuildingFormProps {
	isOpen: boolean;
	onClose: () => void;
	building?: Building | null;
	onSuccess: () => void;
	campusId: string;
}

type FormValues = z.infer<typeof buildingSchema>;

export const BuildingForm = ({
	isOpen,
	onClose,
	building,
	onSuccess,
	campusId,
}: BuildingFormProps) => {
	const { toast } = useToast();
	const form = useForm<FormValues>({
		resolver: zodResolver(buildingSchema),
		defaultValues: building || {
			name: "",
			code: "",
			campusId: campusId,
		},
	});

	const createMutation = api.building.create.useMutation({
		onSuccess: () => {
			toast({
				title: "Building created",
				description: "The building has been created successfully",
			});
			onSuccess();
			onClose();
		},
	});

	const updateMutation = api.building.update.useMutation({
		onSuccess: () => {
			toast({
				title: "Building updated",
				description: "The building has been updated successfully",
			});
			onSuccess();
			onClose();
		},
	});

	const onSubmit = async (values: FormValues) => {
		try {
			const dataWithCampusId = {
				...values,
				campusId: campusId,
			};

			if (building) {
				await updateMutation.mutateAsync({
					id: building.id,
					data: dataWithCampusId,
				});
			} else {
				await createMutation.mutateAsync(dataWithCampusId);
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to save building",
				variant: "destructive",
			});
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{building ? "Edit Building" : "Create Building"}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Code</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit">
								{building ? "Update" : "Create"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};