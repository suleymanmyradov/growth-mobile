/**
 * Habits API — CRUD, reset-today.
 */
import { apiRequest } from '@/core/api/client';
import { habitEndpoints } from '@/core/api/endpoints';
import {
  CreateHabitRequestSchema,
  HabitResponseSchema,
  HabitsResponseSchema,
  UpdateHabitRequestSchema,
  type CreateHabitRequest,
  type Habit,
  type HabitResponse,
  type HabitsResponse,
  type UpdateHabitRequest,
} from '@/core/api/schemas';

export type { Habit, CreateHabitRequest, UpdateHabitRequest, HabitsResponse, HabitResponse };

/**
 * Lists all habits, paginating under the hood so >100 habits are not silently
 * truncated (the API caps `limit` at 100).
 */
async function listAllHabits(): Promise<HabitsResponse> {
  const limit = 100;
  const first = await apiRequest<unknown>({
    method: 'GET',
    url: habitEndpoints.list,
    params: { page: 1, limit },
  });
  const firstParsed = HabitsResponseSchema.parse(first);
  if (firstParsed.data.length >= firstParsed.page.total) return firstParsed;

  const all: Habit[] = [...firstParsed.data];
  const totalPages = firstParsed.page.totalPages;
  for (let page = 2; page <= totalPages; page++) {
    const res = await apiRequest<unknown>({
      method: 'GET',
      url: habitEndpoints.list,
      params: { page, limit },
    });
    const parsed = HabitsResponseSchema.parse(res);
    all.push(...parsed.data);
    if (all.length >= firstParsed.page.total) break;
  }
  return { data: all, page: firstParsed.page };
}

export async function listHabits(): Promise<HabitsResponse> {
  return listAllHabits();
}

export async function getHabit(id: string): Promise<HabitResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: habitEndpoints.detail(encodeURIComponent(id)),
  });
  return HabitResponseSchema.parse(response);
}

export async function createHabit(data: CreateHabitRequest): Promise<HabitResponse> {
  const validated = CreateHabitRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: habitEndpoints.list,
    data: validated,
  });
  return HabitResponseSchema.parse(response);
}

export async function updateHabit(id: string, data: UpdateHabitRequest): Promise<HabitResponse> {
  const validated = UpdateHabitRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: habitEndpoints.detail(encodeURIComponent(id)),
    data: validated,
  });
  return HabitResponseSchema.parse(response);
}

export async function deleteHabit(id: string): Promise<void> {
  await apiRequest<unknown>({
    method: 'DELETE',
    url: habitEndpoints.detail(encodeURIComponent(id)),
  });
}

export async function resetTodayHabits(): Promise<void> {
  await apiRequest<unknown>({ method: 'POST', url: habitEndpoints.resetToday });
}
