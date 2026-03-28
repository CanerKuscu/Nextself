import { HealthService } from '../services/healthService';
import { OfflineService } from '../utils/offlineService';

jest.mock('@nextself/shared', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  SupabaseService: {
    getInstance: jest.fn(() => ({
      getClient: jest.fn(() => ({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
        },
        from: jest.fn(() => ({
          upsert: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

jest.mock('../utils/offlineService', () => ({
  OfflineService: (() => {
    const offlineMock = {
      registerSyncHandler: jest.fn(),
      queueOperation: jest.fn().mockResolvedValue('op-id'),
      syncNow: jest.fn().mockResolvedValue({ success: true, processed: 1 }),
    };
    return {
      getInstance: jest.fn(() => offlineMock),
    };
  })(),
}));

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    (HealthService as any).instance = undefined; // Reset singleton
    healthService = HealthService.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = HealthService.getInstance();
    const instance2 = HealthService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('generateHealthInsights', () => {
    it('should generate sleep warning if sleep < 6 hours', () => {
      const data = { sleepHours: 5 } as any;
      const insights = healthService.generateHealthInsights(data, 'male');
      expect(insights).toContainEqual(
        expect.objectContaining({ type: 'sleep', severity: 'warning' })
      );
    });

    it('should generate great sleep insight if sleep is 7-9 hours', () => {
      const data = { sleepHours: 8 } as any;
      const insights = healthService.generateHealthInsights(data, 'female');
      expect(insights).toContainEqual(
        expect.objectContaining({ type: 'sleep', severity: 'good', icon: 'star' })
      );
    });
  });

  describe('addToOfflineQueue', () => {
    it('should enqueue health record into shared offline service', async () => {
      await healthService.addToOfflineQueue({ test: 'new_entry' });

      const offline = (OfflineService.getInstance as jest.Mock).mock.results[0].value;
      expect(offline.queueOperation).toHaveBeenCalledWith(
        'health_records_upsert',
        expect.objectContaining({
          healthData: { test: 'new_entry' },
        })
      );
    });
  });

  describe('getEmptyHealthData', () => {
    it('should return zeroed health data', () => {
      const date = '2023-10-10';
      const result = healthService.getEmptyHealthData(date);
      expect(result).toMatchObject({
        steps: 0,
        sleepHours: 0,
        heartRate: 0,
        calories: 0,
        activeMinutes: 0,
        water: 0,
        date,
        source: 'manual',
      });
    });
  });
});
