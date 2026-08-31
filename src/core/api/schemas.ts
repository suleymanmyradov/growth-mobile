/**
 * Shared Zod schemas and types for API boundaries.
 *
 * These mirror the backend gateway contract in
 * `../backend/services/gateway/contract/types.api` and the web frontend's
 * `lib/validation.ts`. Runtime validation at network boundaries is mandatory
 * per AGENTS.md.
 *
 * Feature-specific schemas live in their owning feature directory; only shared
 * envelopes and cross-feature types live here.
 */
import { z } from 'zod';

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PageResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type PageResponse = z.infer<typeof PageResponseSchema>;

export const PageParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type PageParams = z.infer<typeof PageParamsSchema>;

/**
 * Wraps a data schema in the standard `{ data, page? }` envelope.
 */
export function ApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    page: PageResponseSchema.optional(),
  });
}

// ─── Empty response ───────────────────────────────────────────────────────────

export const EmptyResponseSchema = z.object({}).or(z.literal(''));

// ─── Profile ──────────────────────────────────────────────────────────────────

export const ProfileSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  username: z.string(),
  email: z.string(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  interests: z
    .array(z.string())
    .nullable()
    .optional()
    .transform((v) => v ?? []),
  avatarUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  emailVerified: z.boolean().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileResponseSchema = ApiResponseSchema(ProfileSchema);

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().max(200).optional(),
  interests: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  user: ProfileSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const RegisterResponseSchema = z.object({
  requiresVerification: z.boolean(),
  message: z.string(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// ─── Habit ────────────────────────────────────────────────────────────────────

export const HabitSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  streak: z.number().int().nonnegative(),
  completed: z.boolean(),
  category: z.string(),
  userId: z.string(),
  recentHistory: z.preprocess((v) => (v === null ? undefined : v), z.array(z.boolean()).optional()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Habit = z.infer<typeof HabitSchema>;

export const HabitsResponseSchema = ApiResponseSchema(z.array(HabitSchema)).extend({
  page: PageResponseSchema,
});

export type HabitsResponse = z.infer<typeof HabitsResponseSchema>;

export const HabitResponseSchema = ApiResponseSchema(HabitSchema);

export type HabitResponse = z.infer<typeof HabitResponseSchema>;

export const CreateHabitRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000),
  category: z.string().min(1).max(50),
});

export type CreateHabitRequest = z.infer<typeof CreateHabitRequestSchema>;

export const UpdateHabitRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(50).optional(),
});

export type UpdateHabitRequest = z.infer<typeof UpdateHabitRequestSchema>;

/** Normalizes go-zero's empty-string serialization for optional enums. */
const optionalEnum = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

// ─── Goal ─────────────────────────────────────────────────────────────────────

export const GoalMeasurementSchema = z.enum(['binary', 'numeric', 'milestone', 'habit', 'manual']);
export type GoalMeasurement = z.infer<typeof GoalMeasurementSchema>;

export const GoalMilestoneSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  title: z.string(),
  sortOrder: z.number().int(),
  doneAt: z.string().optional(),
});

export type GoalMilestone = z.infer<typeof GoalMilestoneSchema>;

/** Form-state shape for milestone steps (id optional for new entries). */
export const MilestoneInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
});

export type MilestoneInput = z.infer<typeof MilestoneInputSchema>;

const optionalNumber = z.preprocess(
  (v) => (v === '' || v === null ? undefined : v),
  z.number().optional(),
);

export const GoalSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  category: z.string(),
  dueDate: z.string().optional(),
  progress: z.number().min(0).max(100),
  completed: z.boolean(),
  relatedHabitIds: z.preprocess(
    (v) => (v === null ? undefined : v),
    z.array(z.string()).optional(),
  ),
  measurement: optionalEnum(GoalMeasurementSchema),
  startValue: optionalNumber,
  currentValue: optionalNumber,
  targetValue: optionalNumber,
  unit: z.string().max(32).optional(),
  milestones: z.preprocess(
    (v) => (v === null ? undefined : v),
    z.array(GoalMilestoneSchema).optional(),
  ),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Goal = z.infer<typeof GoalSchema>;

