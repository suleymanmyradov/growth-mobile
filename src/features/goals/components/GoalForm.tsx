/**
 * Goal form — create or edit a goal.
 *
 * Supports the full goal measurement system: binary, numeric, milestone,
 * habit, and manual. Numeric goals show start/current/target/unit inputs.
 * Milestone goals show a step editor. Habit and manual goals show linked
 * habits.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react-native';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import type { Goal, GoalMeasurement } from '@/core/api/schemas';
import { Button, Input, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useCategories } from '@/features/categories';

// The form schema extends the API schema with a milestones array for the
// milestone editor. On create, milestoneTitles is sent; on edit, the
// milestones array (with ids) is sent.
const GoalFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000),
  category: z.string().min(1).max(50),
  dueDate: z.string().optional(),
  relatedHabitIds: z.array(z.string()).optional(),
  measurement: z.enum(['binary', 'numeric', 'milestone', 'habit', 'manual']).optional(),
  startValue: z.number().optional(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  unit: z.string().max(32).optional(),
  milestones: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1),
      }),
    )
    .optional(),
});

export type GoalFormValues = z.infer<typeof GoalFormSchema>;

const MEASUREMENT_OPTIONS: { value: GoalMeasurement; label: string; hint: string }[] = [
  { value: 'manual', label: 'Manual', hint: 'Set progress yourself' },
  { value: 'binary', label: 'Done / Not done', hint: 'Just mark it complete' },
  { value: 'numeric', label: 'Numeric target', hint: 'Track a value toward a goal' },
  { value: 'milestone', label: 'Milestones', hint: 'Break it into steps' },
  { value: 'habit', label: 'Habit-based', hint: 'Progress from linked habits' },
];

export function GoalForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
  mode = 'create',
}: {
  initialValues?: Partial<Goal>;
  onSubmit: (values: GoalFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
  mode?: 'create' | 'edit';
}) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const { data: categories = [] } = useCategories('goal');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(GoalFormSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      category: initialValues?.category ?? '',
      dueDate: initialValues?.dueDate ?? '',
      relatedHabitIds: initialValues?.relatedHabitIds ?? [],
      measurement: initialValues?.measurement ?? 'manual',
      startValue: initialValues?.startValue,
      currentValue: initialValues?.currentValue,
      targetValue: initialValues?.targetValue,
      unit: initialValues?.unit ?? '',
      milestones: (initialValues?.milestones ?? []).map((m) => ({ id: m.id, title: m.title })),
    },
  });

  const { fields, append, remove, swap } = useFieldArray({ control, name: 'milestones' });
  const measurement = watch('measurement') ?? 'manual';

  const handleAddMilestone = () => append({ title: '' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ gap: spacing.md, padding: spacing.md }}
      keyboardShouldPersistTaps="handled"
    >
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('goals.goalTitle')}
            placeholder={t('goals.goalTitlePlaceholder')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.title?.message ? t('validation.titleRequired') : undefined}
            accessibilityLabel={t('goals.goalTitle')}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('goals.goalDescription')}
            placeholder={t('goals.goalDescriptionPlaceholder')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
            multiline
            numberOfLines={3}
            accessibilityLabel={t('goals.goalDescription')}
          />
        )}
      />

      {/* Category chips */}
      <View>
        <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
          {t('goals.category')}
        </ThemedText>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <Controller
              key={cat.slug}
              control={control}
              name="category"
              render={({ field: { value, onChange } }) => (
                <Pressable
                  onPress={() => onChange(cat.slug)}
                  accessibilityRole="button"
                  accessibilityLabel={cat.name}
                  style={[
                    styles.categoryChip,
                    {
                      borderColor: value === cat.slug ? colors.accent : colors.border,
                      backgroundColor: value === cat.slug ? `${colors.accent}1A` : 'transparent',
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <ThemedText
                    variant="label"
                    style={{
                      color: value === cat.slug ? colors.accent : colors.foreground,
                    }}
                  >
                    {cat.name}
                  </ThemedText>
                </Pressable>
              )}
            />
          ))}
        </View>
      </View>

      {/* Measurement type picker */}
      <View>
        <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
          {t('goals.measurementLabel')}
        </ThemedText>
        <View style={{ gap: spacing.xs }}>
          {MEASUREMENT_OPTIONS.map((opt) => {
            const selected = measurement === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setValue('measurement', opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={opt.label}
                accessibilityHint={opt.hint}
                style={[
                  styles.measurementOption,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: selected ? `${colors.accent}1A` : 'transparent',
                    borderRadius: radius.md,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText
                    variant="label"
                    style={{ color: selected ? colors.accent : colors.foreground }}
                  >
                    {t(`goals.measurement.${opt.value}`)}
                  </ThemedText>
                  <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                    {t(`goals.measurementHint.${opt.value}`)}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Numeric target inputs */}
      {measurement === 'numeric' && (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Controller
              control={control}
              name="startValue"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('goals.startValue')}
                  placeholder="0"
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={(v) => onChange(v === '' ? undefined : Number(v))}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  accessibilityLabel={t('goals.startValue')}
                  containerStyle={{ flex: 1 }}
                />
              )}
            />
            {mode === 'edit' && (
              <Controller
                control={control}
                name="currentValue"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('goals.currentValue')}
                    placeholder="0"
                    value={value !== undefined ? String(value) : ''}
                    onChangeText={(v) => onChange(v === '' ? undefined : Number(v))}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    accessibilityLabel={t('goals.currentValue')}
                    containerStyle={{ flex: 1 }}
                  />
                )}
              />
            )}
            <Controller
              control={control}
              name="targetValue"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('goals.targetValue')}
                  placeholder="0"
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={(v) => onChange(v === '' ? undefined : Number(v))}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  accessibilityLabel={t('goals.targetValue')}
                  containerStyle={{ flex: 1 }}
                />
              )}
            />
          </View>
          <Controller
            control={control}
            name="unit"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('goals.unit')}
                placeholder={t('goals.unitPlaceholder')}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                accessibilityLabel={t('goals.unit')}
              />
            )}
          />
        </View>
      )}

      {/* Milestone steps editor */}
      {measurement === 'milestone' && (
        <View style={{ gap: spacing.sm }}>
          <ThemedText variant="label">{t('goals.milestoneSteps')}</ThemedText>
          {fields.map((field, index) => (
            <View
              key={field.id}
              style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}
            >
              <Controller
                control={control}
                name={`milestones.${index}.title`}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder={t('goals.milestoneTitlePlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    accessibilityLabel={t('goals.milestoneTitle')}
                    containerStyle={{ flex: 1 }}
                  />
                )}
              />
              <View style={{ flexDirection: 'row', gap: 2 }}>
                <Pressable
                  onPress={() => index > 0 && swap(index, index - 1)}
                  disabled={index === 0}
                  accessibilityRole="button"
                  accessibilityLabel={t('goals.moveUp')}
                  hitSlop={8}
                  style={{ padding: 10, minHeight: 44, justifyContent: 'center', opacity: index === 0 ? 0.3 : 1 }}
                >
                  <ChevronUp color={colors.foreground} size={18} />
                </Pressable>
                <Pressable
                  onPress={() => index < fields.length - 1 && swap(index, index + 1)}
                  disabled={index === fields.length - 1}
                  accessibilityRole="button"
                  accessibilityLabel={t('goals.moveDown')}
                  hitSlop={8}
                  style={{ padding: 10, minHeight: 44, justifyContent: 'center', opacity: index === fields.length - 1 ? 0.3 : 1 }}
                >
                  <ChevronDown color={colors.foreground} size={18} />
                </Pressable>
                <Pressable
                  onPress={() => remove(index)}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                  hitSlop={8}
                  style={{ padding: 10, minHeight: 44, justifyContent: 'center' }}
                >
                  <Trash2 color={colors.destructive} size={18} />
                </Pressable>
              </View>
            </View>
          ))}
          <Button variant="outline" size="sm" onPress={handleAddMilestone}>
            <Plus color={colors.accent} size={16} /> {t('goals.addMilestone')}
          </Button>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
        <Button variant="outline" fullWidth onPress={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button fullWidth loading={submitting} onPress={handleSubmit(onSubmit)}>
          {t('common.save')}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
  measurementOption: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
});
