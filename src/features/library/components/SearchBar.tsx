/**
 * SearchBar — a 44-unit search input for the Library.
 *
 * Paper (`mobile.md` §8.5): search field is 44 units high and searches
 * articles/templates/people according to supported contracts. Shows a leading
 * search icon and a trailing clear button when text is present.
 */
import { Search, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/design-system/theme';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  accessibilityLabel?: string;
};

export function SearchBar({
  value,
  onChangeText,
  accessibilityLabel,
}: SearchBarProps): React.ReactNode {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.input,
          borderWidth: 1,
          borderRadius: radius.field,
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        },
      ]}
    >
      <Search color={colors.mutedForeground} size={18} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('library.searchPlaceholder')}
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel={accessibilityLabel ?? t('library.searchPlaceholder')}
        accessibilityRole="search"
        style={{ flex: 1, color: colors.foreground, minHeight: 44, paddingVertical: 0 }}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel={t('library.clearSearch')}
          hitSlop={8}
          style={{ padding: 4, minHeight: 44, justifyContent: 'center' }}
        >
          <X color={colors.mutedForeground} size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
});
