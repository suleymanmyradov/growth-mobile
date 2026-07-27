/**
 * Onboarding draft store — Zustand with non-secret persistence via expo-sqlite
 * KV store.
 *
 * Per AGENTS.md: Zustand holds only the onboarding draft (small client state).
 * The draft is persisted so a user can resume if they background the app during
 * onboarding. It is purged after successful submission and on logout.
 *
 * The store shape mirrors the web frontend's `store/onboarding.ts`, reconciled
 * with the backend contract.
 */
import { create } from 'zustand';

import { getItem, removeItem, setItem } from '@/core/storage/kv';

export type AccountabilityStyle = 'gentle' | 'balanced' | 'strict';

export type HabitSuggestion = {
  name: string;
  description: string;
  selected: boolean;
};

export type OnboardingData = {
  goalTitle: string;
  goalCategory: string;
  motivation: string;
  blocker: string;
  dailyMinutes: number;
  accountabilityStyle: AccountabilityStyle;
  checkInTime: string;
  habitSuggestions: HabitSuggestion[];
};

export const TOTAL_STEPS = 7;

const ONBOARDING_KEY = 'growth.onboarding_draft';

const initialData: OnboardingData = {
  goalTitle: '',
  goalCategory: '',
  motivation: '',
  blocker: '',
  dailyMinutes: 30,
  accountabilityStyle: 'balanced',
  checkInTime: '09:00',
  habitSuggestions: [],
};

interface OnboardingStore {
  step: number;
  data: OnboardingData;
  loadingHabits: boolean;
  error: string | null;
  isHydrated: boolean;
  updateField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setLoadingHabits: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHabitSuggestions: (suggestions: HabitSuggestion[]) => void;
  toggleHabitSelection: (index: number) => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  step: 1,
  data: initialData,
  loadingHabits: false,
  error: null,
  isHydrated: false,

  updateField: (key, value) => {
    set((state) => ({ data: { ...state.data, [key]: value } }));
    get().persist();
  },

  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, TOTAL_STEPS) })),
  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  goToStep: (step) => set({ step: Math.max(1, Math.min(step, TOTAL_STEPS)) }),

  setLoadingHabits: (loading) => set({ loadingHabits: loading }),
  setError: (error) => set({ error }),

  setHabitSuggestions: (suggestions) => {
    set((state) => ({ data: { ...state.data, habitSuggestions: suggestions } }));
    get().persist();
  },

  toggleHabitSelection: (index) => {
    set((state) => {
      const updated = [...state.data.habitSuggestions];
      const item = updated[index];
      if (item) {
        updated[index] = { ...item, selected: !item.selected };
      }
      return { data: { ...state.data, habitSuggestions: updated } };
    });
    get().persist();
  },

  reset: () => {
    set({ step: 1, data: initialData, loadingHabits: false, error: null });
    removeItem(ONBOARDING_KEY).catch(() => {});
  },

  setHydrated: (hydrated) => set({ isHydrated: hydrated }),

  hydrate: async () => {
    try {
      const persisted = await getItem<{ step: number; data: OnboardingData }>(ONBOARDING_KEY);
      if (persisted) {
        set({ step: persisted.step, data: { ...initialData, ...persisted.data } });
      }
    } catch {
      // Ignore — non-fatal.
    }
    set({ isHydrated: true });
  },

  persist: async () => {
    const { step, data } = get();
    try {
      await setItem(ONBOARDING_KEY, { step, data });
    } catch {
      // Ignore — non-fatal.
    }
  },
}));

/**
 * Constants shared with the web frontend (from `lib/constants.ts`).
 */
export const ACCOUNTABILITY_STYLES: AccountabilityStyle[] = ['gentle', 'balanced', 'strict'];

export const CHECK_IN_HOURS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
] as const;

export const DAILY_COMMITMENT_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
] as const;

export const BLOCKER_OPTIONS = [
  'Lack of time',
  'Low motivation',
  'Too distracted',
  'Unclear plan',
  'Other',
] as const;
