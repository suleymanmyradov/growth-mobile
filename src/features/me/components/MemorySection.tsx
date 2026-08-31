/**
 * MemorySection — the coach's curated long-term memory facts.
 *
 * Ported from the web frontend's `components/profile/memory-section.tsx`:
 * - Info card explaining what the coach remembers.
 * - Add-a-fact form (text + category selector + Add button).
 * - Fact list with category badge, user-authored badge, low-confidence badge,
 *   date, and per-fact forget (delete) button.
 * - "Forget all" with an Alert confirmation.
 *
 * Domain boundary: this component lives in `features/me/components`. It imports
 * only PUBLIC hooks from `features/memory`. It does not import feature
 * internals.
 */
import { Brain, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import type { MemoryFactCategory } from '@/core/api/schemas';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionLabel,
  SegmentedTabs,
  Skeleton,
  ThemedText,
  type Segment,
} from '@/design-system';
import { useTheme } from '@/design-system/theme';
import {
  useAddMemoryFact,
  useForgetAllMemoryFacts,
  useForgetMemoryFact,
  useMemoryFacts,
} from '@/features/memory';

const CATEGORIES: { id: MemoryFactCategory; labelKey: string }[] = [
  { id: 'commitment', labelKey: 'memory.categoryCommitment' },
  { id: 'preference', labelKey: 'memory.categoryPreference' },
  { id: 'constraint', labelKey: 'memory.categoryConstraint' },
  { id: 'context', labelKey: 'memory.categoryContext' },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MemorySection(): React.ReactNode {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  const { data: facts, isLoading } = useMemoryFacts({ page: 1, limit: 100 });
  const addMutation = useAddMemoryFact();
  const forgetMutation = useForgetMemoryFact();
  const forgetAllMutation = useForgetAllMemoryFacts();

  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryFactCategory>('commitment');
  const [error, setError] = useState<string | null>(null);

  const categorySegments: Segment[] = CATEGORIES.map((c) => ({
    id: c.id,
    label: t(c.labelKey),
  }));

  const handleAdd = async () => {
    const trimmed = newFact.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await addMutation.mutateAsync({ fact: trimmed, category: newCategory });
      setNewFact('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('memory.addError'));
    }
  };

  const handleForget = (id: string) => {
    Alert.alert(t('memory.forgetConfirmTitle'), t('memory.forgetConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          forgetMutation.mutate(id, {
            onError: (err) => {
              setError(err instanceof ApiError ? err.message : t('memory.forgetError'));
            },
          });
        },
      },
    ]);
  };

  const handleForgetAll = () => {
    Alert.alert(t('memory.forgetAllConfirmTitle'), t('memory.forgetAllConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('memory.forgetAllAction'),
        style: 'destructive',
        onPress: () => {
          forgetAllMutation.mutate(undefined, {
            onSuccess: () => setError(null),
            onError: (err) => {
              setError(err instanceof ApiError ? err.message : t('memory.forgetAllError'));
            },
          });
        },
      },
    ]);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Header */}
      <View style={{ gap: spacing.xs }}>
        <SectionLabel>{t('memory.title')}</SectionLabel>
      </View>

      {/* Info card */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <Brain color={colors.mutedForeground} size={20} />
          <View style={{ flex: 1 }}>
            <ThemedText variant="label" style={{ marginBottom: 4 }}>
              {t('memory.infoTitle')}
            </ThemedText>
            <ThemedText variant="bodySmall" style={{ color: colors.mutedForeground }}>
              {t('memory.infoBody')}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* Add a fact */}
      <Card padded={false}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <ThemedText variant="label">{t('memory.addFactTitle')}</ThemedText>
          <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
            {t('memory.addFactHint')}
          </ThemedText>
          <Input
            value={newFact}
            onChangeText={setNewFact}
            placeholder={t('memory.addFactPlaceholder')}
            multiline
            numberOfLines={3}
            maxLength={500}
            accessibilityLabel={t('memory.addFactTitle')}
            style={{ minHeight: 72 }}
          />
          <SegmentedTabs
            segments={categorySegments}
            value={newCategory}
            onChange={(id) => setNewCategory(id as MemoryFactCategory)}
          />
          <Button
            onPress={() => void handleAdd()}
            disabled={addMutation.isPending || !newFact.trim()}
            loading={addMutation.isPending}
            fullWidth
          >
            {addMutation.isPending ? t('memory.adding') : t('memory.addFactButton')}
          </Button>
        </View>
      </Card>

      {/* Fact list */}
      <Card padded={false}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <ThemedText variant="label">
              {t('memory.rememberedFacts')}
              {facts ? ` (${facts.length})` : ''}
            </ThemedText>
            {facts && facts.length > 0 ? (
              <Pressable
                onPress={handleForgetAll}
                disabled={forgetAllMutation.isPending}
                hitSlop={8}
                style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}
                accessibilityRole="button"
                accessibilityLabel={t('memory.forgetAll')}
              >
                <ThemedText
                  variant="label"
                  style={{
                    color: forgetAllMutation.isPending
                      ? colors.mutedForeground
                      : colors.destructive,
                  }}
                >
                  {forgetAllMutation.isPending ? t('memory.forgetting') : t('memory.forgetAll')}
                </ThemedText>
              </Pressable>
            ) : null}
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

          {isLoading ? (
            <View style={{ gap: spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} style={{ height: 64 }} radius={8} />
              ))}
            </View>
          ) : !facts || facts.length === 0 ? (
            <EmptyState title={t('memory.emptyTitle')} subtitle={t('memory.emptyBody')} />
          ) : (
            <ScrollView
              style={{ maxHeight: 400 }}
              nestedScrollEnabled
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {facts.map((fact) => {
                const categoryLabel =
                  CATEGORIES.find((c) => c.id === fact.category)?.labelKey ??
                  'memory.categoryContext';
                return (
                  <View
                    key={fact.id}
                    style={{
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: spacing.md,
                      gap: spacing.xs,
                    }}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}
                    >
                      <ThemedText variant="body" style={{ flex: 1 }}>
                        {fact.fact}
                      </ThemedText>
                      <Pressable
                        onPress={() => handleForget(fact.id)}
                        disabled={forgetMutation.isPending}
                        hitSlop={8}
                        style={{ padding: 4, minHeight: 36, justifyContent: 'center' }}
                        accessibilityRole="button"
                        accessibilityLabel={t('memory.forgetFact')}
                      >
                        <Trash2
                          color={
                            forgetMutation.isPending ? colors.mutedForeground : colors.destructive
                          }
                          size={16}
                        />
                      </Pressable>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      <Badge>{t(categoryLabel)}</Badge>
                      {fact.userAuthored ? (
                        <Badge variant="success">{t('memory.you')}</Badge>
                      ) : null}
                      {!fact.userAuthored && fact.confidence < 0.5 ? (
                        <Badge variant="warning">{t('memory.lowConfidence')}</Badge>
                      ) : null}
                      <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
                        {formatDate(fact.createdAt)}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Card>
    </View>
  );
}
