/**
 * Profile API — get, update, delete, avatar upload.
 */
import { apiRequest } from '@/core/api/client';
import { fileEndpoints, profileEndpoints } from '@/core/api/endpoints';
import { uploadFile } from '@/core/api/multipart';
import {
  ExportDataResponseSchema,
  ProfileResponseSchema,
  UpdateProfileRequestSchema,
  UploadResponseSchema,
  type ExportDataResponse,
  type ProfileResponse,
  type UpdateProfileRequest,
  type UploadResponse,
} from '@/core/api/schemas';

export type { ExportDataResponse, ProfileResponse, UpdateProfileRequest, UploadResponse };

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

/**
 * Upload an avatar image and return the public URL.
 *
 * Uses expo-image-picker to select, expo-image-manipulator to resize/compress
 * to a reasonable avatar size, then uploads via the multipart adapter.
 */
export async function uploadAvatar(fileUri: string, mimeType: string): Promise<UploadResponse> {
  const response = await uploadFile<unknown>({
    path: fileEndpoints.upload,
    fieldName: 'file',
    fileUri,
    mimeType,
    fields: { folder: 'avatars' },
  });
  return UploadResponseSchema.parse(response);
}

/**
 * Request a data export. Returns a presigned download URL.
 * The caller opens the URL with expo-sharing or Linking.
 */
export async function exportData(): Promise<ExportDataResponse> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: profileEndpoints.export,
    timeout: 30_000,
  });
  return ExportDataResponseSchema.parse(response);
}
