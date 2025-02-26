"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeachersPage({
  params,
}: {
  params: { id: string; role: string };
}) {
  const router = useRouter();
  const campusId = params.id;
  const role = params.role;

  useEffect(() => {
    router.replace(`/dashboard/${role}/campus/${campusId}`);
  }, [router, role, campusId]);

  return null; // No need to render anything as we're redirecting
}