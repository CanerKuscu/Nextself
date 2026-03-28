import { MissionService } from '../services/missionService';
import { SupabaseService } from '@nextself/shared';
import PlatformStorage from '@nextself/shared';

jest.mock('@nextself/shared', () => ({
  ...jest.requireActual('@nextself/shared'),
  setItem: jest.fn(),
  getItem: jest.fn(),
  SupabaseService: {
    getInstance: jest.fn().mockReturnValue({
      getClient: jest.fn().mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
        },
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        rpc: jest.fn().mockResolvedValue({ error: null }),
        update: jest.fn().mockReturnThis()
      })
    })
  }
}));

jest.mock('../utils/LogManager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })
  }
}));

describe('MissionService', () => {
  let missionService: MissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    (MissionService as any).instance = undefined; // Reset singleton
    (MissionService as any).isGenerating = false;
    missionService = MissionService.getInstance();
  });

  it('should be a singleton', () => {
    const instance1 = MissionService.getInstance();
    const instance2 = MissionService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('claimMissionReward', () => {
    it('should throw an error if mission not found', async () => {
      const mockSupabase = SupabaseService.getInstance().getClient();
      ((mockSupabase as any).single as jest.Mock).mockResolvedValueOnce({ data: null, error: new Error('Not found') });

      await expect(missionService.claimMissionReward('m-1', 'daily')).rejects.toThrow('Not found');
    });

    it('should throw if mission not completed yet', async () => {
      const mockSupabase = SupabaseService.getInstance().getClient();
      ((mockSupabase as any).single as jest.Mock).mockResolvedValueOnce({
        data: { id: 'm-1', is_completed: false, current_progress: 1, target_value: 5 },
        error: null
      });

      await expect(missionService.claimMissionReward('m-1', 'daily')).rejects.toThrow('Mission not completed yet');
    });

    it('should return 0 xp and 0 points if already claimed', async () => {
      const mockSupabase = SupabaseService.getInstance().getClient();
      ((mockSupabase as any).single as jest.Mock).mockResolvedValueOnce({
        data: { id: 'm-1', completed_at: '2023-10-10T10:00:00Z' },
        error: null
      });

      const res = await missionService.claimMissionReward('m-1', 'weekly');
      expect(res).toEqual({ xp: 0, points: 0 });
    });

    it('should claim successfully and distribute rewards', async () => {
      const mockSupabase = SupabaseService.getInstance().getClient();
      ((mockSupabase as any).single as jest.Mock).mockResolvedValueOnce({
        data: { id: 'm-1', is_completed: true, current_progress: 5, target_value: 5, xp_reward: 100, points_reward: 50 },
        error: null
      });
      ((mockSupabase as any).rpc as jest.Mock).mockResolvedValue({ error: null });
      ((mockSupabase as any).update as jest.Mock).mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      });

      const res = await missionService.claimMissionReward('m-1', 'weekly');
      expect(res).toEqual({ xp: 100, points: 50 });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_xp', expect.any(Object));
      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_user_currency', expect.any(Object));
    });
  });
  
  describe('normalizeCategory', () => {
    it('should correctly normalize known categories', () => {
      expect((missionService as any).normalizeCategory('water')).toBe('hydration');
      expect((missionService as any).normalizeCategory('gym')).toBe('workout');
      expect((missionService as any).normalizeCategory('diet')).toBe('nutrition');
      expect((missionService as any).normalizeCategory('unknown_xyz')).toBe('workout'); // fallback
    });
  });
});
