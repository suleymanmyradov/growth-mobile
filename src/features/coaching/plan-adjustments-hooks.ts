/**
 * Plan adjustment suggestions hooks — React Query queries and mutations.
 *
 * `usePlanAdjustments` lists pending suggestions (used by the Today screen's
 * coach nudge). `useApplyPlanAdjustment` applies a suggestion (mutates the
 * underlying habit/goal server-side). `useDismissPlanAdjustment` marks a
 * suggestion `dismissed` without applying it. Both mutations invalidate the
 * pending list and the habit/goal caches so Today reflects the new state.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { goalKeys, habitKeys, planAdjustmentKeys } from '@/core/query/query-keys';

import {
  applyPlanAdjustment,
  listPendingPlanAdjustments,
  updatePlanAdjustmentStatus,
} from './plan-adjustments-api';

export function usePlanAdjustments() {
  return useQuery({
    queryKey: planAdjustmentKeys.pending(),
    queryFn: () => listPendingPlanAdjustments(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useApplyPlanAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applyPlanAdjustment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planAdjustmentKeys.all });
      // Applying a suggestion mutates the underlying habit/goal.
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}

export function useDismissPlanAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updatePlanAdjustmentStatus(id, { status: 'dismissed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planAdjustmentKeys.all });
    },
  });
}
