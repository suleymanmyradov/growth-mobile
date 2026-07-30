/**
 * Sheet — a Paper-styled bottom sheet wrapping @gorhom/bottom-sheet.
 *
 * Paper (`mobile.md` §7/§5.3): top radius 20 (`radius.sheet`), native safe-area
 * handling, drag dismissal, Android back. Controlled via `open`/`onClose`. The
 * scrim uses the theme overlay color; the sheet background uses `surface`.
 *
 * Reduced motion: the sheet still slides (native gesture), but the backdrop
 * fade respects the `overlay` duration. The provider
 * (`BottomSheetModalProvider`) is NOT required for the imperative `BottomSheet`
 * form used here.
 */
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import type { ReactNode } from 'react';
import { forwardRef, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../theme/theme';

export type SheetProps = {
  children: ReactNode;
  /** When true the sheet is expanded; when false it collapses and calls onClose. */
  open: boolean;
  onClose: () => void;
  /** Snap points as percentages of screen height; defaults to content-fit then full. */
  snapPoints?: (string | number)[];
  /** Optional footer pinned to the bottom of the sheet. */
  footer?: ReactNode;
};

export const Sheet = forwardRef<BottomSheetMethods, SheetProps>(function Sheet(
  { children, open, onClose, snapPoints = ['50%', '100%'], footer },
  ref,
): ReactNode {
  const { colors, radius, spacing } = useTheme();
  const sheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (open) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [open]);

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <BottomSheet
        ref={(r) => {
          sheetRef.current = r;
          if (typeof ref === 'function') ref(r);
          else if (ref) ref.current = r;
        }}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={snapPoints.length === 0}
        backgroundComponent={(props) => (
          <View
            style={[
              props.style,
              styles.background,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: radius.sheet,
                borderTopRightRadius: radius.sheet,
              },
            ]}
          />
        )}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior="close"
            opacity={0.4}
          />
        )}
        handleComponent={() => (
          <View style={styles.handle}>
            <View style={[styles.handleBar, { backgroundColor: colors.mutedForeground }]} />
          </View>
        )}
        onChange={(index) => {
          if (index === -1) onClose();
        }}
      >
        <View style={{ padding: spacing.lg }}>{children}</View>
        {footer ? <View style={{ padding: spacing.lg }}>{footer}</View> : null}
      </BottomSheet>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  background: { overflow: 'hidden' },
  handle: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handleBar: { width: 40, height: 4, borderRadius: 2, opacity: 0.4 },
});
