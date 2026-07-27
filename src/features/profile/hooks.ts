/**
 * Profile hooks — React Query queries and mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileKeys } from '@/core/query/query-keys';
import type { UpdateProfileRequest } from '@/core/api/schemas';

import { deleteProfile, getProfile, updateProfile } from './api';

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
