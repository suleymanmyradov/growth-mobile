/**
 * Tests for the search debounce hook.
 *
 * Verifies that rapid input changes are debounced and that the `pending` flag
 * correctly reflects whether the debounced value has caught up to the raw
 * input. Stale-result prevention is a Phase F requirement (`mobile.md` §8.5).
 */
import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useDebouncedQuery } from '../hooks';

const FAST_DELAY = 50;

/** Test harness that exposes the hook result via a rendered Text node. */
function DebounceHarness({ initialQ }: { initialQ: string }) {
  const [q, setQ] = useState(initialQ);
  const { debounced, pending } = useDebouncedQuery(q, FAST_DELAY);
  return (
    <View>
      <Text testID="raw">{q}</Text>
      <Text testID="debounced">{debounced}</Text>
      <Text testID="pending">{pending ? 'true' : 'false'}</Text>
      <Text testID="setQ" onPress={() => setQ('changed')}>
        setQ
      </Text>
    </View>
  );
}

/** Multi-step harness for rapid-change testing. */
function RapidChangeHarness() {
  const [q, setQ] = useState('a');
  const { debounced, pending } = useDebouncedQuery(q, FAST_DELAY);
  return (
    <View>
      <Text testID="raw">{q}</Text>
      <Text testID="debounced">{debounced}</Text>
      <Text testID="pending">{pending ? 'true' : 'false'}</Text>
      <Text testID="setB" onPress={() => setQ('b')}>
        setB
      </Text>
      <Text testID="setC" onPress={() => setQ('c')}>
        setC
      </Text>
      <Text testID="setD" onPress={() => setQ('d')}>
        setD
      </Text>
    </View>
  );
}

describe('useDebouncedQuery', () => {
  it('returns the initial value immediately with pending false', async () => {
    const { getByTestId } = await render(<DebounceHarness initialQ="hello" />);
    expect(getByTestId('debounced').props.children).toBe('hello');
    expect(getByTestId('pending').props.children).toBe('false');
  });

  it('debounces changes until the delay elapses', async () => {
    const { getByTestId } = await render(<DebounceHarness initialQ="initial" />);

    // Trigger a change.
    await fireEvent.press(getByTestId('setQ'));

    // Pending immediately after change, debounced not yet updated.
    expect(getByTestId('pending').props.children).toBe('true');
    expect(getByTestId('debounced').props.children).toBe('initial');

    // After the delay, the debounced value catches up.
    await waitFor(() => {
      expect(getByTestId('debounced').props.children).toBe('changed');
    });
    expect(getByTestId('pending').props.children).toBe('false');
  });

  it('cancels pending debounce on rapid changes (only last value wins)', async () => {
    const { getByTestId } = await render(<RapidChangeHarness />);

    // Rapid-fire changes.
    await fireEvent.press(getByTestId('setB'));
    await fireEvent.press(getByTestId('setC'));
    await fireEvent.press(getByTestId('setD'));

    expect(getByTestId('debounced').props.children).toBe('a');
    expect(getByTestId('pending').props.children).toBe('true');

    // Only the last value ('d') should be committed after the delay.
    await waitFor(() => {
      expect(getByTestId('debounced').props.children).toBe('d');
    });
    expect(getByTestId('pending').props.children).toBe('false');
  });
});
