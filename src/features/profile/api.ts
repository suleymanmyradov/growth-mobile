/**
 * Profile API — get, update, delete.
 */
import { apiRequest } from '@/core/api/client';
import { profileEndpoints } from '@/core/api/endpoints';
import {
  ProfileResponseSchema,
  UpdateProfileRequestSchema,
  type ProfileResponse,
  type UpdateProfileRequest,
} from '@/core/api/schemas';

export type { ProfileResponse, UpdateProfileRequest };

export async function getProfile(): Promise<ProfileResponse> {
  const response = await apiRequest<unknown>({ method: 'GET', url: profileEndpoints.me });
  return ProfileResponseSchema.parse(response);
}

export async function updateProfile(data: UpdateProfileRequest): Promise<ProfileResponse> {
  const validated = UpdateProfileRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: profileEndpoints.update,
    data: validated,
  });
  return ProfileResponseSchema.parse(response);
}

export async function deleteProfile(): Promise<void> {
  await apiRequest<unknown>({ method: 'DELETE', url: profileEndpoints.delete });
}
