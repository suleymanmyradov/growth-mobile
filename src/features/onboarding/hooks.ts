/**
 * Onboarding submission hook — duplicate-safe submission that creates a goal,
 * selected habits, and updates settings.
 *
 * Per AGENTS.md: make submission duplicate-safe. Guards against double-submission
 * (rapid double-clicks fire before React Query's isPending flips the button
 * disabled state) and against re-entry while the persisted onboarding store
 * still holds the submitted suggestions.
 *
 * Mirrors the web frontend's `handleFinish` logic in
 * `components/onboarding/onboarding-client.tsx`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef } from 'react';

import { ApiError } from '@/core/api/errors';
import { useSessionStore } from '@/core/auth/session';
import { goalKeys, habitKeys, settingsKeys } from '@/core/query/query-keys';
import { createGoal, type CreateGoalRequest } from '@/features/goals';
import { createHabit, type CreateHabitRequest } from '@/features/habits';
import { updateSettings } from '@/features/settings';

import { generateOnboardingHabits } from './api';
import { useOnboardingStore, type OnboardingData } from './store';

export function useGenerateOnboardingHabits() {
  const setLoadingHabits = useOnboardingStore((s) => s.setLoadingHabits);
  const setError = useOnboardingStore((s) => s.setError);
  const setHabitSuggestions = useOnboardingStore((s) => s.setHabitSuggestions);
  const generatingRef = useRef(false);

  const generate = async (data: OnboardingData): Promise<void> => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setLoadingHabits(true);
    setError(null);
    try {
      const habits = await generateOnboardingHabits({
        goalTitle: data.goalTitle,
        goalCategory: data.goalCategory || undefined,
        motivation: data.motivation || undefined,
        blocker: data.blocker || undefined,
        dailyMinutes: data.dailyMinutes,
        accountabilityStyle: data.accountabilityStyle,
      });

      const suggestions = habits.slice(0, 3).map((h) => ({
        name: h.name,
        description: h.description,
        selected: true,
      }));
      setHabitSuggestions(suggestions);
    } catch {
      // Fallback suggestions if AI generation fails.
      const fallback = [
        {
          name: `Work on ${data.goalTitle} for ${Math.round(data.dailyMinutes / 3)} minutes`,
          description: 'Set a timer and focus exclusively on this task.',
          selected: true,
        },
        {
          name: 'Review your plan for tomorrow',
          description: 'Spend 5 minutes each evening reviewing what you will do next.',
          selected: true,
        },
        {
          name: 'Track your progress',
          description: 'Write one sentence about what you accomplished today.',
          selected: true,
        },
      ];
      setHabitSuggestions(fallback);
    } finally {
      setLoadingHabits(false);
      generatingRef.current = false;
    }
  };

  return { generate };
}

export function useSubmitOnboarding() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reset = useOnboardingStore((s) => s.reset);
  const setError = useOnboardingStore((s) => s.setError);
  const setUser = useSessionStore((s) => s.setUser);
  const submittingRef = useRef(false);

  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      if (submittingRef.current) throw new Error('Submission already in progress');
      submittingRef.current = true;

      try {
        // 1. Create the goal.
        const goalReq: CreateGoalRequest = {
          title: data.goalTitle,
          description: data.motivation
            ? `Goal: ${data.goalTitle}. Motivation: ${data.motivation}`
            : data.goalTitle,
          category: data.goalCategory || 'personal',
        };
        await createGoal(goalReq);

        // 2. Create selected habits in parallel.
        const selectedHabits = data.habitSuggestions.filter((h) => h.selected);
        await Promise.all(
          selectedHabits.map((habit) =>
            createHabit({
              name: habit.name,
              description: habit.description,
              category: data.goalCategory || 'personal',
            } satisfies CreateHabitRequest),
          ),
        );

        // 3. Update settings — mark onboarding complete.
        await updateSettings({
          accountabilityStyle: data.accountabilityStyle,
          checkInTime: data.checkInTime,
          onboardingCompleted: true,
        });
      } finally {
        submittingRef.current = false;
      }
    },
    onSuccess: (_data, _variables) => {
      // Invalidate all affected domains.
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });

      // Mark onboarding complete in the session store.
      const current = useSessionStore.getState().user;
      if (current) {
        setUser({ ...current, onboardingCompleted: true });
      }

      // Clear the persisted onboarding draft so a back/refresh can't re-submit.
      reset();
      router.replace('/(app)/(tabs)');
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    },
  });
}
