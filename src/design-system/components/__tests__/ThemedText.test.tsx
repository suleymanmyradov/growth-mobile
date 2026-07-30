/**
 * ThemedText component tests — verifies semantic variant resolution and that
 * the legacy `heading` alias maps to `sectionTitle`.
 */
import type { RenderResult } from '@testing-library/react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { renderWithTheme } from '../../test-utils/render';
import { ThemedText } from '../ThemedText';

type TextChild = { props: { style?: StyleProp<TextStyle> } };

function flattenStyle(style: StyleProp<TextStyle>): TextStyle {
  if (Array.isArray(style)) {
    return Object.assign(
      {},
      ...style.filter(Boolean).map((s) => flattenStyle(s as StyleProp<TextStyle>)),
    );
  }
  return (style as TextStyle) ?? {};
}

function styleOf(r: RenderResult, text: string): TextStyle {
  const node = r.getByText(text) as unknown as TextChild;
  return flattenStyle(node.props.style);
}

describe('ThemedText', () => {
  test('screenTitle variant resolves to 34/39', async () => {
    const r = await renderWithTheme(<ThemedText variant="screenTitle">Today</ThemedText>);
    expect(styleOf(r, 'Today').fontSize).toBe(34);
  });

  test('sectionTitle variant resolves to 22', async () => {
    const r = await renderWithTheme(<ThemedText variant="sectionTitle">Section</ThemedText>);
    expect(styleOf(r, 'Section').fontSize).toBe(22);
  });

  test('numeric variant uses tabular-nums font variant', async () => {
    const r = await renderWithTheme(<ThemedText variant="numeric">12</ThemedText>);
    expect(styleOf(r, '12').fontVariant).toEqual(['tabular-nums']);
  });

  test('legacy heading alias maps to sectionTitle size', async () => {
    const r = await renderWithTheme(<ThemedText variant="heading">Section</ThemedText>);
    expect(styleOf(r, 'Section').fontSize).toBe(22);
  });

  test('defaults to body variant (16)', async () => {
    const r = await renderWithTheme(<ThemedText>Body</ThemedText>);
    expect(styleOf(r, 'Body').fontSize).toBe(16);
  });
});
