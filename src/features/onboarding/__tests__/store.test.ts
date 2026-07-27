/**
 * Tests for the onboarding store.
 */
import { beforeEach, describe, expect, it } from '@jest/globals';

import { TOTAL_STEPS, useOnboardingStore, type OnboardingData } from '../store';

// Mock the KV store so persist/hydrate don't touch real storage.
jest.mock('@/core/storage/kv', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('onboarding store', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset();
    useOnboardingStore.setState({ isHydrated: false });
  });

  it('starts at step 1 with initial data', () => {
    const state = useOnboardingStore.getState();
    expect(state.step).toBe(1);
    expect(state.data.goalTitle).toBe('');
    expect(state.data.dailyMinutes).toBe(30);
    expect(state.data.accountabilityStyle).toBe('balanced');
  });

  it('updates a field', () => {
    useOnboardingStore.getState().updateField('goalTitle', 'Study consistently');
    expect(useOnboardingStore.getState().data.goalTitle).toBe('Study consistently');
  });

  it('navigates forward and backward', () => {
    useOnboardingStore.getState().nextStep();
    expect(useOnboardingStore.getState().step).toBe(2);
    useOnboardingStore.getState().prevStep();
    expect(useOnboardingStore.getState().step).toBe(1);
  });

  it('does not go below step 1', () => {
    useOnboardingStore.getState().prevStep();
    expect(useOnboardingStore.getState().step).toBe(1);
  });

  it('does not exceed TOTAL_STEPS', () => {
    for (let i = 0; i < TOTAL_STEPS + 5; i++) {
      useOnboardingStore.getState().nextStep();
    }
    expect(useOnboardingStore.getState().step).toBe(TOTAL_STEPS);
  });

  it('jumps to a specific step', () => {
    useOnboardingStore.getState().goToStep(4);
    expect(useOnboardingStore.getState().step).toBe(4);
  });

  it('clamps goToStep to valid range', () => {
    useOnboardingStore.getState().goToStep(0);
    expect(useOnboardingStore.getState().step).toBe(1);
    useOnboardingStore.getState().goToStep(100);
    expect(useOnboardingStore.getState().step).toBe(TOTAL_STEPS);
  });

  it('sets habit suggestions', () => {
    const suggestions = [
      { name: 'Habit 1', description: 'Desc 1', selected: true },
      { name: 'Habit 2', description: 'Desc 2', selected: true },
    ];
    useOnboardingStore.getState().setHabitSuggestions(suggestions);
    expect(useOnboardingStore.getState().data.habitSuggestions).toHaveLength(2);
  });

  it('toggles habit selection by index', () => {
    useOnboardingStore.getState().setHabitSuggestions([
      { name: 'Habit 1', description: 'Desc 1', selected: true },
      { name: 'Habit 2', description: 'Desc 2', selected: true },
    ]);
    useOnboardingStore.getState().toggleHabitSelection(0);
    const suggestions = useOnboardingStore.getState().data.habitSuggestions;
    expect(suggestions[0]?.selected).toBe(false);
    expect(suggestions[1]?.selected).toBe(true);
  });

  it('resets to initial state', () => {
    useOnboardingStore.getState().updateField('goalTitle', 'Test');
    useOnboardingStore.getState().nextStep();
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().step).toBe(1);
    expect(useOnboardingStore.getState().data.goalTitle).toBe('');
  });

  it('hydrates from persisted state', async () => {
    const { getItem } = jest.requireMock('@/core/storage/kv') as { getItem: jest.Mock };
    getItem.mockResolvedValueOnce({
      step: 3,
      data: { goalTitle: 'Persisted goal', dailyMinutes: 45 } as OnboardingData,
    });
    await useOnboardingStore.getState().hydrate();
    const state = useOnboardingStore.getState();
    expect(state.step).toBe(3);
    expect(state.data.goalTitle).toBe('Persisted goal');
    expect(state.data.dailyMinutes).toBe(45);
    expect(state.isHydrated).toBe(true);
  });

  it('sets hydrated flag even when no persisted state exists', async () => {
    await useOnboardingStore.getState().hydrate();
    expect(useOnboardingStore.getState().isHydrated).toBe(true);
  });
});
