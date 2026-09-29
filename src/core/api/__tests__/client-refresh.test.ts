/**
 * Tests for the authenticated client's refresh flow (client.ts).
 *
 * Covers the bugs that used to sign users out:
 * - The refresh response shape was typed as {sessionId, userId} which the
 *   backend never returns — every refresh wrote undefined values into
 *   SecureStore and poisoned the session.
 * - Any refresh failure (including a transient network error) wiped the
 *   persisted session. Only explicit 4xx rejections may clear it now.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('axios', () => ({
  create: jest.fn(),
  post: jest.fn(),
}));
// expo-secure-store is already mocked globally in jest.setup.js; the mock
// instance is grabbed via require() after jest.resetModules().

interface SecureStoreMock {
  getItemAsync: jest.Mock<(key: string) => Promise<string | null>>;
  setItemAsync: jest.Mock<(key: string, value: string) => Promise<void>>;
  deleteItemAsync: jest.Mock<(key: string) => Promise<void>>;
}

interface FakeInstance {
  inst: {
    interceptors: {
      request: { use: jest.Mock<() => number> };
      response: {
        use: jest.Mock<
          (ok: unknown, err: (error: unknown) => Promise<unknown>) => number
        >;
      };
    };
    request: jest.Mock<(config?: unknown) => Promise<{ data: unknown }>>;
  };
  responseErrorHandler: () => (error: unknown) => Promise<unknown>;
}

function makeFakeInstance(): FakeInstance {
  let errHandler: ((error: unknown) => Promise<unknown>) | null = null;
  const inst = {
    interceptors: {
      request: { use: jest.fn(() => 0) },
      response: {
        use: jest.fn(
          (_ok: unknown, err: (error: unknown) => Promise<unknown>) => {
            errHandler = err;
            return 0;
          },
        ),
      },
    },
    request: jest.fn(async (_config?: unknown) => ({ data: { ok: true } })),
  };
  return {
    inst,
    responseErrorHandler: () => {
      if (!errHandler) throw new Error('response error interceptor not registered');
      return errHandler;
    },
  };
}

interface AxiosMock {
  create: jest.Mock<() => FakeInstance['inst']>;
  post: jest.Mock<(url: string, body?: unknown) => Promise<unknown>>;
}

function freshClient(fake: FakeInstance): {
  client: typeof import('../client');
  axios: AxiosMock;
  store: SecureStoreMock;
} {
  // resetModules gives each test fresh module state (clientInstance,
  // refreshPromise singletons) — the production bug lived in that
  // module-level state, so tests must exercise the real module. Mocks must
  // be grabbed AFTER the reset; pre-reset jest.fn references are stale.
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const axios = require('axios') as AxiosMock;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const store = require('expo-secure-store') as SecureStoreMock;
  axios.create.mockReturnValue(fake.inst);
  seedSession(store);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const client = require('../client') as typeof import('../client');
  return { client, axios, store };
}

function seedSession(store: SecureStoreMock) {
  store.getItemAsync.mockImplementation(async (key: string) => {
    switch (key) {
      case 'growth.refresh_token':
        return 'old-rt';
      case 'growth.session_id':
        return 'old-sid';
      case 'growth.user_id':
        return 'old-uid';
      default:
        return null;
    }
  });
}

const unauthorized = (url = '/habits') => ({
  isAxiosError: true,
  response: { status: 401, data: { code: 'unauthorized', message: 'expired' } },
  config: { url, headers: {} },
  message: 'Request failed with status code 401',
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('api client refresh', () => {
  it('persists the rotated pair using the backend refresh response shape', async () => {
    const fake = makeFakeInstance();
    const { client, axios, store } = freshClient(fake);
    axios.post.mockResolvedValue({
      data: {
        accessToken: 'new-at',
        refreshToken: 'new-rt',
        expiresIn: 900,
        user: { id: 'user-1' },
      },
    });
    client.getApiClient();

    const res = await fake.responseErrorHandler()(unauthorized());
    expect(res).toEqual({ data: { ok: true } });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      { refreshToken: 'old-rt' },
    );
    expect(store.setItemAsync).toHaveBeenCalledWith('growth.refresh_token', 'new-rt');
    expect(store.setItemAsync).toHaveBeenCalledWith('growth.session_id', 'user-1');
    expect(store.setItemAsync).toHaveBeenCalledWith('growth.user_id', 'user-1');
    expect(store.deleteItemAsync).not.toHaveBeenCalled();
    // The replayed request carries the new access token.
    expect(fake.inst.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer new-at' }),
      }),
    );
  });

  it('keeps prior session metadata when the refresh response omits user', async () => {
    const fake = makeFakeInstance();
    const { client, axios, store } = freshClient(fake);
    axios.post.mockResolvedValue({
      data: { accessToken: 'new-at', refreshToken: 'new-rt' },
    });
    client.getApiClient();

    await fake.responseErrorHandler()(unauthorized());

    expect(store.setItemAsync).toHaveBeenCalledWith('growth.refresh_token', 'new-rt');
    expect(store.setItemAsync).toHaveBeenCalledWith('growth.session_id', 'old-sid');
    expect(store.setItemAsync).toHaveBeenCalledWith('growth.user_id', 'old-uid');
    expect(store.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('clears the session when refresh is explicitly rejected (401)', async () => {
    const fake = makeFakeInstance();
    const { client, axios, store } = freshClient(fake);
    axios.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 401, data: { code: 'unauthorized', message: 'invalid refresh token' } },
      message: 'Request failed with status code 401',
    });
    client.getApiClient();

    await expect(fake.responseErrorHandler()(unauthorized())).rejects.toMatchObject({
      status: 401,
    });
    expect(store.deleteItemAsync).toHaveBeenCalledWith('growth.refresh_token');
    expect(store.deleteItemAsync).toHaveBeenCalledWith('growth.session_id');
    expect(store.deleteItemAsync).toHaveBeenCalledWith('growth.user_id');
  });

  it('keeps the session when refresh fails on a network error', async () => {
    const fake = makeFakeInstance();
    const { client, axios, store } = freshClient(fake);
    axios.post.mockRejectedValue({
      isAxiosError: true,
      message: 'Network Error',
    });
    client.getApiClient();

    await expect(fake.responseErrorHandler()(unauthorized())).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
    // Transient failure must NOT wipe the persisted session.
    expect(store.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('keeps the session when refresh gets a 5xx', async () => {
    const fake = makeFakeInstance();
    const { client, axios, store } = freshClient(fake);
    axios.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 503, data: { code: 'unavailable', message: 'down' } },
      message: 'Request failed with status code 503',
    });
    client.getApiClient();

    await expect(fake.responseErrorHandler()(unauthorized())).rejects.toMatchObject({
      status: 503,
    });
    expect(store.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('rejects a malformed refresh response without clearing the session', async () => {
    const fake = makeFakeInstance();
    const { client, axios, store } = freshClient(fake);
    // Missing accessToken — the exact bug shape that used to wipe sessions.
    axios.post.mockResolvedValue({
      data: { refreshToken: 'new-rt' },
    });
    client.getApiClient();

    await expect(fake.responseErrorHandler()(unauthorized())).rejects.toMatchObject({
      code: 'MALFORMED_REFRESH_RESPONSE',
    });
    expect(store.deleteItemAsync).not.toHaveBeenCalled();
    expect(store.setItemAsync).not.toHaveBeenCalledWith('growth.refresh_token', 'new-rt');
  });

  it('shares one refresh call across concurrent 401s (single-flight)', async () => {
    const fake = makeFakeInstance();
    const { client, axios } = freshClient(fake);
    let resolvePost: (v: unknown) => void = () => {};
    axios.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
    );
    client.getApiClient();
    const handler = fake.responseErrorHandler();

    const p1 = handler(unauthorized('/habits'));
    const p2 = handler(unauthorized('/goals'));
    // Let the refresh IIFE reach axios.post (the resolvePost capture happens
    // inside a pending-promise executor that only runs on a later tick).
    await new Promise((r) => setTimeout(r, 0));
    resolvePost({
      data: { accessToken: 'at', refreshToken: 'rt', user: { id: 'u' } },
    });
    await Promise.all([p1, p2]);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(fake.inst.request).toHaveBeenCalledTimes(2);
  });
});
