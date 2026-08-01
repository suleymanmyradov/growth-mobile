/**
 * Settings hooks — React Query queries and mutations.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { SettingsResponse, UpdateSettingsRequest } from '@/core/api/schemas';
import { settingsKeys } from '@/core/query/query-keys';

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
    onMutate: async (data: UpdateSettingsRequest) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.get() });
      const previous = queryClient.getQueryData<SettingsResponse>(settingsKeys.get());
      queryClient.setQueryData<SettingsResponse | undefined>(settingsKeys.get(), (old) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, ...data } };
      });
      return { previous };
    },
    onError: (_error, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(settingsKeys.get(), context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