export const GoalsResponseSchema = ApiResponseSchema(z.array(GoalSchema)).extend({
  page: PageResponseSchema,
});

export type GoalsResponse = z.infer<typeof GoalsResponseSchema>;

export const GoalResponseSchema = ApiResponseSchema(GoalSchema);

export type GoalResponse = z.infer<typeof GoalResponseSchema>;

export const CreateGoalRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000),
  category: z.string().min(1).max(50),
  dueDate: z.string().optional(),
  relatedHabitIds: z.array(z.string()).optional(),
  measurement: GoalMeasurementSchema.optional(),
  startValue: z.number().optional(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  unit: z.string().max(32).optional(),
  milestoneTitles: z.array(z.string()).optional(),
});

export type CreateGoalRequest = z.infer<typeof CreateGoalRequestSchema>;

export const UpdateGoalRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(50).optional(),
  dueDate: z.string().optional(),
  relatedHabitIds: z.array(z.string()).optional(),
  measurement: GoalMeasurementSchema.optional(),
  startValue: z.number().optional(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  unit: z.string().max(32).optional(),
  milestoneTitles: z.array(z.string()).optional(),
  milestones: z.array(MilestoneInputSchema).optional(),
});

export type UpdateGoalRequest = z.infer<typeof UpdateGoalRequestSchema>;

export const LogGoalValueRequestSchema = z.object({
  value: z.number(),
});

export type LogGoalValueRequest = z.infer<typeof LogGoalValueRequestSchema>;

