/**
 * Avatar — a circular profile image with a fallback monogram.
 *
 * Paper (`mobile.md` §7): circular, surface background, foreground monogram
 * when no image is provided. Uses `expo-image` for remote caching.
 */
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme/theme';
import { ThemedText } from './ThemedText';

export type AvatarProps = Omit<ViewProps, 'style'> & {
  /** Remote image URI; when absent a monogram is shown. */
  uri?: string;
  /** Name used to derive the monogram fallback. */
  name?: string;
  /** Diameter in dp; defaults to 40. */
  size?: number;
};

function monogram(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  if (parts.length === 1) return first.toUpperCase();
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

export function Avatar({ uri, name, size = 40, ...rest }: AvatarProps): ReactNode {
  const { colors, fonts } = useTheme();

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.muted },
      ]}
      {...rest}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} contentFit="cover" />
      ) : (
        <ThemedText
          variant="label"
          style={{ color: colors.foreground, fontFamily: fonts.bodyMedium }}
        >
          {monogram(name)}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
