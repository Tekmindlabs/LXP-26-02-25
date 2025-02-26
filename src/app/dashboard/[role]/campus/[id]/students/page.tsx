"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StudentsPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const campusId = params.id;

  return (
    <div className="space-y-6">      
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campus Students</h2>
        <Link href={`/dashboard/${params.role}/campus/${campusId}/students/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Parent Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Student data will be mapped here */}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
