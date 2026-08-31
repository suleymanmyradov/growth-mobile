/**
 * HelpScreen — Help & guide stack screen.
 *
 * Paper (`mobile.md`): a standalone stack screen pushed from the Me tab's
 * Support section. Renders the structured help content from `help-content.ts`
 * natively (no arbitrary HTML/WebView, per AGENTS.md). Each section is a Card
 * with an icon + title + intro, followed by subsections rendered as
 * paragraphs, ordered steps, bullet lists, and callouts (info/pro/warning).
 * A footer links to Report a problem.
 *
 * Domain boundary: this screen lives in `features/help`. It imports only the
 * shared design system and the report route (via the router). It does not
 * import other features' internals.
 */
import { useRouter } from 'expo-router';
import { Info, Sparkles, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Screen, SectionLabel, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import type { HelpBlock, HelpSection, HelpSubsection } from '../help-content';
import { helpSections } from '../help-content';

export function HelpScreen(): React.ReactNode {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing } = useTheme();

  return (
    <Screen title={t('help.title')} onBack={() => router.back()} scrollable>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.lg,
          gap: spacing.lg,
        }}
      >
        <View style={{ gap: spacing.xs }}>
          <ThemedText variant="sectionTitle">{t('help.heading')}</ThemedText>
          <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
            {t('help.subtitle')}
          </ThemedText>
        </View>

        {helpSections.map((section) => (
          <HelpSectionCard key={section.id} section={section} />
        ))}

        {/* Footer — link to Report a problem */}
        <View
          style={{
            borderTopColor: colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            paddingTop: spacing.md,
            gap: spacing.xs,
          }}
        >
          <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
            {t('help.stuckPrefix')}{' '}
            <Pressable
              onPress={() => router.push('/report')}
              accessibilityRole="link"
              accessibilityLabel={t('help.reportLink')}
              hitSlop={8}
            >
              <ThemedText variant="body" style={{ color: colors.accent }}>
                {t('help.reportLink')}
              </ThemedText>
            </Pressable>{' '}
            {t('help.stuckSuffix')}
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function HelpSectionCard({ section }: { section: HelpSection }): React.ReactNode {
  const { colors, spacing } = useTheme();
  const Icon = section.icon;
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionLabel>{section.title}</SectionLabel>
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon color={colors.mutedForeground} size={20} />
            <ThemedText variant="cardTitle">{section.title}</ThemedText>
          </View>
          {section.intro ? (
            <ThemedText variant="body" style={{ color: colors.mutedForeground }}>
              {section.intro}
            </ThemedText>
          ) : null}
          {section.subsections.map((sub) => (
            <HelpSubsectionView key={sub.id} subsection={sub} />
          ))}
        </View>
      </Card>
    </View>
  );
}

// ─── Subsection ───────────────────────────────────────────────────────────────

function HelpSubsectionView({ subsection }: { subsection: HelpSubsection }): React.ReactNode {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs, borderTopColor: 'transparent' }}>
      <ThemedText variant="label" style={{ marginTop: spacing.xs }}>
        {subsection.title}
      </ThemedText>
      {subsection.blocks.map((block, i) => (
        <HelpBlockView key={i} block={block} />
      ))}
    </View>
  );
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function HelpBlockView({ block }: { block: HelpBlock }): React.ReactNode {
  const { colors, spacing, radius } = useTheme();

  switch (block.kind) {
    case 'paragraph':
      return (
        <ThemedText variant="body" style={{ color: colors.foreground }}>
          {block.text}
        </ThemedText>
      );

    case 'steps':
      return (
        <View style={{ gap: spacing.xs }}>
          {block.items.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <ThemedText variant="body" style={{ color: colors.accent, minWidth: 18 }}>
                {i + 1}.
              </ThemedText>
              <ThemedText variant="body" style={{ flex: 1, color: colors.foreground }}>
                {item}
              </ThemedText>
            </View>
          ))}
        </View>
      );

    case 'list':
      return (
        <View style={{ gap: spacing.xs }}>
          {block.items.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <ThemedText variant="body" style={{ color: colors.mutedForeground, minWidth: 12 }}>
                {'\u2022'}
              </ThemedText>
              <ThemedText variant="body" style={{ flex: 1, color: colors.foreground }}>
                {item}
              </ThemedText>
            </View>
          ))}
        </View>
      );

    case 'callout': {
      const { icon, tint, tintForeground } = calloutStyle(block.tone, colors);
      const Icon = icon;
      return (
        <View
          style={[
            styles.callout,
            {
              backgroundColor: tint,
              borderRadius: radius.card,
              padding: spacing.md,
              gap: spacing.xs,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon color={tintForeground} size={16} />
            {block.title ? (
              <ThemedText variant="label" style={{ color: tintForeground }}>
                {block.title}
              </ThemedText>
            ) : null}
          </View>
          <ThemedText variant="bodySmall" style={{ color: colors.foreground }}>
            {block.text}
          </ThemedText>
        </View>
      );
    }

    default:
      return null;
  }
}

function calloutStyle(
  tone: 'info' | 'pro' | 'warning',
  colors: {
    muted: string;
    accent: string;
    destructive: string;
    accentForeground: string;
    foreground: string;
  },
): {
  icon: typeof Info;
  tint: string;
  tintForeground: string;
} {
  switch (tone) {
    case 'pro':
      return { icon: Sparkles, tint: colors.accent, tintForeground: colors.accentForeground };
    case 'warning':
      return { icon: TriangleAlert, tint: colors.destructive, tintForeground: colors.foreground };
    case 'info':
    default:
      return { icon: Info, tint: colors.muted, tintForeground: colors.foreground };
  }
}

const styles = StyleSheet.create({
  callout: {},
});
