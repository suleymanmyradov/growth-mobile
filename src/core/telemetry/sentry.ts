import * as Sentry from '@sentry/react-native';

export function initSentry(dsn: string, environment: string): void {
  if (!dsn) return; // disabled if no DSN
  Sentry.init({
    dsn,
    environment,
    // Scrub sensitive data — never send request bodies, tokens, messages.
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
      }
      return event;
    },
  });
}

export function captureException(error: unknown): void {
  Sentry.captureException(error);
}

export function setSentryUser(userId: string | null): void {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}
