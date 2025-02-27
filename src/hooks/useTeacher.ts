import { useState } from "react";
import { api } from "../utils/api";
import { Status, TeacherType } from "@prisma/client";
import { TRPCClientError } from "@trpc/client";

interface TeacherProfileData {
  userId: string;
  teacherType: TeacherType;
  specialization?: string;
}

interface TeacherAssignmentData {
  campusId: string;
  isPrimary?: boolean;
  status?: Status;
}

interface TeacherData {
  profile: TeacherProfileData;
  assignments?: TeacherAssignmentData[];
  subjects?: string[];
  classes?: string[];
}

interface UseTeacherOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useTeacher(options: UseTeacherOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const utils = api.useContext();

  const upsertTeacherMutation = api.teacher.upsertTeacher.useMutation({
    onSuccess: () => {
      options.onSuccess?.();
      utils.teacher.invalidate();
    },
    onError: (error) => {
      setError(error);
      options.onError?.(error);
    },
  });

  const updateTeacherStatusMutation = api.teacher.updateTeacherStatus.useMutation({
    onSuccess: () => {
      options.onSuccess?.();
      utils.teacher.invalidate();
    },
    onError: (error) => {
      setError(error);
      options.onError?.(error);
    },
  });

  const getTeacherProfile = api.teacher.getTeacherProfile.useQuery;

  const upsertTeacher = async (data: TeacherData) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await upsertTeacherMutation.mutateAsync(data);
      return result;
    } catch (err) {
      const error = err as TRPCClientError<any>;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeacherStatus = async (teacherId: string, status: Status) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await updateTeacherStatusMutation.mutateAsync({
        teacherId,
        status,
      });
      return result;
    } catch (err) {
      const error = err as TRPCClientError<any>;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    upsertTeacher,
    updateTeacherStatus,
    getTeacherProfile,
    isLoading,
    error,
  };
} 