import { parsePushPayload } from '../push-payload';

const notificationId = '0192be94-1234-5678-9aaa-09876543210a';

describe('parsePushPayload', () => {
  it('maps an allowlisted destination', () => {
    expect(parsePushPayload({ version: 1, notificationId, destination: 'weekly-review' })).toEqual({
      notificationId,
      route: '/(app)/progress',
    });
  });

  it('rejects unsupported versions and arbitrary destinations', () => {
    expect(
      parsePushPayload({ version: 2, notificationId, destination: 'weekly-review' }),
    ).toBeNull();
    expect(
      parsePushPayload({ version: 1, notificationId, destination: 'https://example.com' }),
    ).toBeNull();
  });

  it('requires a valid resource id for detail destinations', () => {
    expect(parsePushPayload({ version: 1, notificationId, destination: 'article-detail' })).toEqual(
      { notificationId, route: null },
    );
  });
});
