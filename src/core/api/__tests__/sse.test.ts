import { parseSSEStream, SSEEvent } from '../sse';

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });
}

async function collect(gen: AsyncGenerator<SSEEvent>): Promise<SSEEvent[]> {
  const events: SSEEvent[] = [];
  for await (const event of gen) {
    events.push(event);
  }
  return events;
}

describe('parseSSEStream', () => {
  it('parses a single complete event', async () => {
    const stream = makeStream(['data: hello\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: 'hello' }]);
  });

  it('parses multiple events in one chunk', async () => {
    const stream = makeStream(['data: one\n\nevent: ping\ndata: two\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([
      { event: 'message', data: 'one' },
      { event: 'ping', data: 'two' },
    ]);
  });

  it('handles an event split across chunks (data line split mid-line)', async () => {
    const stream = makeStream(['data: hel', 'lo world\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: 'hello world' }]);
  });

  it('joins multiple data: lines with \\n', async () => {
    const stream = makeStream(['data: line1\ndata: line2\ndata: line3\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: 'line1\nline2\nline3' }]);
  });

  it('ignores comment/heartbeat lines (starting with :)', async () => {
    const stream = makeStream([': this is a comment\n: heartbeat\ndata: hello\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: 'hello' }]);
  });

  it('handles CRLF line endings', async () => {
    const stream = makeStream(['data: hello\r\n\r\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: 'hello' }]);
  });

  it('handles CR-only line endings', async () => {
    const stream = makeStream(['data: hello\r\r']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: 'hello' }]);
  });

  it('handles a custom event type', async () => {
    const stream = makeStream(['event: custom\ndata: payload\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'custom', data: 'payload' }]);
  });

  it('handles the id field', async () => {
    const stream = makeStream(['id: 42\ndata: hello\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: 'hello', id: '42' }]);
  });

  it('dispatches the last event when the stream ends without a final blank line', async () => {
    const stream = makeStream(['data: hello']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: 'hello' }]);
  });

  it('throws an AbortError when the signal is already aborted', async () => {
    const stream = makeStream(['data: hello\n\n']);
    const controller = new AbortController();
    controller.abort();
    const gen = parseSSEStream(stream, controller.signal);
    await expect(gen.next()).rejects.toThrow('aborted');
  });

  it('throws an AbortError when the signal is aborted mid-stream', async () => {
    const controller = new AbortController();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: one\n\n'));
        controller.close();
      },
    });
    const gen = parseSSEStream(stream, controller.signal);
    // Abort before consuming the first event.
    controller.abort();
    await expect(gen.next()).rejects.toThrow('aborted');
  });

  it('strips a single leading space after the colon', async () => {
    const stream = makeStream(['data:   spaced\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([{ event: 'message', data: '  spaced' }]);
  });

  it('does not dispatch an event with no data lines', async () => {
    const stream = makeStream(['event: noop\n\n']);
    const events = await collect(parseSSEStream(stream));
    expect(events).toEqual([]);
  });
});
