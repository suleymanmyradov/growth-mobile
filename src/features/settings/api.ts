/**
 * Settings API — get, update.
 */
import { apiRequest } from '@/core/api/client';
import { settingsEndpoints } from '@/core/api/endpoints';
import {
  SettingsResponseSchema,
  UpdateSettingsRequestSchema,
  type SettingsResponse,
  type UpdateSettingsRequest,
} from '@/core/api/schemas';

export type { SettingsResponse, UpdateSettingsRequest };

export async function getSettings(): Promise<SettingsResponse> {
  const response = await apiRequest<unknown>({ method: 'GET', url: settingsEndpoints.get });
  return SettingsResponseSchema.parse(response);
}

export async function updateSettings(data: UpdateSettingsRequest): Promise<SettingsResponse> {
  const validated = UpdateSettingsRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: settingsEndpoints.update,
    data: validated,
  });
  return SettingsResponseSchema.parse(response);
}
