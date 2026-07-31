/**
 * Templates API — habit and goal templates.
 *
 * Templates are curated starter definitions. The Library Templates segment
 * surfaces them; selecting a template routes to the native habit/goal creation
 * flow pre-filled with the template's fields.
 */
import { apiRequest } from '@/core/api/client';
import { templateEndpoints } from '@/core/api/endpoints';
import {
  GoalTemplatesResponseSchema,
  HabitTemplatesResponseSchema,
  type GoalTemplateItem,
  type GoalTemplatesResponse,
  type HabitTemplateItem,
  type HabitTemplatesResponse,
} from '@/core/api/schemas';

export type { GoalTemplateItem, GoalTemplatesResponse, HabitTemplateItem, HabitTemplatesResponse };

export async function listHabitTemplates(): Promise<HabitTemplatesResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: templateEndpoints.habitTemplates,
  });
  return HabitTemplatesResponseSchema.parse(response);
}

export async function listGoalTemplates(): Promise<GoalTemplatesResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: templateEndpoints.goalTemplates,
  });
  return GoalTemplatesResponseSchema.parse(response);
}
