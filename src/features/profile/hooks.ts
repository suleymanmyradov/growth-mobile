/**
 * Profile hooks — React Query queries and mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UpdateProfileRequest } from '@/core/api/schemas';
import { profileKeys } from '@/core/query/query-keys';

import { deleteProfile, exportData, getProfile, updateProfile, uploadAvatar } from './api';

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => getProfile(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteProfile(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * Upload an avatar image. Returns the upload response (url + key).
 * The caller is responsible for calling `useUpdateProfile` with the new
 * `avatarUrl` to persist it to the profile.
 */
export function useUploadAvatar() {
  return useMutation({
    mutationFn: ({ fileUri, mimeType }: { fileUri: string; mimeType: string }) =>
      uploadAvatar(fileUri, mimeType),
  });
}

/**
 * Request a data export. Returns a presigned download URL.
 */
export function useExportData() {
  return useMutation({
    mutationFn: () => exportData(),
  });
}
