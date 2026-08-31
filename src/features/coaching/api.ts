/**
 * Coaching profile API — get and update preferences.
 *
 * The coaching profile lives at `/personalization/coaching-profile`. The
 * preferences endpoint (`PUT …/preferences`) accepts the three preference
 * fields the user controls: accountabilityStyle, preferredTone, and
 * difficultyPreference. All three are required on every update.
 */
import { apiRequest } from '@/core/api/client';
import { personalizationEndpoints } from '@/core/api/endpoints';
import {
  CoachingProfileResponseSchema,
  UpdateCoachingProfilePreferencesRequestSchema,
  type CoachingProfile,
  type CoachingProfileResponse,
  type UpdateCoachingProfilePreferencesRequest,
} from '@/core/api/schemas';

export type { CoachingProfile, CoachingProfileResponse, UpdateCoachingProfilePreferencesRequest };

export async function getCoachingProfile(): Promise<CoachingProfile> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: personalizationEndpoints.coachingProfile,
  });
  return CoachingProfileResponseSchema.parse(response).data;
}

export async function updateCoachingProfilePreferences(
  data: UpdateCoachingProfilePreferencesRequest,
): Promise<CoachingProfile> {
  const validated = UpdateCoachingProfilePreferencesRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'PUT',
    url: personalizationEndpoints.coachingProfilePreferences,
    data: validated,
  });
  return CoachingProfileResponseSchema.parse(response).data;
}
