/**
 * Habit form sheet — create or edit a habit.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CreateHabitRequestSchema, type CreateHabitRequest } from '@/core/api/schemas';
import { Button, Input, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useCategories } from '@/features/categories';

export type HabitFormValues = CreateHabitRequest;

export function HabitForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  initialValues?: Partial<HabitFormValues>;
  onSubmit: (values: HabitFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const { data: categories = [] } = useCategories('habit');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(CreateHabitRequestSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      category: initialValues?.category ?? '',
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ gap: spacing.md, padding: spacing.md }}
    >
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('habits.habitName')}
            placeholder={t('habits.habitNamePlaceholder')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message ? t('validation.nameRequired') : undefined}
            accessibilityLabel={t('habits.habitName')}
          />
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('habits.habitDescription')}
            placeholder={t('habits.habitDescriptionPlaceholder')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
            multiline
            numberOfLines={3}
            accessibilityLabel={t('habits.habitDescription')}
          />
        )}
      />
      <View>
        <ThemedText variant="label" style={{ marginBottom: spacing.xs }}>
          {t('habits.category')}
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
                      borderColor: value === cat.slug ? colors.primary : colors.border,
                      backgroundColor: value === cat.slug ? `${colors.primary}1A` : 'transparent',
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <ThemedText
                    variant="label"
                    style={{
                      color: value === cat.slug ? colors.primary : colors.foreground,
                    }}
                  >
                    {cat.name}
                  </ThemedText>
                </Pressable>
              )}
            />
          ))}
        </View>
        {errors.category?.message ? (
          <ThemedText
            variant="caption"
            style={{ color: colors.destructive, marginTop: spacing.xs }}
          >
            {t('habits.selectCategory')}
          </ThemedText>
        ) : null}
      </View>

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
});
