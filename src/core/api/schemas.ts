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

// ─── Goal ─────────────────────────────────────────────────────────────────────

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
});

export type CreateGoalRequest = z.infer<typeof CreateGoalRequestSchema>;

export const UpdateGoalRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(50).optional(),
  dueDate: z.string().optional(),
  relatedHabitIds: z.array(z.string()).optional(),
});

export type UpdateGoalRequest = z.infer<typeof UpdateGoalRequestSchema>;

// ─── Check-In ─────────────────────────────────────────────────────────────────

export const CheckInStatusSchema = z.enum(['completed', 'missed']);
export const CheckInMoodSchema = z.enum(['great', 'okay', 'low', 'stressed']);
export const CheckInEnergySchema = z.enum(['high', 'medium', 'low']);
export const CheckInBlockerSchema = z.enum([
  'lack_of_time',
  'low_motivation',
  'too_distracted',
  'unclear_plan',
  'other',
]);

/** Normalizes go-zero's empty-string serialization for optional enums. */
const optionalEnum = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

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
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  habitReminders: z.boolean(),
  goalReminders: z.boolean(),
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
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  habitReminders: z.boolean().optional(),
  goalReminders: z.boolean().optional(),
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