export const CreateMilestoneRequestSchema = z.object({
  title: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

export type CreateMilestoneRequest = z.infer<typeof CreateMilestoneRequestSchema>;

export const DeleteMilestoneResponseSchema = z.object({
  success: z.boolean(),
});

export type DeleteMilestoneResponse = z.infer<typeof DeleteMilestoneResponseSchema>;

// ─── Check-In ─────────────────────────────────────────────────────────────────

export const CheckInStatusSchema = z.enum(['completed', 'missed']);
export type CheckInStatus = z.infer<typeof CheckInStatusSchema>;
export const CheckInMoodSchema = z.enum(['great', 'okay', 'low', 'stressed']);
export type CheckInMood = z.infer<typeof CheckInMoodSchema>;
export const CheckInEnergySchema = z.enum(['high', 'medium', 'low']);
export type CheckInEnergy = z.infer<typeof CheckInEnergySchema>;
export const CheckInBlockerSchema = z.enum([
  'lack_of_time',
  'low_motivation',
  'too_distracted',
  'unclear_plan',
  'other',
]);
export type CheckInBlocker = z.infer<typeof CheckInBlockerSchema>;

export const CheckInSchema = z.object({
  id: z.string(),
  userId: z.string(),
  habitId: z.string(),
  status: CheckInStatusSchema,
  mood: optionalEnum(CheckInMoodSchema),
  energy: optionalEnum(CheckInEnergySchema),
  blocker: optionalEnum(CheckInBlockerSchema),
  note: z.string().max(2000).optional(),
  createdAt: z.string(),
});

export type CheckIn = z.infer<typeof CheckInSchema>;

export const CreateCheckInRequestSchema = z.object({
  habitId: z.string(),
  status: CheckInStatusSchema,
  mood: CheckInMoodSchema.optional(),
  energy: CheckInEnergySchema.optional(),
  blocker: CheckInBlockerSchema.optional(),
  note: z.string().max(2000).optional(),
});

export type CreateCheckInRequest = z.infer<typeof CreateCheckInRequestSchema>;

export const CreateCheckInResponseSchema = z.object({
  checkIn: CheckInSchema,
  habit: HabitSchema,
  aiFeedback: z.string().optional(),
});

export type CreateCheckInResponse = z.infer<typeof CreateCheckInResponseSchema>;

export const CheckInsResponseSchema = z.union([
  ApiResponseSchema(z.array(CheckInSchema)),
  z.object({ checkIns: z.array(CheckInSchema) }).transform((v) => ({ data: v.checkIns })),
]);

export type CheckInsResponse = z.infer<typeof CheckInsResponseSchema>;

export const DeleteCheckInResponseSchema = z.object({
  habit: HabitSchema,
});

export type DeleteCheckInResponse = z.infer<typeof DeleteCheckInResponseSchema>;

// ─── Category ─────────────────────────────────────────────────────────────────

export const EntityTypeSchema = z.enum(['article', 'habit', 'goal']);

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  entityType: EntityTypeSchema.optional().or(z.literal('').transform(() => undefined)),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Category = z.infer<typeof CategorySchema>;

export const CategoriesResponseSchema = ApiResponseSchema(z.array(CategorySchema));

export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;

// ─── Settings ─────────────────────────────────────────────────────────────────

export const SettingsSchema = z.object({
  id: z.string(),
  theme: z.preprocess((v) => (v === '' ? 'system' : v), z.enum(['light', 'dark', 'system'])),
  language: z.string(),
  timezone: z.string(),
  accountabilityStyle: z.preprocess(
    (v) => (v === '' ? 'balanced' : v),
    z.enum(['gentle', 'balanced', 'strict']),
  ),
  checkInTime: z.string(),
  onboardingCompleted: z.boolean(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const SettingsResponseSchema = ApiResponseSchema(SettingsSchema);

export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;

export const UpdateSettingsRequestSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  accountabilityStyle: z.enum(['gentle', 'balanced', 'strict']).optional(),
  checkInTime: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>;

// ─── Onboarding habit generation ──────────────────────────────────────────────

export const GenerateOnboardingHabitsRequestSchema = z.object({
  goalTitle: z.string().min(1).max(200),
  goalCategory: z.string().max(100).optional(),
  motivation: z.string().max(500).optional(),
  blocker: z.string().max(500).optional(),
  dailyMinutes: z.number().int().min(1).max(600),
  accountabilityStyle: z.enum(['gentle', 'balanced', 'strict']).optional(),
});

export type GenerateOnboardingHabitsRequest = z.infer<typeof GenerateOnboardingHabitsRequestSchema>;

export const OnboardingHabitSuggestionSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export type OnboardingHabitSuggestion = z.infer<typeof OnboardingHabitSuggestionSchema>;

export const GenerateOnboardingHabitsResponseSchema = ApiResponseSchema(
  z.array(OnboardingHabitSuggestionSchema),
);

export type GenerateOnboardingHabitsResponse = z.infer<
  typeof GenerateOnboardingHabitsResponseSchema
>;

// ─── Activity ─────────────────────────────────────────────────────────────────

export const ActivitySchema = z.object({
  id: z.string(),
  itemType: z.string(),
  title: z.string(),
  description: z.string(),
  metadata: z.string().optional(),
  userId: z.string(),
  createdAt: z.string(),
});

export type Activity = z.infer<typeof ActivitySchema>;

export const ActivityResponseSchema = ApiResponseSchema(z.array(ActivitySchema)).extend({
  page: PageResponseSchema,
});

export type ActivityResponse = z.infer<typeof ActivityResponseSchema>;

// ─── Weekly Review ────────────────────────────────────────────────────────────

export const WeeklyReviewHabitBreakdownSchema = z.object({
  habitId: z.string(),
  habitName: z.string(),
  category: z.string().optional(),
  totalCheckIns: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  missedCount: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(1),
  lastCheckInAt: z.string().optional(),
});

export type WeeklyReviewHabitBreakdown = z.infer<typeof WeeklyReviewHabitBreakdownSchema>;

export const WeeklyReviewAdjustmentSchema = z.object({
  habitId: z.string().optional(),
  habitName: z.string(),
  adjustmentType: z.string(),
  reason: z.string(),
  suggestion: z.string(),
});

export type WeeklyReviewAdjustment = z.infer<typeof WeeklyReviewAdjustmentSchema>;

export const WeeklyReviewNextWeekPlanSchema = z.object({
  focus: z.string(),
  commitments: z.array(z.string()),
  risks: z.array(z.string()),
  recoveryActions: z.array(z.string()),
});

export type WeeklyReviewNextWeekPlan = z.infer<typeof WeeklyReviewNextWeekPlanSchema>;

export const WeeklyReviewSchema = z.object({
  id: z.string(),
  userId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  totalHabits: z.number().int().nonnegative(),
  completedCheckIns: z.number().int().nonnegative(),
  missedCheckIns: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(1),
  bestDay: z.string().optional(),
  hardestDay: z.string().optional(),
  topBlocker: z.string().optional(),
  moodSummary: z.record(z.string(), z.number().int().nonnegative()),
  energySummary: z.record(z.string(), z.number().int().nonnegative()),
  habitBreakdown: z.array(WeeklyReviewHabitBreakdownSchema),
  aiSummary: z.string().optional(),
  suggestedAdjustments: z.array(WeeklyReviewAdjustmentSchema),
  nextWeekPlan: WeeklyReviewNextWeekPlanSchema,
  generatedAt: z.string(),
});

export type WeeklyReview = z.infer<typeof WeeklyReviewSchema>;

export const WeeklyReviewResponseSchema = ApiResponseSchema(WeeklyReviewSchema);

export type WeeklyReviewResponse = z.infer<typeof WeeklyReviewResponseSchema>;

export const WeeklyReviewsResponseSchema = ApiResponseSchema(z.array(WeeklyReviewSchema)).extend({
  page: PageResponseSchema,
});

export type WeeklyReviewsResponse = z.infer<typeof WeeklyReviewsResponseSchema>;

export const GenerateWeeklyReviewRequestSchema = z.object({
  weekStart: z.string().optional(),
  forceRegenerate: z.boolean().optional(),
});

export type GenerateWeeklyReviewRequest = z.infer<typeof GenerateWeeklyReviewRequestSchema>;

// ─── Notifications ────────────────────────────────────────────────────────────

export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  read: z.boolean(),
  userId: z.string(),
  createdAt: z.string(),
  destination: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationsResponseSchema = ApiResponseSchema(z.array(NotificationSchema)).extend({
  page: PageResponseSchema,
});

export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;

export const UnreadNotificationCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type UnreadNotificationCountResponse = z.infer<typeof UnreadNotificationCountResponseSchema>;

export const NotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  habitRemindersEnabled: z.boolean(),
  goalRemindersEnabled: z.boolean(),
  streakWarningsEnabled: z.boolean(),
  sundayReviewEnabled: z.boolean(),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

export const NotificationPreferencesResponseSchema = z.object({
  preferences: NotificationPreferencesSchema,
});

export type NotificationPreferencesResponse = z.infer<typeof NotificationPreferencesResponseSchema>;

export const UpdateNotificationPreferencesRequestSchema = z.object({
  preferences: NotificationPreferencesSchema,
});

export type UpdateNotificationPreferencesRequest = z.infer<
  typeof UpdateNotificationPreferencesRequestSchema
>;

// ─── Articles ─────────────────────────────────────────────────────────────────

export const ArticleCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export type ArticleCategory = z.infer<typeof ArticleCategorySchema>;

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  category: ArticleCategorySchema.nullable().optional(),
  readTime: z.number().int().nonnegative(),
  imageUrl: z.string(),
  author: z.string(),
  publishedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isSaved: z.boolean(),
  likeCount: z.number().int().nonnegative(),
  isLiked: z.boolean(),
  tags: z.preprocess((v) => v ?? [], z.array(z.string()).optional()),
});

export type Article = z.infer<typeof ArticleSchema>;

export const ArticleResponseSchema = ApiResponseSchema(ArticleSchema);

export type ArticleResponse = z.infer<typeof ArticleResponseSchema>;

export const ArticlesResponseSchema = ApiResponseSchema(z.array(ArticleSchema)).extend({
  page: PageResponseSchema,
});

export type ArticlesResponse = z.infer<typeof ArticlesResponseSchema>;

export const ListArticlesRequestSchema = z.object({
  categorySlug: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type ListArticlesRequest = z.infer<typeof ListArticlesRequestSchema>;

export const LikeArticleResponseSchema = z.object({
  success: z.boolean(),
  newLikeCount: z.number().int().nonnegative(),
  isLiked: z.boolean(),
});

export type LikeArticleResponse = z.infer<typeof LikeArticleResponseSchema>;

export const ShareArticleResponseSchema = z.object({
  success: z.boolean(),
});

export type ShareArticleResponse = z.infer<typeof ShareArticleResponseSchema>;

// ─── Saved items ──────────────────────────────────────────────────────────────

export const SavedItemTypeSchema = z.enum(['article', 'goal', 'habit']);

export type SavedItemType = z.infer<typeof SavedItemTypeSchema>;

export const SavedItemSchema = z.object({
  id: z.string(),
  itemType: SavedItemTypeSchema,
  itemId: z.string(),
  userId: z.string(),
  createdAt: z.string(),
});

export type SavedItem = z.infer<typeof SavedItemSchema>;

export const SavedItemResponseSchema = ApiResponseSchema(SavedItemSchema);

export type SavedItemResponse = z.infer<typeof SavedItemResponseSchema>;

export const SavedItemsResponseSchema = ApiResponseSchema(z.array(SavedItemSchema)).extend({
  page: PageResponseSchema,
});

export type SavedItemsResponse = z.infer<typeof SavedItemsResponseSchema>;

export const SavedItemDetailedSchema = z.object({
  id: z.string(),
  itemType: SavedItemTypeSchema,
  itemId: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  article: ArticleSchema.nullable().optional(),
  habit: HabitSchema.nullable().optional(),
  goal: GoalSchema.nullable().optional(),
});

export type SavedItemDetailed = z.infer<typeof SavedItemDetailedSchema>;

export const SavedItemsDetailedResponseSchema = ApiResponseSchema(
  z.array(SavedItemDetailedSchema),
).extend({
  page: PageResponseSchema,
});

export type SavedItemsDetailedResponse = z.infer<typeof SavedItemsDetailedResponseSchema>;

export const SaveItemRequestSchema = z.object({
  itemType: SavedItemTypeSchema,
  itemId: z.string().min(1),
});

export type SaveItemRequest = z.infer<typeof SaveItemRequestSchema>;

// ─── Search ───────────────────────────────────────────────────────────────────

export const SearchResultSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  score: z.number(),
  highlight: z.string().optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchResponseSchema = ApiResponseSchema(z.array(SearchResultSchema)).extend({
  page: PageResponseSchema,
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export const SearchRequestSchema = z.object({
  q: z.string().min(1),
  itemType: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

// ─── Templates ────────────────────────────────────────────────────────────────

export const TemplateCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
});

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

export const HabitTemplateItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: TemplateCategorySchema.nullable().optional(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type HabitTemplateItem = z.infer<typeof HabitTemplateItemSchema>;

export const HabitTemplatesResponseSchema = ApiResponseSchema(z.array(HabitTemplateItemSchema));

export type HabitTemplatesResponse = z.infer<typeof HabitTemplatesResponseSchema>;

export const GoalTemplateItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: TemplateCategorySchema.nullable().optional(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GoalTemplateItem = z.infer<typeof GoalTemplateItemSchema>;

export const GoalTemplatesResponseSchema = ApiResponseSchema(z.array(GoalTemplateItemSchema));

export type GoalTemplatesResponse = z.infer<typeof GoalTemplatesResponseSchema>;

// ─── Conversations (AI coach) ─────────────────────────────────────────────────

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  lastMessage: z.string(),
  userId: z.string().optional(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const ConversationMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  createdAt: z.string(),
});

export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const StartConversationRequestSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  initialMessage: z.string().optional(),
});

export type StartConversationRequest = z.infer<typeof StartConversationRequestSchema>;

export const StartConversationResponseSchema = z.object({
  data: ConversationSchema,
  initialMessage: ConversationMessageSchema.nullable().optional(),
});

export type StartConversationResponse = z.infer<typeof StartConversationResponseSchema>;

export const ListConversationsResponseSchema = ApiResponseSchema(
  z.array(ConversationSchema),
).extend({
  page: PageResponseSchema,
});

export type ListConversationsResponse = z.infer<typeof ListConversationsResponseSchema>;

export const GetConversationResponseSchema = z.object({
  data: ConversationSchema,
});

export type GetConversationResponse = z.infer<typeof GetConversationResponseSchema>;

export const GetMessagesResponseSchema = ApiResponseSchema(
  z.array(ConversationMessageSchema),
).extend({
  page: PageResponseSchema,
});

export type GetMessagesResponse = z.infer<typeof GetMessagesResponseSchema>;

export const AppendMessageRequestSchema = z.object({
  content: z.string().min(1),
  role: z.string().optional(),
});

export type AppendMessageRequest = z.infer<typeof AppendMessageRequestSchema>;

export const AppendMessageResponseSchema = z.object({
  data: ConversationMessageSchema,
  conversation: ConversationSchema,
});

export type AppendMessageResponse = z.infer<typeof AppendMessageResponseSchema>;

// ─── Data export ──────────────────────────────────────────────────────────────

export const ExportDataResponseSchema = z.object({
  downloadUrl: z.string().url(),
});

export type ExportDataResponse = z.infer<typeof ExportDataResponseSchema>;

// ─── Coaching profile ─────────────────────────────────────────────────────────

export const AccountabilityStyleSchema = z.enum(['gentle', 'balanced', 'strict']);
export type AccountabilityStyle = z.infer<typeof AccountabilityStyleSchema>;

export const PreferredToneSchema = z.enum([
  'supportive',
  'direct',
  'warm',
  'practical',
  'challenging',
]);
export type PreferredTone = z.infer<typeof PreferredToneSchema>;

export const DifficultyPreferenceSchema = z.enum(['easy', 'adaptive', 'ambitious']);
export type DifficultyPreference = z.infer<typeof DifficultyPreferenceSchema>;

export const CoachingProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  accountabilityStyle: AccountabilityStyleSchema,
  preferredTone: PreferredToneSchema,
  difficultyPreference: DifficultyPreferenceSchema,
  primaryMotivation: z.string().optional(),
  commonBlockers: z.array(z.string()).optional(),
  coachingNotes: z.record(z.string(), z.string()).optional(),
  lastContextRefreshAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CoachingProfile = z.infer<typeof CoachingProfileSchema>;

export const CoachingProfileResponseSchema = ApiResponseSchema(CoachingProfileSchema);
export type CoachingProfileResponse = z.infer<typeof CoachingProfileResponseSchema>;

export const UpdateCoachingProfilePreferencesRequestSchema = z.object({
  accountabilityStyle: AccountabilityStyleSchema,
  preferredTone: PreferredToneSchema,
  difficultyPreference: DifficultyPreferenceSchema,
});

export type UpdateCoachingProfilePreferencesRequest = z.infer<
  typeof UpdateCoachingProfilePreferencesRequestSchema
>;

// ─── Plan adjustment suggestions ──────────────────────────────────────────────
// Backend contract: /personalization/plan-adjustments (see generated api-types).
// The AI coach produces suggestions to adjust the user's plan (reduce difficulty,
// change time, pause a habit, etc.). The user can accept/dismiss the suggestion
// or apply it (apply mutates the underlying habit/goal).

export const AdjustmentTypeSchema = z.enum([
  'reduce_difficulty',
  'increase_difficulty',
  'change_time',
  'clarify_plan',
  'pause',
  'keep_same',
]);
export type AdjustmentType = z.infer<typeof AdjustmentTypeSchema>;

export const SuggestionStatusSchema = z.enum(['pending', 'accepted', 'dismissed', 'applied']);
export type SuggestionStatus = z.infer<typeof SuggestionStatusSchema>;

export const SuggestionSourceSchema = z.enum([
  'check_in',
  'weekly_review',
  'assistant',
  'pattern_analysis',
]);
export type SuggestionSource = z.infer<typeof SuggestionSourceSchema>;

export const PlanAdjustmentSuggestionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  goalId: z.string().optional(),
  habitId: z.string().optional(),
  source: SuggestionSourceSchema,
  adjustmentType: AdjustmentTypeSchema,
  reason: z.string().optional(),
  suggestion: z.string(),
  status: SuggestionStatusSchema,
  metadata: z.record(z.string(), z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PlanAdjustmentSuggestion = z.infer<typeof PlanAdjustmentSuggestionSchema>;

export const PlanAdjustmentSuggestionsResponseSchema = ApiResponseSchema(
  z.array(PlanAdjustmentSuggestionSchema),
);
export type PlanAdjustmentSuggestionsResponse = z.infer<
  typeof PlanAdjustmentSuggestionsResponseSchema
>;

export const PlanAdjustmentSuggestionResponseSchema = ApiResponseSchema(
  PlanAdjustmentSuggestionSchema,
);
export type PlanAdjustmentSuggestionResponse = z.infer<
  typeof PlanAdjustmentSuggestionResponseSchema
>;

export const UpdatePlanAdjustmentSuggestionStatusRequestSchema = z.object({
  status: SuggestionStatusSchema,
});
export type UpdatePlanAdjustmentSuggestionStatusRequest = z.infer<
  typeof UpdatePlanAdjustmentSuggestionStatusRequestSchema
>;

// ─── File upload ──────────────────────────────────────────────────────────────

export const UploadResponseSchema = z.object({
  url: z.string(),
  key: z.string(),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

// ─── Memory Facts (curated long-term memory) ──────────────────────────────────

export const MemoryFactCategorySchema = z.enum([
  'commitment',
  'preference',
  'constraint',
  'context',
]);

export type MemoryFactCategory = z.infer<typeof MemoryFactCategorySchema>;

export const MemoryFactSchema = z.object({
  id: z.string(),
  fact: z.string(),
  category: MemoryFactCategorySchema,
  confidence: z.number(),
  userAuthored: z.boolean(),
  createdAt: z.string(),
});

export type MemoryFact = z.infer<typeof MemoryFactSchema>;

export const ListMemoryFactsResponseSchema = ApiResponseSchema(z.array(MemoryFactSchema)).extend({
  page: PageResponseSchema,
});

export type ListMemoryFactsResponse = z.infer<typeof ListMemoryFactsResponseSchema>;

export const MemoryFactResponseSchema = ApiResponseSchema(MemoryFactSchema);

export type MemoryFactResponse = z.infer<typeof MemoryFactResponseSchema>;

export const AddMemoryFactRequestSchema = z.object({
  fact: z.string().min(1).max(500),
  category: MemoryFactCategorySchema,
  supersedesId: z.string().optional(),
});

export type AddMemoryFactRequest = z.infer<typeof AddMemoryFactRequestSchema>;

export const ForgetAllMemoryFactsResponseSchema = ApiResponseSchema(
  z.object({ forgotten: z.boolean() }),
);

export type ForgetAllMemoryFactsResponse = z.infer<typeof ForgetAllMemoryFactsResponseSchema>;

// ─── Personalization / coaching ───────────────────────────────────────────────

/**
 * Coaching attachment — matches the backend `Attachment` type.
 *
 * `data` is a base64-encoded string (no data-URL prefix). Images and PDFs are
 * sent as base64 in the coaching-stream JSON body; text documents are inlined
 * into the user message by the caller instead.
 */
export const CoachingAttachmentSchema = z.object({
  attachmentType: z.enum(['image', 'document']),
  name: z.string(),
  contentType: z.string(),
  data: z.string(),
});

export type CoachingAttachment = z.infer<typeof CoachingAttachmentSchema>;

export const GeneratePersonalizedCoachingRequestSchema = z.object({
  userMessage: z.string().min(1),
  context: z.string().optional(),
  conversationId: z.string().optional(),
  goalId: z.string().optional(),
  attachments: z.array(CoachingAttachmentSchema).optional(),
  regenerate: z.boolean().optional(),
  // Makes the user turn idempotent so a retry does not create a second copy.
  clientMessageId: z.string().optional(),
});

export type GeneratePersonalizedCoachingRequest = z.infer<
  typeof GeneratePersonalizedCoachingRequestSchema
>;

// ─── Billing / entitlements ───────────────────────────────────────────────────

export const PlanSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priceMonthlyCents: z.number().int(),
  priceAnnualCents: z.number().int(),
  activeGoalLimit: z.number().int().optional(),
  activeHabitLimit: z.number().int().optional(),
  weeklyReviewHistoryLimit: z.number().int().optional(),
  planAdjustmentLimit: z.number().int().optional(),
  personalizedAiEnabled: z.boolean(),
  isActive: z.boolean(),
});

export type Plan = z.infer<typeof PlanSchema>;

export const UserSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  planCode: z.string(),
  planName: z.string(),
  status: z.string(),
  billingInterval: z.string().optional(),
  currentPeriodStart: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
  trialEnd: z.string().optional(),
  cancelAtPeriodEnd: z.boolean(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
});

export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;

export const EntitlementsSchema = z.object({
  planCode: z.string(),
  status: z.string(),
  activeGoalLimit: z.number().int().optional(),
  activeHabitLimit: z.number().int().optional(),
  weeklyReviewHistoryLimit: z.number().int().optional(),
  planAdjustmentLimit: z.number().int().optional(),
  personalizedAiEnabled: z.boolean(),
  canCreateGoal: z.boolean(),
  canCreateHabit: z.boolean(),
  canViewWeeklyReviewHistory: z.boolean(),
  canUsePersonalizedAi: z.boolean(),
  canCreatePlanAdjustment: z.boolean(),
  currentActiveGoals: z.number().int(),
  currentActiveHabits: z.number().int(),
  currentPendingAdjustments: z.number().int(),
});

export type Entitlements = z.infer<typeof EntitlementsSchema>;

export const BillingOverviewResponseSchema = z.object({
  plans: z.array(PlanSchema),
  subscription: UserSubscriptionSchema,
  entitlements: EntitlementsSchema,
  billingMode: z.string(),
});

export type BillingOverviewResponse = z.infer<typeof BillingOverviewResponseSchema>;

// ─── Billing checkout / portal / upgrade events ───────────────────────────────

export const CreateCheckoutSessionRequestSchema = z.object({
  planCode: z.string().min(1),
  billingInterval: z.string().min(1),
});

export type CreateCheckoutSessionRequest = z.infer<typeof CreateCheckoutSessionRequestSchema>;

export const CreateCheckoutSessionResponseSchema = z.object({
  checkoutUrl: z.string().url().optional(),
  sessionId: z.string().optional(),
});

export type CreateCheckoutSessionResponse = z.infer<typeof CreateCheckoutSessionResponseSchema>;

export const CreateCustomerPortalSessionResponseSchema = z.object({
  portalUrl: z.string().url().optional(),
});

export type CreateCustomerPortalSessionResponse = z.infer<
  typeof CreateCustomerPortalSessionResponseSchema
>;

export const TrackUpgradeEventRequestSchema = z.object({
  eventType: z.string().min(1),
  surface: z.string().min(1),
  planCode: z.string().optional(),
  billingInterval: z.string().optional(),
  trigger: z.string().optional(),
  feedbackReason: z.string().optional(),
  feedbackNote: z.string().optional(),
  metadataJson: z.string().optional(),
});

export type TrackUpgradeEventRequest = z.infer<typeof TrackUpgradeEventRequestSchema>;

export const TrackUpgradeEventResponseSchema = z.object({
  eventId: z.string().optional(),
});

export type TrackUpgradeEventResponse = z.infer<typeof TrackUpgradeEventResponseSchema>;

// ─── Push device registration ──────────────────────────────────────────────────

export const RegisterDeviceRequestSchema = z.object({
  pushToken: z.string().min(1),
  provider: z.string().min(1),
  platform: z.string().min(1),
  environment: z.string().min(1),
  appId: z.string().optional(),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export type RegisterDeviceRequest = z.infer<typeof RegisterDeviceRequestSchema>;

export const UnregisterDeviceRequestSchema = z.object({});

export type UnregisterDeviceRequest = z.infer<typeof UnregisterDeviceRequestSchema>;

// ─── Report ────────────────────────────────────────────────────────────────────

export const ReportTypeSchema = z.enum(['bug', 'feedback', 'abuse']);

export type ReportType = z.infer<typeof ReportTypeSchema>;

export const ReportRequestSchema = z.object({
  type: ReportTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  email: z.string().email().optional(),
});

export type ReportRequest = z.infer<typeof ReportRequestSchema>;
