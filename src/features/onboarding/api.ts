/**
 * Onboarding API — generate AI habit suggestions.
 *
 * The backend owns the prompt and AI policy; the app sends only structured
 * onboarding fields.
 */
import { apiRequest } from '@/core/api/client';
import { personalizationEndpoints } from '@/core/api/endpoints';
import {
  GenerateOnboardingHabitsRequestSchema,
  GenerateOnboardingHabitsResponseSchema,
  type GenerateOnboardingHabitsRequest,
  type OnboardingHabitSuggestion,
} from '@/core/api/schemas';

export async function generateOnboardingHabits(
  data: GenerateOnboardingHabitsRequest,
): Promise<OnboardingHabitSuggestion[]> {
  const validated = GenerateOnboardingHabitsRequestSchema.parse(data);
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: personalizationEndpoints.onboardingHabits,
    data: validated,
    timeout: 30_000, // AI generation may take longer
  });
  const parsed = GenerateOnboardingHabitsResponseSchema.parse(response);
  return parsed.data;
}
