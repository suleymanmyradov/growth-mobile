/**
 * Onboarding wizard — seven-step flow.
 *
 * Steps mirror the web frontend's `components/onboarding/onboarding-client.tsx`:
 * 1. Goal title + category
 * 2. Motivation
 * 3. Blockers
 * 4. Daily time commitment
 * 5. Accountability style
 * 6. Check-in time
 * 7. AI habit suggestions (generate on enter, submit on finish)
 *
 * Submission is duplicate-safe via a ref guard in the submission hook.
 *
 * Paper (`mobile.md` §8.8): one logical step per screen, back action, a single
 * progress line, `n/7` step count, persistent Continue action. Step titles use
 * the `onboardingTitle` variant (30/38). Auth/onboarding gutter is 24. Keyboard
 * avoidance is handled by the scroll view. All seven contract-required fields
 * are preserved — changing the step contract requires an approved product/
 * backend change.
 */
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, Input, ProgressBar, Screen, Spinner, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useCategories } from '@/features/categories';

import { useGenerateOnboardingHabits, useSubmitOnboarding } from '../hooks';
import {
  ACCOUNTABILITY_STYLES,
  BLOCKER_OPTIONS,
  CHECK_IN_HOURS,
  DAILY_COMMITMENT_OPTIONS,
  TOTAL_STEPS,
  useOnboardingStore,
} from '../store';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();

  const step = useOnboardingStore((s) => s.step);
  const data = useOnboardingStore((s) => s.data);
  const loadingHabits = useOnboardingStore((s) => s.loadingHabits);
  const error = useOnboardingStore((s) => s.error);
  const updateField = useOnboardingStore((s) => s.updateField);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const toggleHabitSelection = useOnboardingStore((s) => s.toggleHabitSelection);
  const hydrate = useOnboardingStore((s) => s.hydrate);

  const { data: categories = [] } = useCategories('goal');
  const { generate } = useGenerateOnboardingHabits();
  const submit = useSubmitOnboarding();

  // Hydrate persisted draft on mount.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const styleLabels: Record<string, string> = {
    gentle: t('onboarding.styleGentle'),
    balanced: t('onboarding.styleBalanced'),
    strict: t('onboarding.styleStrict'),
  };
  const styleDescs: Record<string, string> = {
    gentle: t('onboarding.styleGentleDesc'),
    balanced: t('onboarding.styleBalancedDesc'),
    strict: t('onboarding.styleStrictDesc'),
  };
  const styleTones: Record<string, string> = {
    gentle: t('onboarding.styleGentleTone'),
    balanced: t('onboarding.styleBalancedTone'),
    strict: t('onboarding.styleStrictTone'),
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return data.goalTitle.trim().length >= 3;
      case 2:
        return data.motivation.trim().length >= 3;
      case 7:
        return data.habitSuggestions.some((h) => h.selected);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step === 6) {
      await generate(data);
    }
    nextStep();
  };

  const handleFinish = () => {
    submit.mutate(data);
  };

  const progressValue = (step - 1) / (TOTAL_STEPS - 1);

  return (
    <Screen onBack={step > 1 ? prevStep : undefined}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingVertical: spacing.lg,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress line + step count */}
          <ProgressBar value={progressValue} style={{ marginBottom: spacing.sm }} />
          <ThemedText
            variant="meta"
            style={{ color: colors.mutedForeground, marginBottom: spacing.lg }}
          >
            {t('onboarding.stepOf', { step, total: TOTAL_STEPS })}
          </ThemedText>

          <View style={{ gap: spacing.md, flex: 1 }}>
            {/* Step 1: Goal title + category */}
            {step === 1 && (
              <View style={{ gap: spacing.md }}>
                <View>
                  <ThemedText variant="onboardingTitle">{t('onboarding.step1Title')}</ThemedText>
                  <ThemedText
                    variant="body"
                    style={{ color: colors.mutedForeground, marginTop: spacing.xs }}
                  >
                    {t('onboarding.step1Subtitle')}
                  </ThemedText>
                </View>
                <Input
                  label={t('onboarding.goalLabel')}
                  placeholder={t('onboarding.goalPlaceholder')}
                  value={data.goalTitle}
                  onChangeText={(v) => updateField('goalTitle', v)}
                  accessibilityLabel={t('onboarding.goalLabel')}
                />
                <View>
                  <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
                    {t('onboarding.categoryLabel')}
                  </ThemedText>
                  <View style={styles.optionGrid}>
                    {categories.length === 0 ? (
                      <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                        {t('onboarding.loadingCategories')}
                      </ThemedText>
                    ) : (
                      categories.map((cat) => (
                        <OptionChip
                          key={cat.slug}
                          label={cat.name}
                          selected={data.goalCategory === cat.slug}
                          onPress={() => updateField('goalCategory', cat.slug)}
                          colors={colors}
                          radius={radius}
                        />
                      ))
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Step 2: Motivation */}
            {step === 2 && (
              <View style={{ gap: spacing.md }}>
                <View>
                  <ThemedText variant="onboardingTitle">{t('onboarding.step2Title')}</ThemedText>
                  <ThemedText
                    variant="body"
                    style={{ color: colors.mutedForeground, marginTop: spacing.xs }}
                  >
                    {t('onboarding.step2Subtitle')}
                  </ThemedText>
                </View>
                <Input
                  label={t('onboarding.motivationLabel')}
                  placeholder={t('onboarding.motivationPlaceholder')}
                  value={data.motivation}
                  onChangeText={(v) => updateField('motivation', v)}
                  multiline
                  numberOfLines={4}
                  accessibilityLabel={t('onboarding.motivationLabel')}
                />
              </View>
            )}

            {/* Step 3: Blockers */}
            {step === 3 && (
              <View style={{ gap: spacing.md }}>
                <View>
                  <ThemedText variant="onboardingTitle">{t('onboarding.step3Title')}</ThemedText>
                  <ThemedText
                    variant="body"
                    style={{ color: colors.mutedForeground, marginTop: spacing.xs }}
                  >
                    {t('onboarding.step3Subtitle')}
                  </ThemedText>
                </View>
                <View style={{ gap: spacing.sm }}>
                  {BLOCKER_OPTIONS.map((option) => {
                    const label =
                      option === 'Lack of time'
                        ? t('onboarding.blockerLackOfTime')
                        : option === 'Low motivation'
                          ? t('onboarding.blockerLowMotivation')
                          : option === 'Too distracted'
                            ? t('onboarding.blockerTooDistracted')
                            : option === 'Unclear plan'
                              ? t('onboarding.blockerUnclearPlan')
                              : t('onboarding.blockerOther');
                    return (
                      <OptionRow
                        key={option}
                        label={label}
                        selected={data.blocker === option}
                        onPress={() =>
                          updateField('blocker', data.blocker === option ? '' : option)
                        }
                        colors={colors}
                        radius={radius}
                      />
                    );
                  })}
                  {data.blocker === 'Other' && (
                    <Input
                      placeholder={t('onboarding.blockerOtherPlaceholder')}
                      value={data.blocker === 'Other' ? '' : data.blocker}
                      onChangeText={(v) => updateField('blocker', v)}
                    />
                  )}
                </View>
              </View>
            )}

            {/* Step 4: Daily time commitment */}
            {step === 4 && (
              <View style={{ gap: spacing.md }}>
                <View>
                  <ThemedText variant="onboardingTitle">{t('onboarding.step4Title')}</ThemedText>
                  <ThemedText
                    variant="body"
                    style={{ color: colors.mutedForeground, marginTop: spacing.xs }}
                  >
                    {t('onboarding.step4Subtitle')}
                  </ThemedText>
                </View>
                <View style={styles.optionGrid}>
                  {DAILY_COMMITMENT_OPTIONS.map(({ value, label }) => (
                    <OptionChip
                      key={value}
                      label={label}
                      selected={data.dailyMinutes === value}
                      onPress={() => updateField('dailyMinutes', value)}
                      colors={colors}
                      radius={radius}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Step 5: Accountability style */}
            {step === 5 && (
              <View style={{ gap: spacing.md }}>
                <View>
                  <ThemedText variant="onboardingTitle">{t('onboarding.step5Title')}</ThemedText>
                  <ThemedText
                    variant="body"
                    style={{ color: colors.mutedForeground, marginTop: spacing.xs }}
                  >
                    {t('onboarding.step5Subtitle')}
                  </ThemedText>
                </View>
                <View style={{ gap: spacing.sm }}>
                  {ACCOUNTABILITY_STYLES.map((style) => (
                    <Pressable
                      key={style}
                      onPress={() => updateField('accountabilityStyle', style)}
                      accessibilityRole="button"
                      accessibilityLabel={styleLabels[style]}
                      style={[
                        {
                          borderWidth: 1,
                          borderRadius: radius.card,
                          padding: spacing.md,
                          borderColor:
                            data.accountabilityStyle === style ? colors.accent : colors.border,
                          backgroundColor:
                            data.accountabilityStyle === style ? colors.successSoft : 'transparent',
                        },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <ThemedText variant="label" style={{ fontWeight: '600' }}>
                          {styleLabels[style]}
                        </ThemedText>
                        {data.accountabilityStyle === style && (
                          <Check color={colors.accent} size={16} />
                        )}
                      </View>
                      <ThemedText
                        variant="caption"
                        style={{ color: colors.mutedForeground, marginBottom: 8 }}
                      >
                        {styleDescs[style]}
                      </ThemedText>
                      <ThemedText
                        variant="caption"
                        style={{
                          color: colors.mutedForeground,
                          fontStyle: 'italic',
                          borderTopColor: colors.border,
                          borderTopWidth: StyleSheet.hairlineWidth,
                          paddingTop: 8,
                        }}
                      >
                        &ldquo;{styleTones[style]}&rdquo;
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Step 6: Check-in time */}
            {step === 6 && (
              <View style={{ gap: spacing.md }}>
                <View>
                  <ThemedText variant="onboardingTitle">{t('onboarding.step6Title')}</ThemedText>
                  <ThemedText
                    variant="body"
                    style={{ color: colors.mutedForeground, marginTop: spacing.xs }}
                  >
                    {t('onboarding.step6Subtitle')}
                  </ThemedText>
                </View>
                <ThemedText variant="label">{t('onboarding.checkInTimeLabel')}</ThemedText>
                <View style={styles.timeGrid}>
                  {CHECK_IN_HOURS.map((hour) => (
                    <OptionChip
                      key={hour}
                      label={hour}
                      selected={data.checkInTime === hour}
                      onPress={() => updateField('checkInTime', hour)}
                      colors={colors}
                      radius={radius}
                      compact
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Step 7: AI habit suggestions */}
            {step === 7 && (
              <View style={{ gap: spacing.md, flex: 1 }}>
                <View>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}
                  >
                    <Sparkles color={colors.accent} size={20} />
                    <ThemedText variant="onboardingTitle">{t('onboarding.step7Title')}</ThemedText>
                  </View>
                  <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
                    {t('onboarding.step7Subtitle')}
                  </ThemedText>
                </View>

                {loadingHabits ? (
                  <Spinner label={t('onboarding.buildingPlan')} />
                ) : (
                  <View style={{ gap: spacing.sm }}>
                    {data.habitSuggestions.map((habit, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => toggleHabitSelection(idx)}
                        accessibilityRole="button"
                        accessibilityLabel={habit.name}
                        style={[
                          {
                            borderWidth: 1,
                            borderRadius: radius.card,
                            padding: spacing.md,
                            borderColor: habit.selected ? colors.accent : colors.border,
                            backgroundColor: habit.selected ? colors.successSoft : 'transparent',
                            opacity: habit.selected ? 1 : 0.6,
                          },
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                          <View
                            style={[
                              {
                                width: 20,
                                height: 20,
                                borderWidth: 1,
                                borderRadius: 4,
                                borderColor: habit.selected
                                  ? colors.accent
                                  : colors.mutedForeground,
                                backgroundColor: habit.selected ? colors.accent : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 2,
                              },
                            ]}
                          >
                            {habit.selected && <Check color={colors.accentForeground} size={14} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <ThemedText variant="label" style={{ fontWeight: '600' }}>
                              {habit.name}
                            </ThemedText>
                            <ThemedText
                              variant="caption"
                              style={{ color: colors.mutedForeground, marginTop: 2 }}
                            >
                              {habit.description}
                            </ThemedText>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}

                <View
                  style={{
                    backgroundColor: colors.muted,
                    borderRadius: radius.field,
                    padding: spacing.sm,
                  }}
                >
                  <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                    <ThemedText variant="caption" style={{ fontWeight: '600' }}>
                      {t('onboarding.yourPlan')}
                      {': '}
                    </ThemedText>
                    {data.goalTitle}
                    {' · '}
                    {t('onboarding.minutesPerDay', { minutes: data.dailyMinutes })}
                    {' · '}
                    {styleLabels[data.accountabilityStyle]}
                    {' · '}
                    {data.checkInTime}
                  </ThemedText>
                </View>

                {error ? (
                  <ThemedText
                    variant="bodySmall"
                    style={{ color: colors.destructive }}
                    accessibilityRole="alert"
                  >
                    {error}
                  </ThemedText>
                ) : null}
              </View>
            )}

            {/* Navigation */}
            <View style={[styles.nav, { gap: spacing.sm }]}>
              <Button
                variant="ghost"
                size="sm"
                onPress={prevStep}
                disabled={step === 1 || submit.isPending || loadingHabits}
              >
                <ArrowLeft color={colors.foreground} size={16} /> {t('common.back')}
              </Button>

              {step < TOTAL_STEPS ? (
                <Button
                  onPress={handleNext}
                  disabled={!canProceed() || loadingHabits}
                  loading={loadingHabits}
                >
                  {t('common.continue')} <ArrowRight color={colors.accentForeground} size={16} />
                </Button>
              ) : (
                <Button
                  onPress={handleFinish}
                  disabled={!canProceed() || submit.isPending || loadingHabits}
                  loading={submit.isPending}
                >
                  {submit.isPending ? t('onboarding.starting') : t('onboarding.startMyPlan')}{' '}
                  <Check color={colors.accentForeground} size={16} />
                </Button>
              )}
            </View>
          </View>

          <ThemedText
            variant="caption"
            style={{
              color: colors.mutedForeground,
              textAlign: 'center',
              marginTop: spacing.md,
            }}
          >
            {t('onboarding.changeLaterNote')}
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ─── Reusable option chips ───────────────────────────────────────────────────

type ColorTokens = {
  accent: string;
  border: string;
  background: string;
  foreground: string;
  mutedForeground: string;
  successSoft: string;
};

function OptionChip({
  label,
  selected,
  onPress,
  colors,
  radius,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ColorTokens;
  radius: { field: number; card: number };
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[
        {
          borderWidth: 1,
          borderRadius: radius.field,
          paddingVertical: compact ? 8 : 10,
          paddingHorizontal: 12,
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.successSoft : 'transparent',
        },
      ]}
    >
      <ThemedText
        variant="label"
        style={{
          color: selected ? colors.accent : colors.foreground,
          textAlign: 'center',
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
  colors,
  radius,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ColorTokens;
  radius: { field: number; card: number };
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[
        {
          borderWidth: 1,
          borderRadius: radius.field,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.successSoft : 'transparent',
        },
      ]}
    >
      <ThemedText
        variant="label"
        style={{
          color: selected ? colors.accent : colors.foreground,
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
});
