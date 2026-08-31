/**
 * Tests for shared Zod schemas at API boundaries.
 */
import { describe, expect, it } from '@jest/globals';

import {
  ActivitySchema,
  ArticleSchema,
  ArticlesResponseSchema,
  AuthResponseSchema,
  BillingOverviewResponseSchema,
  CategorySchema,
  CheckInSchema,
  CoachingAttachmentSchema,
  ConversationMessageSchema,
  ConversationSchema,
  CreateCheckInRequestSchema,
  CreateCheckoutSessionResponseSchema,
  CreateCustomerPortalSessionResponseSchema,
  CreateHabitRequestSchema,
  GenerateOnboardingHabitsRequestSchema,
  GeneratePersonalizedCoachingRequestSchema,
  GoalSchema,
  GoalTemplatesResponseSchema,
  HabitSchema,
  HabitTemplatesResponseSchema,
  LikeArticleResponseSchema,
  NotificationSchema,
  NotificationsResponseSchema,
  ProfileSchema,
  RegisterDeviceRequestSchema,
  SaveItemRequestSchema,
  SavedItemDetailedSchema,
  SavedItemSchema,
  SavedItemsDetailedResponseSchema,
  SavedItemsResponseSchema,
  SearchResponseSchema,
  SearchResultSchema,
  SettingsSchema,
  ShareArticleResponseSchema,
  StartConversationResponseSchema,
  UnreadNotificationCountResponseSchema,
  WeeklyReviewResponseSchema,
  WeeklyReviewSchema,
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

describe('ActivitySchema', () => {
  it('parses a valid activity', () => {
    const parsed = ActivitySchema.parse({
      id: 'activity-1',
      itemType: 'habit_completed',
      title: 'Habit Completed',
      description: 'You completed Morning Exercise',
      userId: 'user-1',
      createdAt: '2024-01-15T08:00:00Z',
    });
    expect(parsed.itemType).toBe('habit_completed');
  });

  it('accepts optional metadata', () => {
    const parsed = ActivitySchema.parse({
      id: 'activity-1',
      itemType: 'habit_completed',
      title: 'Habit Completed',
      description: '',
      metadata: '{"habitId":"h1"}',
      userId: 'user-1',
      createdAt: '2024-01-15T08:00:00Z',
    });
    expect(parsed.metadata).toBe('{"habitId":"h1"}');
  });
});

describe('WeeklyReviewSchema', () => {
  const validReview = {
    id: 'wr-1',
    userId: 'user-1',
    weekStart: '2024-01-15',
    weekEnd: '2024-01-21',
    totalHabits: 3,
    completedCheckIns: 12,
    missedCheckIns: 4,
    completionRate: 0.75,
    moodSummary: { great: 2 },
    energySummary: { high: 1 },
    habitBreakdown: [
      {
        habitId: 'h1',
        habitName: 'Read',
        totalCheckIns: 7,
        completedCount: 5,
        missedCount: 2,
        completionRate: 0.71,
      },
    ],
    suggestedAdjustments: [],
    nextWeekPlan: {
      focus: 'Read more',
      commitments: ['Read 10 pages daily'],
      risks: ['Evening fatigue'],
      recoveryActions: ['Read in morning'],
    },
    generatedAt: '2024-01-21T08:00:00Z',
  };

  it('parses a valid weekly review', () => {
    const parsed = WeeklyReviewSchema.parse(validReview);
    expect(parsed.completionRate).toBe(0.75);
    expect(parsed.habitBreakdown).toHaveLength(1);
  });

  it('accepts optional aiSummary, bestDay, hardestDay, topBlocker', () => {
    const parsed = WeeklyReviewSchema.parse({
      ...validReview,
      aiSummary: 'Great week!',
      bestDay: 'Monday',
      hardestDay: 'Friday',
      topBlocker: 'Time',
    });
    expect(parsed.aiSummary).toBe('Great week!');
  });

  it('rejects completionRate outside [0,1]', () => {
    expect(() => WeeklyReviewSchema.parse({ ...validReview, completionRate: 1.5 })).toThrow();
  });

  it('WeeklyReviewResponseSchema wraps data', () => {
    const parsed = WeeklyReviewResponseSchema.parse({ data: validReview });
    expect(parsed.data.id).toBe('wr-1');
  });
});

describe('NotificationSchema', () => {
  it('parses a valid notification', () => {
    const parsed = NotificationSchema.parse({
      id: 'notif-1',
      title: 'Reminder',
      message: 'Do your habit',
      type: 'habit_reminder',
      read: false,
      userId: 'user-1',
      createdAt: '2024-01-15T08:00:00Z',
    });
    expect(parsed.read).toBe(false);
  });

  it('NotificationsResponseSchema wraps data + page', () => {
    const parsed = NotificationsResponseSchema.parse({
      data: [
        {
          id: 'notif-1',
          title: 'Reminder',
          message: 'Do your habit',
          type: 'habit_reminder',
          read: false,
          userId: 'user-1',
          createdAt: '2024-01-15T08:00:00Z',
        },
      ],
      page: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    expect(parsed.data).toHaveLength(1);
  });

  it('UnreadNotificationCountResponseSchema parses count', () => {
    const parsed = UnreadNotificationCountResponseSchema.parse({ count: 3 });
    expect(parsed.count).toBe(3);
  });
});

describe('ArticleSchema', () => {
  const validArticle = {
    id: 'article-1',
    title: '10 Habits for Personal Growth',
    excerpt: 'Discover the top habits...',
    content: 'Full article content here...',
    readTime: 5,
    imageUrl: 'https://example.com/article.jpg',
    author: 'John Smith',
    publishedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    isSaved: false,
    likeCount: 10,
    isLiked: false,
  };

  it('parses a valid article', () => {
    const parsed = ArticleSchema.parse(validArticle);
    expect(parsed.title).toBe('10 Habits for Personal Growth');
    expect(parsed.isSaved).toBe(false);
  });

  it('accepts optional category and tags', () => {
    const parsed = ArticleSchema.parse({
      ...validArticle,
      category: { id: 'cat-1', name: 'Personal Development', slug: 'personal-development' },
      tags: ['habits', 'growth'],
    });
    expect(parsed.category?.slug).toBe('personal-development');
    expect(parsed.tags).toEqual(['habits', 'growth']);
  });

  it('defaults tags to empty array when absent', () => {
    const parsed = ArticleSchema.parse(validArticle);
    expect(parsed.tags).toEqual([]);
  });

  it('ArticlesResponseSchema wraps data + page', () => {
    const parsed = ArticlesResponseSchema.parse({
      data: [validArticle],
      page: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    expect(parsed.data).toHaveLength(1);
  });
});

describe('LikeArticleResponseSchema', () => {
  it('parses a valid like response', () => {
    const parsed = LikeArticleResponseSchema.parse({
      success: true,
      newLikeCount: 11,
      isLiked: true,
    });
    expect(parsed.isLiked).toBe(true);
    expect(parsed.newLikeCount).toBe(11);
  });
});

describe('ShareArticleResponseSchema', () => {
  it('parses a valid share response', () => {
    const parsed = ShareArticleResponseSchema.parse({ success: true });
    expect(parsed.success).toBe(true);
  });
});

describe('SavedItemSchema', () => {
  it('parses a valid saved item', () => {
    const parsed = SavedItemSchema.parse({
      id: 'saved-1',
      itemType: 'article',
      itemId: 'article-1',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
    });
    expect(parsed.itemType).toBe('article');
  });

  it('rejects invalid itemType', () => {
    expect(() =>
      SavedItemSchema.parse({
        id: 'saved-1',
        itemType: 'invalid',
        itemId: 'article-1',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
      }),
    ).toThrow();
  });

  it('SavedItemsResponseSchema wraps data + page', () => {
    const parsed = SavedItemsResponseSchema.parse({
      data: [
        {
          id: 'saved-1',
          itemType: 'article',
          itemId: 'article-1',
          userId: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      page: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    expect(parsed.data).toHaveLength(1);
  });
});

describe('SavedItemDetailedSchema', () => {
  it('parses a detailed saved item with hydrated article', () => {
    const parsed = SavedItemDetailedSchema.parse({
      id: 'saved-1',
      itemType: 'article',
      itemId: 'article-1',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      article: {
        id: 'article-1',
        title: 'Test',
        excerpt: 'Excerpt',
        content: 'Content',
        readTime: 3,
        imageUrl: '',
        author: 'Author',
        publishedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        isSaved: true,
        likeCount: 0,
        isLiked: false,
      },
    });
    expect(parsed.article?.title).toBe('Test');
  });

  it('SavedItemsDetailedResponseSchema wraps data + page', () => {
    const parsed = SavedItemsDetailedResponseSchema.parse({
      data: [
        {
          id: 'saved-1',
          itemType: 'habit',
          itemId: 'habit-1',
          userId: 'user-1',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      page: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    expect(parsed.data).toHaveLength(1);
  });
});

describe('SaveItemRequestSchema', () => {
  it('parses a valid save request', () => {
    const parsed = SaveItemRequestSchema.parse({ itemType: 'article', itemId: 'article-1' });
    expect(parsed.itemType).toBe('article');
  });

  it('rejects empty itemId', () => {
    expect(() => SaveItemRequestSchema.parse({ itemType: 'article', itemId: '' })).toThrow();
  });
});

describe('SearchResultSchema', () => {
  it('parses a gateway search result type', () => {
    const parsed = SearchResultSchema.parse({
      id: 'article-1',
      type: 'article',
      title: 'Test',
      description: 'Desc',
      score: 0.95,
    });
    expect(parsed.score).toBe(0.95);
  });

  it('accepts optional highlight', () => {
    const parsed = SearchResultSchema.parse({
      id: 'article-1',
      type: 'article',
      title: 'Test',
      description: 'Desc',
      score: 0.95,
      highlight: '<em>Test</em>',
    });
    expect(parsed.highlight).toBe('<em>Test</em>');
  });

  it('SearchResponseSchema wraps data + page', () => {
    const parsed = SearchResponseSchema.parse({
      data: [{ id: 'a1', type: 'article', title: 'T', description: 'D', score: 1 }],
      page: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    expect(parsed.data).toHaveLength(1);
  });
});

describe('HabitTemplatesResponseSchema', () => {
  it('parses habit templates', () => {
    const parsed = HabitTemplatesResponseSchema.parse({
      data: [
        {
          id: 'tpl-1',
          name: 'Morning Exercise',
          description: '30 min cardio',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0]?.name).toBe('Morning Exercise');
  });
});

describe('GoalTemplatesResponseSchema', () => {
  it('parses goal templates', () => {
    const parsed = GoalTemplatesResponseSchema.parse({
      data: [
        {
          id: 'tpl-1',
          title: 'Run a marathon',
          description: 'Complete a 42km race',
          sortOrder: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0]?.title).toBe('Run a marathon');
  });
});

describe('ConversationSchema', () => {
  it('parses a valid conversation', () => {
    const parsed = ConversationSchema.parse({
      id: 'conv-1',
      title: 'My coaching thread',
      type: 'coach',
      lastMessage: 'Keep going!',
      archived: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    });
    expect(parsed.id).toBe('conv-1');
    expect(parsed.type).toBe('coach');
    expect(parsed.archived).toBe(false);
  });

  it('accepts an optional userId', () => {
    const parsed = ConversationSchema.parse({
      id: 'conv-1',
      title: 'Thread',
      type: 'coach',
      lastMessage: '',
      userId: 'user-1',
      archived: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
    expect(parsed.userId).toBe('user-1');
  });
});

describe('ConversationMessageSchema', () => {
  it('parses a valid user message', () => {
    const parsed = ConversationMessageSchema.parse({
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'user',
      content: 'How do I stay consistent?',
      createdAt: '2024-01-01T00:00:00Z',
    });
    expect(parsed.role).toBe('user');
  });

  it('parses a valid assistant message', () => {
    const parsed = ConversationMessageSchema.parse({
      id: 'msg-2',
      conversationId: 'conv-1',
      role: 'assistant',
      content: 'Small, repeatable cues.',
      createdAt: '2024-01-01T00:00:01Z',
    });
    expect(parsed.role).toBe('assistant');
  });

  it('rejects an invalid role', () => {
    expect(() =>
      ConversationMessageSchema.parse({
        id: 'msg-3',
        conversationId: 'conv-1',
        role: 'unknown',
        content: 'x',
        createdAt: '2024-01-01T00:00:00Z',
      }),
    ).toThrow();
  });
});

describe('StartConversationResponseSchema', () => {
  it('parses a start response with initial message', () => {
    const parsed = StartConversationResponseSchema.parse({
      data: {
        id: 'conv-1',
        title: 'New chat',
        type: 'coach',
        lastMessage: '',
        archived: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      initialMessage: {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'assistant',
        content: 'Hello!',
        createdAt: '2024-01-01T00:00:00Z',
      },
    });
    expect(parsed.data.id).toBe('conv-1');
    expect(parsed.initialMessage?.content).toBe('Hello!');
  });

  it('parses a start response without initial message', () => {
    const parsed = StartConversationResponseSchema.parse({
      data: {
        id: 'conv-2',
        title: 'New chat',
        type: 'coach',
        lastMessage: '',
        archived: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    });
    expect(parsed.initialMessage).toBeUndefined();
  });
});

describe('BillingOverviewResponseSchema', () => {
  it('parses a billing overview with entitlements', () => {
    const parsed = BillingOverviewResponseSchema.parse({
      plans: [
        {
          id: 'plan-1',
          code: 'free',
          name: 'Free',
          priceMonthlyCents: 0,
          priceAnnualCents: 0,
          personalizedAiEnabled: false,
          isActive: true,
        },
      ],
      subscription: {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        planCode: 'free',
        planName: 'Free',
        status: 'free',
        cancelAtPeriodEnd: false,
      },
      entitlements: {
        planCode: 'free',
        status: 'free',
        personalizedAiEnabled: false,
        canCreateGoal: true,
        canCreateHabit: true,
        canViewWeeklyReviewHistory: false,
        canUsePersonalizedAi: false,
        canCreatePlanAdjustment: false,
        currentActiveGoals: 1,
        currentActiveHabits: 2,
        currentPendingAdjustments: 0,
      },
      billingMode: 'fake_door',
    });
    expect(parsed.entitlements.canUsePersonalizedAi).toBe(false);
    expect(parsed.entitlements.currentActiveHabits).toBe(2);
  });
});

describe('CreateCheckoutSessionResponseSchema', () => {
  it('parses a checkout url + session id', () => {
    const parsed = CreateCheckoutSessionResponseSchema.parse({
      checkoutUrl: 'https://checkout.stripe.com/c/test_123',
      sessionId: 'cs_test_123',
    });
    expect(parsed.checkoutUrl).toBe('https://checkout.stripe.com/c/test_123');
    expect(parsed.sessionId).toBe('cs_test_123');
  });

  it('parses when optional fields are absent', () => {
    const parsed = CreateCheckoutSessionResponseSchema.parse({});
    expect(parsed.checkoutUrl).toBeUndefined();
    expect(parsed.sessionId).toBeUndefined();
  });

  it('rejects a non-url checkoutUrl', () => {
    expect(() => CreateCheckoutSessionResponseSchema.parse({ checkoutUrl: 'not-a-url' })).toThrow();
  });
});

describe('CreateCustomerPortalSessionResponseSchema', () => {
  it('parses a portal url', () => {
    const parsed = CreateCustomerPortalSessionResponseSchema.parse({
      portalUrl: 'https://billing.stripe.com/portal',
    });
    expect(parsed.portalUrl).toBe('https://billing.stripe.com/portal');
  });

  it('parses when portal url is absent', () => {
    const parsed = CreateCustomerPortalSessionResponseSchema.parse({});
    expect(parsed.portalUrl).toBeUndefined();
  });
});

describe('RegisterDeviceRequestSchema', () => {
  it('parses a valid device registration', () => {
    const parsed = RegisterDeviceRequestSchema.parse({
      pushToken: 'ExponentPushToken[abc]',
      provider: 'expo',
      platform: 'ios',
      environment: 'production',
    });
    expect(parsed.pushToken).toBe('ExponentPushToken[abc]');
    expect(parsed.appId).toBeUndefined();
  });

  it('rejects an empty push token', () => {
    expect(() =>
      RegisterDeviceRequestSchema.parse({
        pushToken: '',
        provider: 'expo',
        platform: 'ios',
        environment: 'production',
      }),
    ).toThrow();
  });

  it('rejects a missing required field', () => {
    expect(() =>
      RegisterDeviceRequestSchema.parse({
        pushToken: 'tok',
        provider: 'expo',
        platform: 'ios',
      }),
    ).toThrow();
  });
});

describe('CoachingAttachmentSchema', () => {
  it('parses a valid image attachment', () => {
    const parsed = CoachingAttachmentSchema.parse({
      attachmentType: 'image',
      name: 'screenshot.png',
      contentType: 'image/png',
      data: 'iVBORw0KGgo=',
    });
    expect(parsed.attachmentType).toBe('image');
    expect(parsed.name).toBe('screenshot.png');
  });

  it('parses a valid document attachment', () => {
    const parsed = CoachingAttachmentSchema.parse({
      attachmentType: 'document',
      name: 'report.pdf',
      contentType: 'application/pdf',
      data: 'JVBERi0=',
    });
    expect(parsed.attachmentType).toBe('document');
  });

  it('rejects an invalid attachmentType', () => {
    expect(() =>
      CoachingAttachmentSchema.parse({
        attachmentType: 'video',
        name: 'clip.mp4',
        contentType: 'video/mp4',
        data: 'AAAA',
      }),
    ).toThrow();
  });
});

describe('GeneratePersonalizedCoachingRequestSchema', () => {
  it('parses a minimal request with only a message', () => {
    const parsed = GeneratePersonalizedCoachingRequestSchema.parse({
      userMessage: 'Help me stay consistent.',
    });
    expect(parsed.userMessage).toBe('Help me stay consistent.');
    expect(parsed.attachments).toBeUndefined();
  });

  it('parses a request with conversationId and attachments', () => {
    const parsed = GeneratePersonalizedCoachingRequestSchema.parse({
      userMessage: 'Look at this screenshot.',
      conversationId: 'conv-1',
      attachments: [
        {
          attachmentType: 'image',
          name: 'screenshot.png',
          contentType: 'image/png',
          data: 'iVBORw0KGgo=',
        },
      ],
      goalId: 'goal-1',
      regenerate: false,
      clientMessageId: 'msg-uuid-1',
    });
    expect(parsed.conversationId).toBe('conv-1');
    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.goalId).toBe('goal-1');
    expect(parsed.clientMessageId).toBe('msg-uuid-1');
  });

  it('rejects an empty userMessage', () => {
    expect(() => GeneratePersonalizedCoachingRequestSchema.parse({ userMessage: '' })).toThrow();
  });
});
