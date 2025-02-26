'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Status } from '@prisma/client';
import { Progress } from '@/components/ui/progress';
import { Download, Upload } from 'lucide-react';

interface BulkStudentData {
	name: string;
	email: string;
	dateOfBirth: string;
	classId: string;
	campusIds: string[];
	primaryCampusId: string;
	status: Status;
}

export const BulkStudentUpload = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [selectedCampus, setSelectedCampus] = useState<string>('');
	const { toast } = useToast();

	const { data: campuses } = api.campus.getAll.useQuery();
	const { data: classes } = api.class.searchClasses.useQuery(
		{ campusId: selectedCampus },
		{ enabled: !!selectedCampus }
	);

	const bulkCreateMutation = api.student.bulkUpload.useMutation({
		onSuccess: () => {
			toast({
				title: 'Success',
				description: 'Students have been created successfully',
			});
			setIsOpen(false);
			setFile(null);
			setUploadProgress(0);
		},
		onError: (error: { message: string }) => {
			toast({
				title: 'Error',
				description: error.message,
				variant: 'destructive',
			});
		},
	});

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (selectedFile) {
			if (selectedFile.type !== 'text/csv') {
				toast({
					title: 'Invalid file type',
					description: 'Please upload a CSV file',
					variant: 'destructive',
				});
				return;
			}
			setFile(selectedFile);
		}
	};

	const processCSV = async (file: File): Promise<BulkStudentData[]> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = async (event) => {
				try {
					const text = event.target?.result as string;
					const rows = text.split('\n');
					const headers = rows[0].split(',');
					
					const students = rows.slice(1).map((row) => {
						const values = row.split(',');
						const student: BulkStudentData = {
							name: values[headers.indexOf('name')].trim(),
							email: values[headers.indexOf('email')].trim(),
							dateOfBirth: values[headers.indexOf('dateOfBirth')].trim(),
							classId: values[headers.indexOf('classId')].trim(),
							campusIds: [selectedCampus],
							primaryCampusId: selectedCampus,
							status: Status.ACTIVE,
						};
						return student;
					});

					resolve(students.filter(s => s.name && s.email));
				} catch (error) {
					reject(new Error('Error processing CSV file'));
				}
			};
			reader.onerror = () => reject(new Error('Error reading file'));
			reader.readAsText(file);
		});
	};

	const handleUpload = async () => {
		if (!file) return;

		try {
			const students = await processCSV(file);
			const chunkSize = 100;
			const chunks = [];

			for (let i = 0; i < students.length; i += chunkSize) {
				chunks.push(students.slice(i, i + chunkSize));
			}

			setUploadProgress(30);

			let processed = 0;
			for (const chunk of chunks) {
				// Create FormData for each chunk
				const formData = new FormData();
				formData.append('students', JSON.stringify(chunk));
				await bulkCreateMutation.mutateAsync(formData);
				processed += chunk.length;
				setUploadProgress(30 + (70 * processed) / students.length);
			}
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to process or upload file',
				variant: 'destructive',
			});
		}
	};

	const downloadTemplate = () => {
		const headers = ['name', 'email', 'dateOfBirth', 'classId'];
		const csvContent = [
			headers.join(','),
			'John Doe,john.doe@example.com,2000-01-01,class_id_here',
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'student_template.csv';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">Bulk Upload</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Bulk Student Upload</DialogTitle>
				</DialogHeader>

				<Card>
					<CardHeader>
						<CardTitle>Upload Students</CardTitle>
						<CardDescription>
							Upload a CSV file containing student information. Download the template below for the correct format.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>Select Campus</Label>
							<Select
								value={selectedCampus}
								onValueChange={setSelectedCampus}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a campus" />
								</SelectTrigger>
								<SelectContent>
									{campuses?.map((campus: { id: string; name: string }) => (
										<SelectItem key={campus.id} value={campus.id}>
											{campus.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="file">Upload CSV File</Label>
							<Input
								id="file"
								type="file"
								accept=".csv"
								onChange={handleFileChange}
								disabled={!selectedCampus}
							/>
						</div>

						{uploadProgress > 0 && (
							<Progress value={uploadProgress} className="w-full" />
						)}

						<div className="flex justify-between">
							<Button
								variant="outline"
								onClick={downloadTemplate}
								size="sm"
							>
								<Download className="mr-2 h-4 w-4" />
								Download Template
							</Button>

							<Button
								onClick={handleUpload}
								disabled={!file || !selectedCampus}
								size="sm"
							>
								<Upload className="mr-2 h-4 w-4" />
								Upload Students
							</Button>
						</div>

						<Alert>
							<AlertTitle>Note</AlertTitle>
							<AlertDescription>
								The CSV file should contain the following columns: name, email, dateOfBirth (YYYY-MM-DD), and classId.
								All students will be assigned to the selected campus.
							</AlertDescription>
						</Alert>
					</CardContent>
				</Card>
			</DialogContent>
		</Dialog>
	);
};