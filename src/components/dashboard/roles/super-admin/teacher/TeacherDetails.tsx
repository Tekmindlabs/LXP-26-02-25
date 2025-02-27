'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TeacherType, Status } from '@prisma/client';

interface TeacherDetailsProps {
  teacherId: string;
  role: string;
}

export default function TeacherDetails({ teacherId, role }: TeacherDetailsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: teacher, isLoading } = api.teacher.getById.useQuery(teacherId);
  const { data: teacherCampuses } = api.teacher.getTeacherCampuses.useQuery(
    { teacherId },
    { enabled: !!teacherId }
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!teacher) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Teacher not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Teacher Profile</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/${role}/teacher/${teacherId}/edit`)}
          >
            Edit Teacher
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/${role}/teacher`)}
          >
            Back to Teachers
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Name</label>
              <p>{teacher.name}</p>
            </div>
            <div>
              <label className="font-medium">Email</label>
              <p>{teacher.email}</p>
            </div>
            <div>
              <label className="font-medium">Phone Number</label>
              <p>{teacher.phoneNumber || 'Not provided'}</p>
            </div>
            <div>
              <label className="font-medium">Status</label>
              <Badge variant={teacher.status === Status.ACTIVE ? 'default' : 'secondary'}>
                {teacher.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teaching Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Teacher Type</label>
              <p>{teacher.teacherProfile?.teacherType || TeacherType.SUBJECT}</p>
            </div>
            <div>
              <label className="font-medium">Specialization</label>
              <p>{teacher.teacherProfile?.specialization || 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campus Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {teacherCampuses && teacherCampuses.length > 0 ? (
            <div className="space-y-4">
              {teacherCampuses.map((tc) => (
                <div key={tc.campusId} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{tc.campus.name}</p>
                    {tc.isPrimary && (
                      <Badge variant="outline" className="mt-1">
                        Primary Campus
                      </Badge>
                    )}
                  </div>
                  <Badge variant={tc.status === Status.ACTIVE ? 'default' : 'secondary'}>
                    {tc.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No campus assignments found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 