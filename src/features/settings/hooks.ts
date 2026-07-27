/**
 * Settings hooks — React Query queries and mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { settingsKeys } from '@/core/query/query-keys';
import type { UpdateSettingsRequest } from '@/core/api/schemas';

import { getSettings, updateSettings } from './api';

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.get(),
    queryFn: () => getSettings(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSettingsRequest) => updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
