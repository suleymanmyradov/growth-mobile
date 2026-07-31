/**
 * Goal form — create or edit a goal.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CreateGoalRequestSchema, type CreateGoalRequest } from '@/core/api/schemas';
import { Button, Input, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { useCategories } from '@/features/categories';

export type GoalFormValues = CreateGoalRequest;

export function GoalForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  initialValues?: Partial<GoalFormValues>;
  onSubmit: (values: GoalFormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const { data: categories = [] } = useCategories('goal');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(CreateGoalRequestSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
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
