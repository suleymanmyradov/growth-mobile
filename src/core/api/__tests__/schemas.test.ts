/**
 * Tests for shared Zod schemas at API boundaries.
 */
import { describe, it, expect } from '@jest/globals';

import {
  AuthResponseSchema,
  CategorySchema,
  CheckInSchema,
  CreateCheckInRequestSchema,
  CreateHabitRequestSchema,
  GoalSchema,
  HabitSchema,
  ProfileSchema,
  SettingsSchema,
  GenerateOnboardingHabitsRequestSchema,
} from '@/core/api/schemas';

describe('AuthResponseSchema', () => {
  it('parses a valid auth response', () => {
    const data = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      user: {
        id: 'user-1',
        fullName: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    };
    const parsed = AuthResponseSchema.parse(data);
    expect(parsed.accessToken).toBe('access-token');
    expect(parsed.user.id).toBe('user-1');
  });

  it('rejects missing tokens', () => {
    expect(() =>
      AuthResponseSchema.parse({
        accessToken: 'access',
        expiresIn: 3600,
        user: {
          id: '1',
          fullName: 'A',
          username: 'a',
          email: 'a@b.c',
          createdAt: '',
          updatedAt: '',
        },
      }),
    ).toThrow();
  });
});

describe('ProfileSchema', () => {
  it('parses a valid profile', () => {
    const data = {
      id: 'user-1',
      fullName: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const parsed = ProfileSchema.parse(data);
    expect(parsed.id).toBe('user-1');
    expect(parsed.interests).toEqual([]);
  });

  it('handles null interests', () => {
    const data = {
      id: 'user-1',
      fullName: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      interests: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const parsed = ProfileSchema.parse(data);
    expect(parsed.interests).toEqual([]);
  });
});

describe('HabitSchema', () => {
  it('parses a valid habit', () => {
    const data = {
      id: 'habit-1',
      name: 'Morning Exercise',
      description: '30 min cardio',
      streak: 5,
      completed: false,
      category: 'health',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const parsed = HabitSchema.parse(data);
    expect(parsed.id).toBe('habit-1');
    expect(parsed.streak).toBe(5);
  });

  it('handles null recentHistory', () => {
    const data = {
      id: 'habit-1',
      name: 'Morning Exercise',
      description: '',
      streak: 0,
      completed: false,
      category: 'health',
      userId: 'user-1',
      recentHistory: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const parsed = HabitSchema.parse(data);
    expect(parsed.recentHistory).toBeUndefined();
  });
});

describe('CreateHabitRequestSchema', () => {
  it('parses a valid request', () => {
    const parsed = CreateHabitRequestSchema.parse({
      name: 'Read 10 pages',
      description: 'Read before bed',
      category: 'learning',
    });
    expect(parsed.name).toBe('Read 10 pages');
  });

  it('rejects empty name', () => {
    expect(() =>
      CreateHabitRequestSchema.parse({ name: '', description: '', category: 'learning' }),
    ).toThrow();
  });
});

describe('GoalSchema', () => {
  it('parses a valid goal', () => {
    const data = {
      id: 'goal-1',
      title: 'Run a marathon',
      description: 'Complete a 42km race',
      category: 'fitness',
      progress: 25,
      completed: false,
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const parsed = GoalSchema.parse(data);
    expect(parsed.id).toBe('goal-1');
    expect(parsed.progress).toBe(25);
  });

  it('handles null relatedHabitIds', () => {
    const data = {
      id: 'goal-1',
      title: 'Run a marathon',
      description: '',
      category: 'fitness',
      progress: 0,
      completed: false,
      relatedHabitIds: null,
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const parsed = GoalSchema.parse(data);
    expect(parsed.relatedHabitIds).toBeUndefined();
  });
});

describe('CheckInSchema', () => {
  it('parses a completed check-in', () => {
    const data = {
      id: 'ci-1',
      userId: 'user-1',
      habitId: 'habit-1',
      status: 'completed',
      createdAt: '2024-01-01T00:00:00Z',
    };
    const parsed = CheckInSchema.parse(data);
    expect(parsed.status).toBe('completed');
    expect(parsed.mood).toBeUndefined();
  });

  it('normalizes empty-string enums to undefined', () => {
    const data = {
      id: 'ci-1',
      userId: 'user-1',
      habitId: 'habit-1',
      status: 'completed',
      mood: '',
      energy: '',
      blocker: '',
      createdAt: '2024-01-01T00:00:00Z',
    };
    const parsed = CheckInSchema.parse(data);
    expect(parsed.mood).toBeUndefined();
    expect(parsed.energy).toBeUndefined();
    expect(parsed.blocker).toBeUndefined();
  });
});

describe('CreateCheckInRequestSchema', () => {
  it('parses a valid request', () => {
    const parsed = CreateCheckInRequestSchema.parse({
      habitId: 'habit-1',
      status: 'completed',
    });
    expect(parsed.habitId).toBe('habit-1');
  });

  it('rejects invalid status', () => {
    expect(() =>
      CreateCheckInRequestSchema.parse({ habitId: 'habit-1', status: 'invalid' }),
    ).toThrow();
  });
});

describe('CategorySchema', () => {
  it('parses a valid category', () => {
    const data = {
      id: 'cat-1',
      name: 'Health',
      slug: 'health',
      sortOrder: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const parsed = CategorySchema.parse(data);
    expect(parsed.slug).toBe('health');
  });
});

describe('SettingsSchema', () => {
  it('parses valid settings with defaults for empty strings', () => {
    const data = {
      id: 'settings-1',
      theme: '',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      pushNotifications: false,
      habitReminders: true,
      goalReminders: false,
      accountabilityStyle: '',
      checkInTime: '09:00',
      onboardingCompleted: false,
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    const parsed = SettingsSchema.parse(data);
    expect(parsed.theme).toBe('system');
    expect(parsed.accountabilityStyle).toBe('balanced');
  });
});

describe('GenerateOnboardingHabitsRequestSchema', () => {
  it('parses a valid request', () => {
    const parsed = GenerateOnboardingHabitsRequestSchema.parse({
      goalTitle: 'Study consistently',
      dailyMinutes: 30,
    });
    expect(parsed.goalTitle).toBe('Study consistently');
  });

  it('rejects empty goal title', () => {
    expect(() =>
      GenerateOnboardingHabitsRequestSchema.parse({ goalTitle: '', dailyMinutes: 30 }),
    ).toThrow();
  });
});
