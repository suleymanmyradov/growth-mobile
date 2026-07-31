/**
 * Input component tests — verifies the trailing affordance (show/hide password)
 * renders inside the field and reserves trailing padding.
 */
import { Pressable } from 'react-native';

import { renderWithTheme } from '../../test-utils/render';
import { Input } from '../Input';

describe('Input', () => {
  test('renders the label above the field', async () => {
    const { getByText } = await renderWithTheme(
      <Input label="Email" value="" onChangeText={() => undefined} />,
    );
    expect(getByText('Email')).toBeTruthy();
  });

  test('renders a trailing affordance when provided', async () => {
    const { getByLabelText } = await renderWithTheme(
      <Input
        label="Password"
        value="secret"
        trailing={<Pressable accessibilityLabel="Show password" onPress={() => undefined} />}
      />,
    );
    expect(getByLabelText('Show password')).toBeTruthy();
  });

  test('applies trailing padding to the TextInput when trailing is present', async () => {
    const { getByDisplayValue } = await renderWithTheme(
      <Input
        value="secret"
        onChangeText={() => undefined}
        trailing={<Pressable accessibilityLabel="toggle" onPress={() => undefined} />}
      />,
    );
    const input = getByDisplayValue('secret');
    // The TextInput style is an array; flatten to inspect paddingRight.
    const style = input.props.style as { paddingRight?: number }[];
    const merged = Object.assign({}, ...style.filter(Boolean));
    expect(merged.paddingRight).toBe(48);
  });

  test('does not apply trailing padding when no trailing is provided', async () => {
    const { getByDisplayValue } = await renderWithTheme(
      <Input value="plain" onChangeText={() => undefined} />,
    );
    const input = getByDisplayValue('plain');
    const style = input.props.style as { paddingRight?: number }[];
    const merged = Object.assign({}, ...style.filter(Boolean));
    expect(merged.paddingRight).toBeUndefined();
  });
});
