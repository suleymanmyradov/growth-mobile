export interface SSEEvent {
  event: string; // event type, defaults to 'message'
  data: string; // joined data lines with \n
  id?: string; // last event ID
}

/**
 * Parse a Server-Sent Events stream according to the HTML spec.
 *
 * - Events are separated by blank lines.
 * - Supported fields: `data`, `event`, `id`, `retry`.
 * - Comment lines (starting with `:`) are ignored.
 * - Handles CRLF, LF, and CR line endings.
 * - Handles chunk boundaries (fields may be split across chunks).
 * - Supports cancellation via an AbortSignal.
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const reader = stream.getReader();

  let buffer = '';
  let eventType = 'message';
  let dataLines: string[] = [];
  let lastEventId: string | undefined;

  const throwIfAborted = (): void => {
    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
  };

  const dispatch = (): SSEEvent | null => {
    if (dataLines.length === 0) {
      // No data lines means nothing to dispatch (per spec, an event with no
      // data is not fired). Reset event type but keep the accumulated id.
      eventType = 'message';
      return null;
    }
    const event: SSEEvent = {
      event: eventType,
      data: dataLines.join('\n'),
    };
    if (lastEventId !== undefined) {
      event.id = lastEventId;
    }
    dataLines = [];
    eventType = 'message';
    return event;
  };

  const processLine = (line: string): SSEEvent | null => {
    // Blank line — dispatch the accumulated event.
    if (line === '') {
      return dispatch();
    }

    // Comment line — ignore.
    if (line.startsWith(':')) {
      return null;
    }

    // Field line — `field: value` or `field` with no value.
    const colonIndex = line.indexOf(':');
    let field: string;
    let value: string;

    if (colonIndex === -1) {
      // No colon — the whole line is the field name with an empty value.
      field = line;
      value = '';
    } else {
      field = line.slice(0, colonIndex);
      // Per spec, a single leading U+0020 SPACE after the colon is stripped.
      value = line.slice(colonIndex + 1);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }
    }

    switch (field) {
      case 'event':
        eventType = value;
        break;
      case 'data':
        dataLines.push(value);
        break;
      case 'id':
        // Per spec, if the id field contains a U+0000 NULL, the event is
        // dispatched but the last event ID is not updated. We treat any id
        // value as valid here.
        lastEventId = value;
        break;
      case 'retry':
        // Ignored by this parser — handled by the transport layer.
        break;
      default:
        // Unknown field — ignore per spec.
        break;
    }

    return null;
  };

  try {
    throwIfAborted();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        buffer += decoder.decode(value, { stream: true });
      }

      // Process all complete lines in the buffer. We split on any of CRLF, LF,
      // or CR. To handle mixed endings correctly, normalize CRLF first by
      // splitting on \n and then stripping a trailing \r from each segment.
      let newlineIndex: number;
      while ((newlineIndex = findLineEnd(buffer)) !== -1) {
        const rawLine = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        // Strip a trailing CR (handles CRLF when split on LF, and CR-only
        // when findLineEnd matched a CR).
        const line = stripTrailingCR(rawLine);
        const dispatched = processLine(line);
        if (dispatched) {
          throwIfAborted();
          yield dispatched;
        }
      }
    }

    // Flush the decoder.
    buffer += decoder.decode();

    // Process any remaining content in the buffer (stream ended without a
    // final blank line). Dispatch the last event if it has data.
    if (buffer !== '') {
      const line = stripTrailingCR(buffer);
      buffer = '';
      const dispatched = processLine(line);
      if (dispatched) {
        throwIfAborted();
        yield dispatched;
      }
    }

    // If there is a pending event with data that was never terminated by a
    // blank line, dispatch it now. (This covers the case where the final
    // line was a data line with no trailing newline.)
    const trailing = dispatch();
    if (trailing) {
      throwIfAborted();
      yield trailing;
    }
  } finally {
    // Ensure the reader is released even on cancellation or error.
    reader.releaseLock();
  }
}

/**
 * Find the index of the next line terminator (LF or CR) in `buffer`.
 * Returns -1 if none is found.
 */
function findLineEnd(buffer: string): number {
  const lf = buffer.indexOf('\n');
  const cr = buffer.indexOf('\r');
  if (lf === -1 && cr === -1) {
    return -1;
  }
  if (lf === -1) {
    return cr;
  }
  if (cr === -1) {
    return lf;
  }
  return Math.min(lf, cr);
}

/**
 * Strip a single trailing carriage return (handles CRLF split on LF, and
 * CR-only line endings).
 */
function stripTrailingCR(line: string): string {
  if (line.endsWith('\r')) {
    return line.slice(0, -1);
  }
  return line;
}
