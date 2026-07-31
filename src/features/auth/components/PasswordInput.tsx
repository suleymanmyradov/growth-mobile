/**
 * PasswordInput — Input wrapper with an accessible show/hide password action.
 *
 * Paper (`mobile.md` §8.8): auth fields use visible labels, 48-unit inputs,
 * inline validation, and an accessible show/hide password action. The toggle is
 * a 44-unit minimum target rendered as the Input's trailing affordance.
 */
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Input, type InputProps } from '@/design-system';
import { useTheme } from '@/design-system/theme';

export type PasswordInputProps = Omit<InputProps, 'secureTextEntry' | 'trailing'> & {
  /** i18n label for the show action (accessibility). */
  showLabel: string;
  /** i18n label for the hide action (accessibility). */
  hideLabel: string;
};

export function PasswordInput({
  showLabel,
  hideLabel,
  ...rest
}: PasswordInputProps): React.ReactNode {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <Input
      secureTextEntry={!visible}
      trailing={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? hideLabel : showLabel}
          hitSlop={8}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }}
        >
          {visible ? (
            <EyeOff color={colors.mutedForeground} size={20} />
          ) : (
            <Eye color={colors.mutedForeground} size={20} />
          )}
        </Pressable>
      }
      {...rest}
    />
  );
}
