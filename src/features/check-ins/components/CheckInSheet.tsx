/**
 * CheckInSheet — a bottom sheet for the full check-in flow.
 *
 * Supports the complete check-in schema: status (completed/missed), mood,
 * energy, blocker, and note. One-tap completed remains the default on the
 * Today screen; this sheet is the optional "log details" path opened via a
 * long-press or explicit affordance on a habit row.
 *
 * Domain boundary: a presentation component owned by `features/check-ins`. It
 * receives a `Habit`, an optional existing `CheckIn` (for pre-fill), and an
 * `onSubmit` callback. It does not import hooks or stores.
 */
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type {
    CheckIn,
    CheckInBlocker,
    CheckInEnergy,
    CheckInMood,
    CheckInStatus,
    Habit,
} from '@/core/api/schemas';
import { Button, Input, Sheet, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type CheckInSubmitData = {
  habitId: string;
  status: CheckInStatus;
  mood?: CheckInMood;
  energy?: CheckInEnergy;
  blocker?: CheckInBlocker;
  note?: string;
};

export type CheckInSheetProps = {
  open: boolean;
  onClose: () => void;
  habit: Habit | null;
  /** Today's existing check-in for this habit, if any. Pre-fills the form. */
  existingCheckIn?: CheckIn | null;
  onSubmit: (data: CheckInSubmitData) => void;
  isSubmitting?: boolean;
};

type FormState = {
  status: CheckInStatus | null;
  mood: CheckInMood | null;
  energy: CheckInEnergy | null;
  blocker: CheckInBlocker | null;
  note: string;
};

const initialState: FormState = {
  status: null,
  mood: null,
  energy: null,
  blocker: null,
  note: '',
};

export function CheckInSheet({
  open,
  onClose,
  habit,
  existingCheckIn,
  onSubmit,
  isSubmitting,
}: CheckInSheetProps): ReactNode {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();

  // Initial form state is derived from `existingCheckIn` at mount time. The
  // parent remounts this component (via `key`) each time the sheet opens, so
  // the useState initializer re-runs with the correct pre-fill data. This
  // avoids setState-in-effect.
  const [form, setForm] = useState<FormState>(() =>
    existingCheckIn
      ? {
          status: existingCheckIn.status,
          mood: existingCheckIn.mood ?? null,
          energy: existingCheckIn.energy ?? null,
          blocker: existingCheckIn.blocker ?? null,
          note: existingCheckIn.note ?? '',
        }
      : { ...initialState },
  );

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canSubmit = Boolean(form.status);

  const handleSubmit = () => {
    if (!habit || !form.status) return;
    onSubmit({
      habitId: habit.id,
      status: form.status,
      mood: form.status === 'completed' ? (form.mood ?? undefined) : undefined,
      energy: form.status === 'completed' ? (form.energy ?? undefined) : undefined,
      blocker: form.status === 'missed' ? (form.blocker ?? undefined) : undefined,
      note: form.note.trim() || undefined,
    });
  };

  const moodOptions: { value: CheckInMood; label: string }[] = [
    { value: 'great', label: t('checkIns.moodGreat') },
    { value: 'okay', label: t('checkIns.moodOkay') },
    { value: 'low', label: t('checkIns.moodLow') },
    { value: 'stressed', label: t('checkIns.moodStressed') },
  ];

  const energyOptions: { value: CheckInEnergy; label: string }[] = [
    { value: 'high', label: t('checkIns.energyHigh') },
    { value: 'medium', label: t('checkIns.energyMedium') },
    { value: 'low', label: t('checkIns.energyLow') },
  ];

  const blockerOptions: { value: CheckInBlocker; label: string }[] = [
    { value: 'lack_of_time', label: t('checkIns.blockerLackOfTime') },
    { value: 'low_motivation', label: t('checkIns.blockerLowMotivation') },
    { value: 'too_distracted', label: t('checkIns.blockerTooDistracted') },
    { value: 'unclear_plan', label: t('checkIns.blockerUnclearPlan') },
    { value: 'other', label: t('checkIns.blockerOther') },
  ];

  const chipStyle = useMemo(
    () => ({
      borderWidth: 1,
      borderRadius: radius.field,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      justifyContent: 'center' as const,
    }),
    [radius.field, spacing.sm, spacing.md],
  );

  return (
    <Sheet open={open} onClose={onClose} snapPoints={['70%']}>
      <ScrollView
        contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: spacing.xs }}>
          <ThemedText variant="sectionTitle">{t('checkIns.title')}</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {t('checkIns.subtitle')}
          </ThemedText>
        </View>

        {habit ? (
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <ThemedText variant="label" numberOfLines={2}>
              {habit.name}
            </ThemedText>
          </View>
        ) : null}

        {/* Status picker */}
        {!form.status ? (
          <View style={{ gap: spacing.sm }}>
            <ThemedText variant="label">{t('checkIns.howDidItGo')}</ThemedText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                onPress={() => update('status', 'completed')}
                accessibilityRole="button"
                accessibilityLabel={t('checkIns.didIt')}
                style={[
                  chipStyle,
                  {
                    flex: 1,
                    alignItems: 'center',
                    borderColor: colors.success,
                    backgroundColor: `${colors.success}1A`,
                  },
                ]}
              >
                <ThemedText variant="label" style={{ color: colors.success }}>
                  {t('checkIns.didIt')}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => update('status', 'missed')}
                accessibilityRole="button"
                accessibilityLabel={t('checkIns.missedIt')}
                style={[
                  chipStyle,
                  {
                    flex: 1,
                    alignItems: 'center',
                    borderColor: colors.destructive,
                    backgroundColor: `${colors.destructive}1A`,
                  },
                ]}
              >
                <ThemedText variant="label" style={{ color: colors.destructive }}>
                  {t('checkIns.missedIt')}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : form.status === 'completed' ? (
          <View style={{ gap: spacing.md }}>
            {/* Mood */}
            <View style={{ gap: spacing.xs }}>
              <ThemedText variant="label">
                {t('checkIns.moodLabel')}{' '}
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  ({t('common.optional')})
                </ThemedText>
              </ThemedText>
              <View style={styles.chipRow}>
                {moodOptions.map((opt) => {
                  const selected = form.mood === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => update('mood', selected ? null : opt.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={opt.label}
                      style={[
                        chipStyle,
                        {
                          flex: 1,
                          alignItems: 'center',
                          borderColor: selected ? colors.accent : colors.border,
                          backgroundColor: selected ? `${colors.accent}1A` : 'transparent',
                        },
                      ]}
                    >
                      <ThemedText
                        variant="label"
                        style={{ color: selected ? colors.accent : colors.foreground }}
                      >
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Energy */}
            <View style={{ gap: spacing.xs }}>
              <ThemedText variant="label">
                {t('checkIns.energyLabel')}{' '}
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  ({t('common.optional')})
                </ThemedText>
              </ThemedText>
              <View style={styles.chipRow}>
                {energyOptions.map((opt) => {
                  const selected = form.energy === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => update('energy', selected ? null : opt.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={opt.label}
                      style={[
                        chipStyle,
                        {
                          flex: 1,
                          alignItems: 'center',
                          borderColor: selected ? colors.accent : colors.border,
                          backgroundColor: selected ? `${colors.accent}1A` : 'transparent',
                        },
                      ]}
                    >
                      <ThemedText
                        variant="label"
                        style={{ color: selected ? colors.accent : colors.foreground }}
                      >
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Note */}
            <Input
              label={t('checkIns.noteLabel')}
              placeholder={t('checkIns.notePlaceholder')}
              value={form.note}
              onChangeText={(v) => update('note', v)}
              multiline
              numberOfLines={3}
              accessibilityLabel={t('checkIns.noteLabel')}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button variant="outline" fullWidth onPress={() => update('status', null)}>
                {t('common.back')}
              </Button>
              <Button fullWidth loading={isSubmitting} disabled={!canSubmit} onPress={handleSubmit}>
                {t('common.save')}
              </Button>
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {/* Blocker */}
            <View style={{ gap: spacing.xs }}>
              <ThemedText variant="label">
                {t('checkIns.blockerLabel')}{' '}
                <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                  ({t('common.optional')})
                </ThemedText>
              </ThemedText>
              <View style={{ gap: spacing.xs }}>
                {blockerOptions.map((opt) => {
                  const selected = form.blocker === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => update('blocker', selected ? null : opt.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={opt.label}
                      style={[
                        chipStyle,
                        {
                          borderColor: selected ? colors.accent : colors.border,
                          backgroundColor: selected ? `${colors.accent}1A` : 'transparent',
                        },
                      ]}
                    >
                      <ThemedText
                        variant="label"
                        style={{ color: selected ? colors.accent : colors.foreground }}
                      >
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Note */}
            <Input
              label={t('checkIns.noteLabel')}
              placeholder={t('checkIns.notePlaceholder')}
              value={form.note}
              onChangeText={(v) => update('note', v)}
              multiline
              numberOfLines={3}
              accessibilityLabel={t('checkIns.noteLabel')}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button variant="outline" fullWidth onPress={() => update('status', null)}>
                {t('common.back')}
              </Button>
              <Button fullWidth loading={isSubmitting} disabled={!canSubmit} onPress={handleSubmit}>
                {t('common.save')}
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
