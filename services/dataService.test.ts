import AsyncStorage from '@react-native-async-storage/async-storage';
import MockAdapter from 'axios-mock-adapter';
import api from './api';
import { DataService } from './dataService';

const mock = new MockAdapter(api);

beforeEach(() => {
  mock.reset();
});

afterAll(() => {
  mock.restore();
});

describe('DataService.getDashboardStats', () => {
  it('GETs /api/v1/dashboard/stats and fills trend defaults when absent', async () => {
    mock.onGet('/api/v1/dashboard/stats').reply(200, {
      totalStaff: 10,
      staffTrend: '+2 this week',
      activeSchedules: 5,
      notificationsSent: 12,
      totalDocuments: 3,
    });

    const stats = await DataService.getDashboardStats();

    expect(stats.totalStaff).toBe(10);
    expect(stats.staffTrend).toBe('+2 this week');
    expect(stats.schedulesTrend).toBe('Updated recently');
    expect(stats.notificationsTrend).toBe('this week');
    expect(stats.documentsTrend).toBe('added recently');
    expect(stats.chartData).toEqual([]);
  });

  it('throws on 500', async () => {
    mock.onGet('/api/v1/dashboard/stats').reply(500, { detail: 'boom' });

    await expect(DataService.getDashboardStats()).rejects.toMatchObject({
      status: 500,
    });
  });
});

describe('DataService.createPoll', () => {
  it('POSTs to /api/v1/polls with the body passed in', async () => {
    let capturedBody: Record<string, unknown> | undefined;
    mock.onPost('/api/v1/polls').reply((config) => {
      capturedBody = JSON.parse(config.data);
      return [200, { id: 1, title: 'Favorite color?', options: [], isActive: true, totalVotes: 0, createdAt: '' }];
    });

    await DataService.createPoll({
      title: 'Favorite color?',
      description: 'pick one',
      options: [
        { id: 1, text: 'red' },
        { id: 2, text: 'blue' },
      ],
      expires_at: '2026-12-31T00:00:00Z',
    });

    expect(capturedBody).toMatchObject({
      title: 'Favorite color?',
      description: 'pick one',
      expires_at: '2026-12-31T00:00:00Z',
    });
    expect(capturedBody?.options).toHaveLength(2);
  });
});

describe('DataService.getNotifications', () => {
  it('adds time, read, sender derived fields', async () => {
    mock.onGet('/api/v1/notifications').reply(200, [
      {
        id: '42',
        title: 'Hi',
        message: 'hello',
        type: 'info',
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ]);

    const result = await DataService.getNotifications();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '42',
      read: false,
      sender: 'System',
    });
    expect(typeof result[0].time).toBe('string');
  });
});

describe('DataService.uploadFile', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * `uploadFile` uses `fetch` (not axios) so the axios 401 interceptor
   * cannot clear the stored token for it. Bug 1 fix: call `forceLogoutOn401`
   * inline on 401 so an expired token during upload doesn't leave the user
   * pseudo-logged-in.
   */
  it('clears persisted auth on 401 and throws', async () => {
    await AsyncStorage.setItem('auth_token', 'jwt-stale');
    await AsyncStorage.setItem('user', JSON.stringify({ id: 'u1' }));

    // First fetch call is the blob fetch from fileAsset.uri; second is the upload.
    global.fetch = jest
      .fn()
      // blob fetch
      .mockResolvedValueOnce({
        blob: async () => new Blob(['hi'], { type: 'text/plain' }),
      })
      // upload POST → 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Token expired' }),
      }) as unknown as typeof fetch;

    await expect(
      DataService.uploadFile({ uri: 'file://x', name: 'a.txt', type: 'text/plain' }),
    ).rejects.toMatchObject({ message: 'Token expired' });

    // Bug 1 core assertion: token + user are gone even though the upload went
    // through `fetch`, not axios.
    expect(await AsyncStorage.getItem('auth_token')).toBeNull();
    expect(await AsyncStorage.getItem('user')).toBeNull();
  });

  it('falls back to statusText on a non-JSON error body (no SyntaxError)', async () => {
    await AsyncStorage.setItem('auth_token', 'jwt-ok');

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        blob: async () => new Blob(['hi'], { type: 'text/plain' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        // Simulates an HTML body from a reverse proxy
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      }) as unknown as typeof fetch;

    const err = await DataService.uploadFile({
      uri: 'file://x',
      name: 'a.txt',
      type: 'text/plain',
    }).catch((e) => e);

    // handleApiError wraps the Error → { message, ... }
    expect(err).toBeDefined();
    expect(err.message).toBe('Bad Gateway');
  });
});
