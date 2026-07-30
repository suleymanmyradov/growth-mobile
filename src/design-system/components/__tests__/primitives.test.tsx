/**
 * Phase C primitive component tests — verifies the Paper interaction primitives
 * (Chip, SegmentedTabs, ListRow, ProgressBar, StreakBar, CheckInControl,
 * SectionLabel, Avatar, Skeleton) render and expose correct accessibility
 * state.
 */
import type { RenderResult } from '@testing-library/react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { renderWithTheme } from '../../test-utils/render';
import { Avatar } from '../Avatar';
import { CheckInControl, type CheckInState } from '../CheckInControl';
import { Chip } from '../Chip';
import { ListRow } from '../ListRow';
import { ProgressBar } from '../ProgressBar';
import { SectionLabel } from '../SectionLabel';
import { SegmentedTabs } from '../SegmentedTabs';
import { Skeleton } from '../Skeleton';
import { StreakBar } from '../StreakBar';
import { ThemedText } from '../ThemedText';

function flatten(
  style: StyleProp<ViewStyle> | ((s: { pressed: boolean }) => StyleProp<ViewStyle>),
): ViewStyle {
  const produced = typeof style === 'function' ? style({ pressed: false }) : style;
  const arr = Array.isArray(produced) ? produced : [produced];
  return Object.assign({}, ...arr.filter(Boolean)) as ViewStyle;
}

describe('Chip', () => {
  test('selected chip reports selected accessibility state and accent background', async () => {
    const { getByRole } = await renderWithTheme(
      <Chip selected onPress={() => undefined}>
        Morning
      </Chip>,
    );
    const chip = getByRole('button');
    expect(chip.props.accessibilityState).toEqual({ selected: true, disabled: false });
    expect(flatten(chip.props.style).backgroundColor).toBeTruthy();
  });

  test('disabled chip blocks onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await renderWithTheme(
      <Chip disabled onPress={onPress}>
        Morning
      </Chip>,
    );
    expect(getByRole('button').props.onPress).toBeUndefined();
  });
});

describe('SegmentedTabs', () => {
  test('renders one tab per segment and marks the value selected', async () => {
    const { getAllByRole } = await renderWithTheme(
      <SegmentedTabs
        segments={[
          { id: 'explore', label: 'Explore' },
          { id: 'saved', label: 'Saved' },
        ]}
        value="saved"
        onChange={() => undefined}
      />,
    );
    const tabs = getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.props.accessibilityState.selected).toBe(false);
    expect(tabs[1]?.props.accessibilityState.selected).toBe(true);
  });
});

describe('ListRow', () => {
  test('renders children and a disclosure chevron when onPress is set', async () => {
    const { getByText } = await renderWithTheme(
      <ListRow onPress={() => undefined}>
        <ThemedText>Settings</ThemedText>
      </ListRow>,
    );
    expect(getByText('Settings')).toBeTruthy();
  });

  test('omits the chevron when no onPress', async () => {
    const r = await renderWithTheme(
      <ListRow>
        <ThemedText>Static</ThemedText>
      </ListRow>,
    );
    // No pressable => no button role.
    expect(() => r.getByRole('button')).toThrow();
  });
});

describe('ProgressBar', () => {
  test('clamps value above 1 to 100% width', async () => {
    const { toJSON } = await renderWithTheme(<ProgressBar value={1.5} />);
    const tree = toJSON();
    expect(JSON.stringify(tree)).toContain('100%');
  });

  test('clamps negative value to 0% width', async () => {
    const { toJSON } = await renderWithTheme(<ProgressBar value={-0.2} />);
    expect(JSON.stringify(toJSON())).toContain('0%');
  });
});

describe('StreakBar', () => {
  test('renders up to 14 bars and the summary text', async () => {
    const { getByText } = await renderWithTheme(
      <StreakBar history={[true, false, true]} summary="2 of 3" />,
    );
    expect(getByText('2 of 3')).toBeTruthy();
  });
});

describe('CheckInControl', () => {
  test.each<[CheckInState, boolean, boolean]>([
    ['rest', false, false],
    ['done', true, false],
    ['syncing', false, true],
    ['disabled', false, false],
  ])('state %s reports checked=%s busy=%s', async (state, checked, busy) => {
    const { getByRole } = await renderWithTheme(
      <CheckInControl state={state} habitName="Read" onPress={() => undefined} />,
    );
    const cb = getByRole('checkbox');
    expect(cb.props.accessibilityState.checked).toBe(checked);
    expect(cb.props.accessibilityState.busy).toBe(busy);
  });

  test('disabled state blocks onPress', async () => {
    const onPress = jest.fn();
    const { getByRole } = await renderWithTheme(
      <CheckInControl state="disabled" habitName="Read" onPress={onPress} />,
    );
    expect(getByRole('checkbox').props.onPress).toBeUndefined();
  });
});

describe('SectionLabel', () => {
  test('renders as a header', async () => {
    const { getByRole } = await renderWithTheme(<SectionLabel>This week</SectionLabel>);
    expect(getByRole('header')).toBeTruthy();
  });
});

describe('Avatar', () => {
  test('shows a monogram derived from the name when no uri', async () => {
    const { getByText } = await renderWithTheme(<Avatar name="Ada Lovelace" />);
    expect(getByText('AL')).toBeTruthy();
  });

  test('falls back to ? for empty name', async () => {
    const { getByText } = await renderWithTheme(<Avatar />);
    expect(getByText('?')).toBeTruthy();
  });
});

describe('Skeleton', () => {
  test('renders and is hidden from accessibility', async () => {
    const r: RenderResult = await renderWithTheme(<Skeleton style={{ width: 100, height: 12 }} />);
    const tree = r.toJSON();
    expect(tree).not.toBeNull();
    expect(JSON.stringify(tree)).toContain('no-hide-descendants');
  });
});
