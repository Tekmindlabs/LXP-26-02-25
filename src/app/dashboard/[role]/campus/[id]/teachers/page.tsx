"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import CampusTeacherManagement from "@/components/dashboard/roles/super-admin/campus/CampusTeacherManagement";

export default function TeachersPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const campusId = params.id;
  const role = params.role;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Campus Teachers</h2>
        <Link href={`/dashboard/${role}/campus/${campusId}/teachers/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </Link>
      </div>

      <CampusTeacherManagement campusId={campusId} />
    </div>
  );
}