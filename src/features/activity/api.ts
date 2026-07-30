/**
 * Activity API — feed list.
 */
import { apiRequest } from '@/core/api/client';
import { activityEndpoints } from '@/core/api/endpoints';
import { ActivityResponseSchema, type Activity, type ActivityResponse } from '@/core/api/schemas';

export type { Activity, ActivityResponse };

export async function listActivity(params?: {
  page?: number;
  limit?: number;
}): Promise<Activity[]> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: activityEndpoints.list,
    params: { page: 1, limit: 20, ...params },
  });
  const parsed = ActivityResponseSchema.parse(response);
  return parsed.data;
}
