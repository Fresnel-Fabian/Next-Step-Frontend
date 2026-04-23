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
