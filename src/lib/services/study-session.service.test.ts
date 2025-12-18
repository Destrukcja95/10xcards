import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudySessionService } from './study-session.service';
import type { SupabaseClient } from '../../db/supabase.client';

// Helper to create mock Supabase client
const createMockSupabase = () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockLte = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockSingle = vi.fn();
  const mockUpdate = vi.fn();

  // Chain methods
  mockSelect.mockReturnThis();
  mockEq.mockReturnThis();
  mockLte.mockReturnThis();
  mockOrder.mockReturnThis();
  mockLimit.mockReturnThis();
  mockUpdate.mockReturnThis();

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    eq: mockEq,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    update: mockUpdate,
  }));

  return {
    from: mockFrom,
    _mocks: {
      mockFrom,
      mockSelect,
      mockEq,
      mockLte,
      mockOrder,
      mockLimit,
      mockSingle,
      mockUpdate,
    },
  } as unknown as SupabaseClient & { _mocks: Record<string, ReturnType<typeof vi.fn>> };
};

describe('StudySessionService', () => {
  let service: StudySessionService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new StudySessionService(mockSupabase);
  });

  // ============================================================================
  // SM-2 Algorithm Tests - Using private method via reviewFlashcard
  // We test the algorithm through its effects on the database update
  // ============================================================================
  describe('SM-2 Algorithm (calculateSM2)', () => {
    // Helper to test SM-2 calculations by mocking current state and capturing update
    const testSM2Calculation = async (
      currentState: { ease_factor: number; interval: number; repetition_count: number },
      rating: number
    ) => {
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUserId = 'user-123';
      let capturedUpdate: Record<string, unknown> | null = null;

      // Setup mock chain for fetching current flashcard
      const fetchMock = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: currentState,
          error: null,
        }),
      };

      // Setup mock chain for update
      const updateMock = {
        update: vi.fn().mockImplementation((data: Record<string, unknown>) => {
          capturedUpdate = data;
          return updateMock;
        }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockFlashcardId,
            ...capturedUpdate,
          },
          error: null,
        }),
      };

      // Track call count to differentiate between fetch and update
      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) return fetchMock as unknown as ReturnType<SupabaseClient['from']>;
        return updateMock as unknown as ReturnType<SupabaseClient['from']>;
      });

      await service.reviewFlashcard(mockUserId, {
        flashcard_id: mockFlashcardId,
        rating,
      });

      return capturedUpdate as {
        ease_factor: number;
        interval: number;
        repetition_count: number;
        next_review_date: string;
        last_reviewed_at: string;
      };
    };

    describe('Correct answers (rating >= 3)', () => {
      it('TC-STUDY-003: rating 5 on first review should set interval=1, repetition_count=1', async () => {
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 0, repetition_count: 0 },
          5
        );

        expect(result.repetition_count).toBe(1);
        expect(result.interval).toBe(1);
        // EF should increase: 2.5 + 0.1 - 0*(0.08 + 0*0.02) = 2.6
        expect(result.ease_factor).toBeCloseTo(2.6, 2);
      });

      it('TC-STUDY-003: rating 4 on second review should set interval=6, repetition_count=2', async () => {
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 1, repetition_count: 1 },
          4
        );

        expect(result.repetition_count).toBe(2);
        expect(result.interval).toBe(6);
        // EF: 2.5 + 0.1 - 1*(0.08 + 1*0.02) = 2.5 + 0.1 - 0.1 = 2.5
        expect(result.ease_factor).toBeCloseTo(2.5, 2);
      });

      it('TC-STUDY-003: rating 3 on third+ review should multiply interval by ease_factor', async () => {
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 6, repetition_count: 2 },
          3
        );

        expect(result.repetition_count).toBe(3);
        // interval = round(6 * 2.36) = round(14.16) = 14 (after EF adjustment)
        // Note: EF is adjusted AFTER interval calculation in SM-2
        // EF: 2.5 + 0.1 - 2*(0.08 + 2*0.02) = 2.5 + 0.1 - 0.24 = 2.36
        // But interval uses OLD ease_factor: round(6 * 2.5) = 15
        expect(result.interval).toBe(15);
        expect(result.ease_factor).toBeCloseTo(2.36, 2);
      });

      it('rating 5 should maximally increase ease_factor', async () => {
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 6, repetition_count: 2 },
          5
        );

        // EF: 2.5 + 0.1 - 0*(0.08 + 0*0.02) = 2.6
        expect(result.ease_factor).toBeCloseTo(2.6, 2);
      });
    });

    describe('Incorrect answers (rating < 3)', () => {
      it('TC-STUDY-004: rating 0 should reset repetition_count and interval', async () => {
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 15, repetition_count: 5 },
          0
        );

        expect(result.repetition_count).toBe(0);
        expect(result.interval).toBe(1);
        // EF: 2.5 + 0.1 - 5*(0.08 + 5*0.02) = 2.5 + 0.1 - 0.9 = 1.7
        expect(result.ease_factor).toBeCloseTo(1.7, 2);
      });

      it('TC-STUDY-004: rating 1 should reset repetition_count and interval', async () => {
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 15, repetition_count: 5 },
          1
        );

        expect(result.repetition_count).toBe(0);
        expect(result.interval).toBe(1);
        // EF: 2.5 + 0.1 - 4*(0.08 + 4*0.02) = 2.5 + 0.1 - 0.64 = 1.96
        expect(result.ease_factor).toBeCloseTo(1.96, 2);
      });

      it('TC-STUDY-004: rating 2 should reset repetition_count and interval', async () => {
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 15, repetition_count: 5 },
          2
        );

        expect(result.repetition_count).toBe(0);
        expect(result.interval).toBe(1);
        // EF: 2.5 + 0.1 - 3*(0.08 + 3*0.02) = 2.5 + 0.1 - 0.42 = 2.18
        expect(result.ease_factor).toBeCloseTo(2.18, 2);
      });
    });

    describe('Edge cases', () => {
      it('TC-STUDY-005: ease_factor should never drop below 1.30', async () => {
        // Start with very low ease_factor
        const result = await testSM2Calculation(
          { ease_factor: 1.35, interval: 1, repetition_count: 0 },
          0
        );

        // EF: 1.35 + 0.1 - 5*(0.08 + 5*0.02) = 1.35 + 0.1 - 0.9 = 0.55
        // Should be clamped to 1.30
        expect(result.ease_factor).toBe(1.3);
      });

      it('TC-STUDY-005: multiple failures should not reduce ease_factor below 1.30', async () => {
        // Simulate multiple failures
        let currentState = { ease_factor: 2.5, interval: 15, repetition_count: 5 };

        for (let i = 0; i < 5; i++) {
          const result = await testSM2Calculation(currentState, 0);
          currentState = {
            ease_factor: result.ease_factor,
            interval: result.interval,
            repetition_count: result.repetition_count,
          };
        }

        expect(currentState.ease_factor).toBe(1.3);
      });

      it('should correctly calculate next_review_date based on interval', async () => {
        const before = new Date();
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 1, repetition_count: 1 },
          4
        );
        const after = new Date();

        // Interval should be 6 (second review)
        expect(result.interval).toBe(6);

        // next_review_date should be 6 days from now
        const nextReview = new Date(result.next_review_date);
        const expectedMin = new Date(before);
        expectedMin.setDate(expectedMin.getDate() + 6);
        const expectedMax = new Date(after);
        expectedMax.setDate(expectedMax.getDate() + 6);

        expect(nextReview.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime() - 1000);
        expect(nextReview.getTime()).toBeLessThanOrEqual(expectedMax.getTime() + 1000);
      });

      it('should set last_reviewed_at to current timestamp', async () => {
        const before = new Date();
        const result = await testSM2Calculation(
          { ease_factor: 2.5, interval: 1, repetition_count: 1 },
          4
        );
        const after = new Date();

        const lastReviewed = new Date(result.last_reviewed_at);

        expect(lastReviewed.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
        expect(lastReviewed.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
      });
    });
  });

  // ============================================================================
  // getStudySession Tests
  // ============================================================================
  describe('getStudySession', () => {
    it('should return flashcards due for review', async () => {
      const mockUserId = 'user-123';
      const mockFlashcards = [
        { id: '1', front: 'Q1', back: 'A1', ease_factor: 2.5, interval: 1, repetition_count: 0 },
        { id: '2', front: 'Q2', back: 'A2', ease_factor: 2.5, interval: 1, repetition_count: 0 },
      ];

      // Setup mock chain
      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // Count query
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockResolvedValue({ count: 10, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        // Data query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockFlashcards, error: null }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getStudySession(mockUserId, { limit: 20 });

      expect(result.data).toEqual(mockFlashcards);
      expect(result.count).toBe(2);
      expect(result.total_due).toBe(10);
    });

    it('TC-STUDY-006: should return empty array when no flashcards due', async () => {
      const mockUserId = 'user-123';

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockResolvedValue({ count: 0, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getStudySession(mockUserId, { limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.total_due).toBe(0);
    });

    it('should throw error on database failure', async () => {
      const mockUserId = 'user-123';

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          count: null,
          error: { message: 'Connection error' },
        }),
      })) as unknown as SupabaseClient['from'];

      await expect(service.getStudySession(mockUserId, { limit: 20 })).rejects.toThrow(
        'Database error: Connection error'
      );
    });
  });

  // ============================================================================
  // reviewFlashcard Tests
  // ============================================================================
  describe('reviewFlashcard', () => {
    it('should return null when flashcard not found', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      })) as unknown as SupabaseClient['from'];

      const result = await service.reviewFlashcard(mockUserId, {
        flashcard_id: mockFlashcardId,
        rating: 4,
      });

      expect(result).toBeNull();
    });

    it('should throw error on database update failure', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { ease_factor: 2.5, interval: 1, repetition_count: 0 },
              error: null,
            }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Update failed' },
          }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      await expect(
        service.reviewFlashcard(mockUserId, {
          flashcard_id: mockFlashcardId,
          rating: 4,
        })
      ).rejects.toThrow('Database error: Update failed');
    });
  });
});

