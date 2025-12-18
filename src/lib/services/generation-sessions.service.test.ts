import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerationSessionsService } from './generation-sessions.service';
import type { SupabaseClient } from '../../db/supabase.client';

// Helper to create mock Supabase client
const createMockSupabase = () => {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

describe('GenerationSessionsService', () => {
  let service: GenerationSessionsService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new GenerationSessionsService(mockSupabase);
  });

  // ============================================================================
  // TC-STATS-001 & TC-STATS-002: getSessions Tests
  // ============================================================================
  describe('getSessions', () => {
    it('should return paginated sessions with summary statistics', async () => {
      const mockUserId = 'user-123';
      const mockSessions = [
        { id: '1', generated_count: 10, accepted_count: 8, created_at: '2024-01-15T00:00:00Z' },
        { id: '2', generated_count: 15, accepted_count: 10, created_at: '2024-01-14T00:00:00Z' },
      ];

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // Count query
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        if (callCount === 2) {
          // Data query
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        // Summary query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [
              { generated_count: 10, accepted_count: 8 },
              { generated_count: 15, accepted_count: 10 },
              { generated_count: 20, accepted_count: 12 },
            ],
            error: null,
          }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getSessions(mockUserId, { page: 1, limit: 20 });

      expect(result.data).toEqual(mockSessions);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 5,
        total_pages: 1,
      });
      // Summary: total_generated = 45, total_accepted = 30, rate = 66.67%
      expect(result.summary.total_generated).toBe(45);
      expect(result.summary.total_accepted).toBe(30);
      expect(result.summary.acceptance_rate).toBeCloseTo(66.67, 2);
    });

    it('TC-STATS-002: should calculate acceptance_rate correctly', async () => {
      const mockUserId = 'user-123';

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        // Summary with specific values for calculation test
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [
              { generated_count: 100, accepted_count: 75 },
              { generated_count: 50, accepted_count: 25 },
            ],
            error: null,
          }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getSessions(mockUserId, { page: 1, limit: 20 });

      // acceptance_rate = (100 / 150) * 100 = 66.67
      expect(result.summary.total_generated).toBe(150);
      expect(result.summary.total_accepted).toBe(100);
      expect(result.summary.acceptance_rate).toBeCloseTo(66.67, 2);
    });

    it('TC-STATS-002: should return 0 acceptance_rate when no generations', async () => {
      const mockUserId = 'user-123';

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        // Empty summary - handles division by zero
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getSessions(mockUserId, { page: 1, limit: 20 });

      expect(result.summary.total_generated).toBe(0);
      expect(result.summary.total_accepted).toBe(0);
      expect(result.summary.acceptance_rate).toBe(0);
    });

    it('should round acceptance_rate to 2 decimal places', async () => {
      const mockUserId = 'user-123';

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        // Summary with values that produce repeating decimal
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ generated_count: 3, accepted_count: 1 }],
            error: null,
          }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getSessions(mockUserId, { page: 1, limit: 20 });

      // 1/3 = 33.333... should round to 33.33
      expect(result.summary.acceptance_rate).toBe(33.33);
    });

    it('should calculate correct pagination for multiple pages', async () => {
      const mockUserId = 'user-123';

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 45, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getSessions(mockUserId, { page: 2, limit: 20 });

      expect(result.pagination.total).toBe(45);
      expect(result.pagination.total_pages).toBe(3); // 45/20 = 2.25 → 3
    });

    it('should throw error on count query failure', async () => {
      const mockUserId = 'user-123';

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: 'Database error' },
        }),
      })) as unknown as SupabaseClient['from'];

      await expect(service.getSessions(mockUserId, { page: 1, limit: 20 })).rejects.toThrow(
        'Database error: Database error'
      );
    });

    it('should throw error on data query failure', async () => {
      const mockUserId = 'user-123';

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Query failed' },
          }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      await expect(service.getSessions(mockUserId, { page: 1, limit: 20 })).rejects.toThrow(
        'Database error: Query failed'
      );
    });

    it('should throw error on summary query failure', async () => {
      const mockUserId = 'user-123';

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Summary query failed' },
          }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      await expect(service.getSessions(mockUserId, { page: 1, limit: 20 })).rejects.toThrow(
        'Database error: Summary query failed'
      );
    });
  });

  // ============================================================================
  // updateSession Tests
  // ============================================================================
  describe('updateSession', () => {
    it('should update session accepted_count and return updated data', async () => {
      const mockUserId = 'user-123';
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUpdatedSession = {
        id: mockSessionId,
        generated_count: 15,
        accepted_count: 12,
        created_at: '2024-01-15T00:00:00Z',
      };

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedSession, error: null }),
      })) as unknown as SupabaseClient['from'];

      const result = await service.updateSession(mockUserId, mockSessionId, {
        accepted_count: 12,
      });

      expect(result).toEqual(mockUpdatedSession);
    });

    it('should return null when session not found (PGRST116)', async () => {
      const mockUserId = 'user-123';
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      })) as unknown as SupabaseClient['from'];

      const result = await service.updateSession(mockUserId, mockSessionId, {
        accepted_count: 12,
      });

      expect(result).toBeNull();
    });

    it('should throw error on other database errors', async () => {
      const mockUserId = 'user-123';
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER', message: 'Update failed' },
        }),
      })) as unknown as SupabaseClient['from'];

      await expect(
        service.updateSession(mockUserId, mockSessionId, { accepted_count: 12 })
      ).rejects.toThrow('Database error: Update failed');
    });

    it('should update with zero accepted_count', async () => {
      const mockUserId = 'user-123';
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';

      let capturedUpdate: object | null = null;

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockImplementation((data: object) => {
          capturedUpdate = data;
          return {
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockSessionId, ...data },
              error: null,
            }),
          };
        }),
      })) as unknown as SupabaseClient['from'];

      await service.updateSession(mockUserId, mockSessionId, { accepted_count: 0 });

      expect(capturedUpdate).toEqual({ accepted_count: 0 });
    });

    it('should only update accepted_count field', async () => {
      const mockUserId = 'user-123';
      const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';

      let capturedUpdate: object | null = null;

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockImplementation((data: object) => {
          capturedUpdate = data;
          return {
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockSessionId, generated_count: 10, accepted_count: 5 },
              error: null,
            }),
          };
        }),
      })) as unknown as SupabaseClient['from'];

      await service.updateSession(mockUserId, mockSessionId, { accepted_count: 5 });

      // Should only contain accepted_count, not generated_count or other fields
      expect(capturedUpdate).toEqual({ accepted_count: 5 });
      expect(capturedUpdate).not.toHaveProperty('generated_count');
    });
  });
});

