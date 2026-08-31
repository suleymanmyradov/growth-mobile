/**
 * Plan adjustment suggestions API — list pending, apply, update status.
 *
 * The AI coach produces suggestions to adjust the user's plan (reduce
 * difficulty, change time, pause a habit, etc.). The Today screen surfaces the
 * first pending suggestion as a coach nudge; the user can apply it (mutates the
 * underlying habit/goal) or dismiss it.
 *
 * Backend contract: /personalization/plan-adjustments (see generated
 * api-types). The endpoint list, apply, and status paths live in
 * `personalizationEndpoints`.
 */
import { apiRequest } from '@/core/api/client';
import { personalizationEndpoints } from '@/core/api/endpoints';
import {
  PlanAdjustmentSuggestionResponseSchema,
  PlanAdjustmentSuggestionsResponseSchema,
  UpdatePlanAdjustmentSuggestionStatusRequestSchema,
  type PlanAdjustmentSuggestion,
  type PlanAdjustmentSuggestionResponse,
  type PlanAdjustmentSuggestionsResponse,
  type UpdatePlanAdjustmentSuggestionStatusRequest,
} from '@/core/api/schemas';

export type {
  PlanAdjustmentSuggestion,
  PlanAdjustmentSuggestionResponse,
  PlanAdjustmentSuggestionsResponse,
  UpdatePlanAdjustmentSuggestionStatusRequest,
};

/**
 * List pending plan adjustment suggestions for the signed-in user.
 * Ordered oldest-first by the backend.
 */
export async function listPendingPlanAdjustments(): Promise<PlanAdjustmentSuggestion[]> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: personalizationEndpoints.planAdjustments,
  });
  return PlanAdjustmentSuggestionsResponseSchema.parse(response).data;
}

/**
 * Apply a plan adjustment suggestion — the backend mutates the underlying
 * habit/goal according to the suggestion and marks the suggestion `applied`.
 */
export async function applyPlanAdjustment(id: string): Promise<PlanAdjustmentSuggestion> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: personalizationEndpoints.planAdjustmentApply(id),
  });
  return PlanAdjustmentSuggestionResponseSchema.parse(response).data;
}

/**
 * Update a suggestion's status (accept/dismiss). Used to dismiss a nudge
 * without applying it.
 */
export async function updatePlanAdjustmentStatus(
  id: string,
  data: UpdatePlanAdjustmentSuggestionStatusRequest,
): Promise<PlanAdjustmentSuggestion> {
  const validated = UpdatePlanAdjustmentSuggestionStatusRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: personalizationEndpoints.planAdjustmentStatus(id),
    data: validated,
  });
  return PlanAdjustmentSuggestionResponseSchema.parse(response).data;
}
