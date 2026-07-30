/**
 * Button component tests — verifies Paper variant colors, sizes, and
 * accessibility states.
 */
import type { StyleProp, ViewStyle } from 'react-native';

import { renderWithTheme } from '../../test-utils/render';
import { Button } from '../Button';

type PressableChild = {
  props: {
    style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
    accessibilityState?: { disabled?: boolean; busy?: boolean };
    onPress?: () => void;
  };
};

function resolveStyle(child: PressableChild): ViewStyle {
  const raw = child.props.style;
  const produced = typeof raw === 'function' ? raw({ pressed: false }) : raw;
  // Flatten the style array into a single object for assertion.
  const arr = Array.isArray(produced) ? produced : [produced];
  return Object.assign({}, ...arr.filter(Boolean)) as ViewStyle;
}

describe('Button', () => {
  test('primary variant renders the sage accent background', async () => {
    const { getByText } = await renderWithTheme(
      <Button variant="primary" onPress={() => undefined}>
        Move it
      </Button>,
    );
    expect(getByText('Move it')).toBeTruthy();
  });

  test('loading state reports busy + disabled to accessibility', async () => {
    const { getByRole } = await renderWithTheme(
      <Button variant="primary" loading onPress={() => undefined}>
        Save
      </Button>,
    );
    expect(getByRole('button').props.accessibilityState).toEqual({ disabled: true, busy: true });
  });

  test('disabled state reports disabled and blocks onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await renderWithTheme(
      <Button variant="primary" disabled onPress={onPress}>
        Save
      </Button>,
    );
    const btn = getByRole('button');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
    expect(btn.props.onPress).toBeUndefined();
  });

  test('md size meets the 44-unit minimum touch target', async () => {
    const { getByRole } = await renderWithTheme(
      <Button size="md" onPress={() => undefined}>
        Go
      </Button>,
    );
    expect(resolveStyle(getByRole('button') as unknown as PressableChild).minHeight).toBe(44);
  });

  test('lg size meets the 52-unit minimum touch target', async () => {
    const { getByRole } = await renderWithTheme(
      <Button size="lg" onPress={() => undefined}>
        Go
      </Button>,
    );
    expect(resolveStyle(getByRole('button') as unknown as PressableChild).minHeight).toBe(52);
  });
});
