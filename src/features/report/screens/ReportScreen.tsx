/**
 * ReportScreen — Report a problem stack screen.
 *
 * Paper (`mobile.md`): a standalone stack screen pushed from the Me tab's
 * Support section. Lets the user submit a bug, abuse/spam, or feedback report
 * to `POST /api/v1/report`. Mirrors the web `/report` page behavior: category
 * selector, subject, details, optional email, submit, and a thank-you
 * confirmation state.
 *
 * Domain boundary: this screen lives in `features/report`. It imports only
 * the shared design system, the report hook, and core API schemas. It does not
 * import other features' internals.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { ReportRequestSchema, type ReportRequest, type ReportType } from '@/core/api/schemas';
import { Button, Input, Screen, SegmentedTabs, ThemedText, type Segment } from '@/design-system';
import { useTheme } from '@/design-system/theme';
import { z } from 'zod';

import { useSubmitReport } from '../hooks';

const VALID_TYPES: ReportType[] = ['bug', 'feedback', 'abuse'];

/**
 * Form-specific schema: allows an empty email string (so the optional field
 * does not fail `.email()` validation when left blank). The shared
 * `ReportRequestSchema` is the network-boundary contract; this is the
 * form-boundary adapter. Empty strings are mapped to `undefined` in
 * `onSubmit` before constructing the API payload.
 */
const ReportFormSchema = ReportRequestSchema.extend({
  email: z.union([z.literal(''), z.string().email()]).optional(),
});

type ReportFormValues = z.infer<typeof ReportFormSchema>;

export function ReportScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const submitReport = useSubmitReport();
  const [submitted, setSubmitted] = useState(false);

  // Optional prefilled context from query params (e.g. article reader Report
  // link passes `title` and `type=abuse`).
  const { title: initialTitle, type: initialType } = useLocalSearchParams<{
    title?: string;
    type?: string;
  }>();
  const prefilledType = VALID_TYPES.includes(initialType as ReportType)
    ? (initialType as ReportType)
    : 'bug';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(ReportFormSchema),
    defaultValues: {
      type: prefilledType,
      title: initialTitle ?? '',
      description: '',
      email: '',
    },
  });

  const categorySegments: (Segment & { id: ReportType })[] = [
    { id: 'bug', label: t('report.categoryBug') },
    { id: 'feedback', label: t('report.categoryFeedback') },
    { id: 'abuse', label: t('report.categoryAbuse') },
  ];

  const onSubmit = (data: ReportFormValues) => {
    // Omit empty email so the backend treats it as absent.
    const payload: ReportRequest = {
      type: data.type,
      title: data.title,
      description: data.description,
      email: data.email?.trim() ? data.email : undefined,
    };
    submitReport.mutate(payload, {
      onSuccess: () => setSubmitted(true),
    });
  };

  if (submitted) {
    return (
      <Screen title={t('report.title')} onBack={() => router.back()}>
        <View style={[styles.center, { padding: spacing.xl }]}>
          <CheckCircle2 color={colors.accent} size={48} />
          <ThemedText variant="cardTitle" style={{ marginTop: spacing.md }}>
            {t('report.thankYouTitle')}
          </ThemedText>
          <ThemedText
            variant="body"
            style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm }}
          >
            {t('report.thankYouBody')}
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button variant="outline" onPress={() => router.back()}>
              {t('common.back')}
            </Button>
            <Button
              onPress={() => {
                setSubmitted(false);
                submitReport.reset();
              }}
            >
              {t('report.submitAnother')}
            </Button>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={t('report.title')} onBack={() => router.back()} scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            gap: spacing.md,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: spacing.xs }}>
            <ThemedText variant="sectionTitle">{t('report.heading')}</ThemedText>
            <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
              {t('report.subtitle')}
            </ThemedText>
          </View>

          <View style={{ gap: spacing.xs }}>
            <ThemedText variant="label">{t('report.category')}</ThemedText>
            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <SegmentedTabs
                  segments={categorySegments}
                  value={value}
                  onChange={(id) => onChange(id as ReportType)}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('report.subject')}
                placeholder={t('report.subjectPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                maxLength={200}
                error={errors.title?.message ? t('validation.subjectRequired') : undefined}
                accessibilityLabel={t('report.subject')}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('report.details')}
                placeholder={t('report.detailsPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={6}
                maxLength={5000}
                error={errors.description?.message ? t('validation.detailsRequired') : undefined}
                accessibilityLabel={t('report.details')}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={`${t('report.email')} (${t('common.optional')})`}
                placeholder={t('report.emailPlaceholder')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message ? t('validation.emailInvalid') : undefined}
                accessibilityLabel={t('report.email')}
              />
            )}
          />

          {submitReport.isError ? (
            <ThemedText
              variant="bodySmall"
              style={{ color: colors.destructive, textAlign: 'center' }}
              accessibilityRole="alert"
            >
              {submitReport.error instanceof ApiError
                ? submitReport.error.message
                : t('report.submitError')}
            </ThemedText>
          ) : null}

          <Button
            fullWidth
            loading={submitReport.isPending}
            disabled={submitReport.isPending}
            onPress={handleSubmit(onSubmit)}
            accessibilityLabel={t('report.submit')}
          >
            {submitReport.isPending ? t('report.submitting') : t('report.submit')}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
