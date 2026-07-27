/**
 * Check-ins API — create, today, history, checked-today.
 */
import { apiRequest } from '@/core/api/client';
import { checkInEndpoints } from '@/core/api/endpoints';
import {
  CreateCheckInRequestSchema,
  CreateCheckInResponseSchema,
  CheckInsResponseSchema,
  type CheckIn,
  type CheckInsResponse,
  type CreateCheckInRequest,
  type CreateCheckInResponse,
} from '@/core/api/schemas';

export type { CheckIn, CreateCheckInRequest, CreateCheckInResponse, CheckInsResponse };

export async function createCheckIn(data: CreateCheckInRequest): Promise<CreateCheckInResponse> {
  const validated = CreateCheckInRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: checkInEndpoints.create,
    data: validated,
  });
  return CreateCheckInResponseSchema.parse(response);
}

export async function getTodayCheckIns(): Promise<CheckIn[]> {
  const response = await apiRequest<unknown>({ method: 'GET', url: checkInEndpoints.today });
  const parsed = CheckInsResponseSchema.parse(response);
  return parsed.data;
}

export async function getCheckInHistory(params: {
  habitId?: string;
  page?: number;
  limit?: number;
}): Promise<CheckIn[]> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: checkInEndpoints.history,
    params: { page: 1, limit: 20, ...params },
  });
  const parsed = CheckInsResponseSchema.parse(response);
  return parsed.data;
}
