/**
 * Coaching profile hooks — React Query queries and mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { coachingProfileKeys } from '@/core/query/query-keys';
import type { UpdateCoachingProfilePreferencesRequest } from '@/core/api/schemas';

import { getCoachingProfile, updateCoachingProfilePreferences } from './api';

export function useCoachingProfile() {
  return useQuery({
    queryKey: coachingProfileKeys.get(),
    queryFn: () => getCoachingProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCoachingProfilePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCoachingProfilePreferencesRequest) =>
      updateCoachingProfilePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachingProfileKeys.all });
    },
  });
}
