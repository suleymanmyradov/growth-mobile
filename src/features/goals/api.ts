/**
 * Goals API — CRUD, toggle, progress.
 */
import { apiRequest } from '@/core/api/client';
import { goalEndpoints } from '@/core/api/endpoints';
import {
  CreateGoalRequestSchema,
  GoalResponseSchema,
  GoalsResponseSchema,
  UpdateGoalRequestSchema,
  type CreateGoalRequest,
  type Goal,
  type GoalResponse,
  type GoalsResponse,
  type UpdateGoalRequest,
} from '@/core/api/schemas';
import { z } from 'zod';

export type { CreateGoalRequest, Goal, GoalResponse, GoalsResponse, UpdateGoalRequest };

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
