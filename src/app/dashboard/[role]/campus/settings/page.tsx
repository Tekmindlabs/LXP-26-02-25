"use client";

import { useSearchParams } from "next/navigation";
import { CampusSettings } from "@/components/dashboard/roles/super-admin/campus/CampusSettings";

export default function CampusSettingsPage() {
  const searchParams = useSearchParams();
  const campusId = searchParams.get("campusId");

  if (!campusId) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-muted-foreground">
          No campus selected. Please select a campus to view its settings.
        </div>
      </div>
    );
  }

  return <CampusSettings campusId={campusId} />;
}
