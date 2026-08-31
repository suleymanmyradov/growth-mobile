/**
 * Goals API — CRUD, toggle, progress, log value, milestones.
 */
import { apiRequest } from '@/core/api/client';
import { goalEndpoints } from '@/core/api/endpoints';
import {
  CreateGoalRequestSchema,
  CreateMilestoneRequestSchema,
  GoalResponseSchema,
  GoalsResponseSchema,
  LogGoalValueRequestSchema,
  UpdateGoalRequestSchema,
  type CreateGoalRequest,
  type CreateMilestoneRequest,
  type Goal,
  type GoalResponse,
  type GoalsResponse,
  type UpdateGoalRequest,
} from '@/core/api/schemas';
import { z } from 'zod';

export type {
  CreateGoalRequest,
  CreateMilestoneRequest,
  Goal,
  GoalResponse,
  GoalsResponse,
  UpdateGoalRequest,
};

const UpdateGoalProgressRequestSchema = z.object({
  progress: z.number().min(0).max(100),
});

export async function listGoals(): Promise<GoalsResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: goalEndpoints.list,
    params: { page: 1, limit: 100 },
  });
  return GoalsResponseSchema.parse(response);
}

export async function getGoal(id: string): Promise<GoalResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: goalEndpoints.detail(encodeURIComponent(id)),
  });
  return GoalResponseSchema.parse(response);
}

export async function createGoal(data: CreateGoalRequest): Promise<GoalResponse> {
  const validated = CreateGoalRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: goalEndpoints.list,
    data: validated,
  });
  return GoalResponseSchema.parse(response);
}

export async function updateGoal(id: string, data: UpdateGoalRequest): Promise<GoalResponse> {
  const validated = UpdateGoalRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: goalEndpoints.detail(encodeURIComponent(id)),
    data: validated,
  });
  return GoalResponseSchema.parse(response);
}

export async function deleteGoal(id: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'DELETE',
    url: goalEndpoints.detail(encodeURIComponent(id)),
  });
}

export async function toggleGoal(id: string): Promise<GoalResponse> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: goalEndpoints.toggle(encodeURIComponent(id)),
  });
  return GoalResponseSchema.parse(response);
}

export async function updateGoalProgress(id: string, progress: number): Promise<GoalResponse> {
  const validated = UpdateGoalProgressRequestSchema.parse({ progress });
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: goalEndpoints.progress(encodeURIComponent(id)),
    data: validated,
  });
  return GoalResponseSchema.parse(response);
}

/**
 * Log a new current value for a numeric goal (recomputes progress server-side).
 * Backend: PUT /goals/:id/value → GoalResponse
 */
export async function logGoalValue(id: string, value: number): Promise<GoalResponse> {
  const validated = LogGoalValueRequestSchema.parse({ value });
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: goalEndpoints.value(encodeURIComponent(id)),
    data: validated,
  });
  return GoalResponseSchema.parse(response);
}

/**
 * Create a milestone step for a milestone-type goal.
 * Backend: POST /goals/:id/milestones → GoalResponse
 */
export async function createMilestone(
  id: string,
  title: string,
  sortOrder?: number,
): Promise<GoalResponse> {
  const validated = CreateMilestoneRequestSchema.parse({ title, sortOrder });
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: goalEndpoints.milestones(encodeURIComponent(id)),
    data: validated,
  });
  return GoalResponseSchema.parse(response);
}

/**
 * Toggle a milestone's done/not-done state (recomputes goal progress).
 * Backend: POST /goals/:id/milestones/:milestoneId/toggle → GoalResponse
 */
export async function toggleMilestone(id: string, milestoneId: string): Promise<GoalResponse> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: goalEndpoints.milestoneToggle(encodeURIComponent(id), encodeURIComponent(milestoneId)),
  });
  return GoalResponseSchema.parse(response);
}

/**
 * Delete a milestone step (recomputes goal progress).
 * Backend: DELETE /goals/:id/milestones/:milestoneId → { success: bool }
 */
export async function deleteMilestone(id: string, milestoneId: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'DELETE',
    url: goalEndpoints.milestone(encodeURIComponent(id), encodeURIComponent(milestoneId)),
  });
}
