import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlashcardsService } from './flashcards.service';
import type { SupabaseClient } from '../../db/supabase.client';

// Helper to create mock Supabase client with chainable methods
const createMockSupabase = () => {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient;
};

describe('FlashcardsService', () => {
  let service: FlashcardsService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new FlashcardsService(mockSupabase);
  });

  // ============================================================================
  // TC-FLASH-006: getFlashcards
  // ============================================================================
  describe('getFlashcards', () => {
    it('should return paginated flashcards with correct metadata', async () => {
      const mockUserId = 'user-123';
      const mockFlashcards = [
        {
          id: '1',
          front: 'Q1',
          back: 'A1',
          source: 'manual',
          ease_factor: 2.5,
          interval: 1,
          repetition_count: 0,
          next_review_date: '2024-01-15T00:00:00Z',
          last_reviewed_at: null,
          created_at: '2024-01-10T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z',
        },
      ];

      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // Count query
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 25, error: null }),
          } as unknown as ReturnType<SupabaseClient['from']>;
        }
        // Data query
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockFlashcards, error: null }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getFlashcards(mockUserId, {
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
      });

      expect(result.data).toEqual(mockFlashcards);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        total_pages: 2,
      });
    });

    it('should calculate correct offset for pagination', async () => {
      const mockUserId = 'user-123';

      let capturedRange: [number, number] | null = null;

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function (this: unknown) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockImplementation((start: number, end: number) => {
              capturedRange = [start, end];
              return Promise.resolve({ data: [], error: null });
            }),
            count: 50,
            error: null,
          };
        }),
      })) as unknown as SupabaseClient['from'];

      // Page 3 with limit 20 should start at offset 40
      await service.getFlashcards(mockUserId, {
        page: 3,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
      });

      expect(capturedRange).toEqual([40, 59]);
    });

    it('should return empty array for page beyond data', async () => {
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
          range: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as unknown as ReturnType<SupabaseClient['from']>;
      });

      const result = await service.getFlashcards(mockUserId, {
        page: 100,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
      });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(10);
    });

    it('should throw error on count query failure', async () => {
      const mockUserId = 'user-123';

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          count: null,
          error: { message: 'Database connection failed' },
        }),
      })) as unknown as SupabaseClient['from'];

      await expect(
        service.getFlashcards(mockUserId, {
          page: 1,
          limit: 20,
          sort: 'created_at',
          order: 'desc',
        })
      ).rejects.toThrow('Database error: Database connection failed');
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

      await expect(
        service.getFlashcards(mockUserId, {
          page: 1,
          limit: 20,
          sort: 'created_at',
          order: 'desc',
        })
      ).rejects.toThrow('Database error: Query failed');
    });
  });

  // ============================================================================
  // TC-FLASH-006: createFlashcards
  // ============================================================================
  describe('createFlashcards', () => {
    it('should create flashcards with user_id and return created data', async () => {
      const mockUserId = 'user-123';
      const mockCreatedFlashcards = [
        {
          id: 'new-1',
          front: 'Question 1',
          back: 'Answer 1',
          source: 'manual',
          ease_factor: 2.5,
          interval: 0,
          repetition_count: 0,
          next_review_date: '2024-01-15T00:00:00Z',
          last_reviewed_at: null,
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
      ];

      let capturedInsert: unknown[] | null = null;

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockImplementation((data: unknown[]) => {
          capturedInsert = data;
          return {
            select: vi.fn().mockResolvedValue({
              data: mockCreatedFlashcards,
              error: null,
            }),
          };
        }),
      })) as unknown as SupabaseClient['from'];

      const result = await service.createFlashcards(mockUserId, {
        flashcards: [{ front: 'Question 1', back: 'Answer 1', source: 'manual' }],
      });

      expect(result).toEqual(mockCreatedFlashcards);
      expect(capturedInsert).toEqual([
        {
          user_id: 'user-123',
          front: 'Question 1',
          back: 'Answer 1',
          source: 'manual',
        },
      ]);
    });

    it('should create multiple flashcards at once', async () => {
      const mockUserId = 'user-123';
      const inputFlashcards = [
        { front: 'Q1', back: 'A1', source: 'ai_generated' as const },
        { front: 'Q2', back: 'A2', source: 'ai_generated' as const },
        { front: 'Q3', back: 'A3', source: 'ai_generated' as const },
      ];

      let capturedInsert: unknown[] | null = null;

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockImplementation((data: unknown[]) => {
          capturedInsert = data;
          return {
            select: vi.fn().mockResolvedValue({
              data: data.map((d: object, i) => ({ ...d, id: `new-${i + 1}` })),
              error: null,
            }),
          };
        }),
      })) as unknown as SupabaseClient['from'];

      const result = await service.createFlashcards(mockUserId, {
        flashcards: inputFlashcards,
      });

      expect(result).toHaveLength(3);
      expect(capturedInsert).toHaveLength(3);
      expect(capturedInsert![0]).toHaveProperty('user_id', mockUserId);
    });

    it('should throw error on insert failure', async () => {
      const mockUserId = 'user-123';

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
          }),
        }),
      })) as unknown as SupabaseClient['from'];

      await expect(
        service.createFlashcards(mockUserId, {
          flashcards: [{ front: 'Q', back: 'A', source: 'manual' }],
        })
      ).rejects.toThrow('Database error: Insert failed');
    });
  });

  // ============================================================================
  // TC-FLASH-006: getFlashcardById
  // ============================================================================
  describe('getFlashcardById', () => {
    it('should return flashcard when found', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';
      const mockFlashcard = {
        id: mockFlashcardId,
        front: 'Question',
        back: 'Answer',
        source: 'manual',
        ease_factor: 2.5,
        interval: 1,
        repetition_count: 0,
        next_review_date: '2024-01-15T00:00:00Z',
        last_reviewed_at: null,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
      };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFlashcard, error: null }),
      })) as unknown as SupabaseClient['from'];

      const result = await service.getFlashcardById(mockUserId, mockFlashcardId);

      expect(result).toEqual(mockFlashcard);
    });

    it('should return null when flashcard not found (PGRST116)', async () => {
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

      const result = await service.getFlashcardById(mockUserId, mockFlashcardId);

      expect(result).toBeNull();
    });

    it('should throw error on other database errors', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER_ERROR', message: 'Connection failed' },
        }),
      })) as unknown as SupabaseClient['from'];

      await expect(service.getFlashcardById(mockUserId, mockFlashcardId)).rejects.toThrow(
        'Database error: Connection failed'
      );
    });
  });

  // ============================================================================
  // TC-FLASH-006: deleteFlashcard
  // ============================================================================
  describe('deleteFlashcard', () => {
    it('should return true when flashcard is deleted', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      // Chain: delete().eq().eq() - need two chainable eq calls
      const mockEq2 = vi.fn().mockResolvedValue({ error: null, count: 1 });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });

      mockSupabase.from = vi.fn(() => ({
        delete: mockDelete,
      })) as unknown as SupabaseClient['from'];

      const result = await service.deleteFlashcard(mockUserId, mockFlashcardId);

      expect(result).toBe(true);
    });

    it('should return false when flashcard not found', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      const mockEq2 = vi.fn().mockResolvedValue({ error: null, count: 0 });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });

      mockSupabase.from = vi.fn(() => ({
        delete: mockDelete,
      })) as unknown as SupabaseClient['from'];

      const result = await service.deleteFlashcard(mockUserId, mockFlashcardId);

      expect(result).toBe(false);
    });

    it('should throw error on delete failure', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      const mockEq2 = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
        count: null,
      });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });

      mockSupabase.from = vi.fn(() => ({
        delete: mockDelete,
      })) as unknown as SupabaseClient['from'];

      await expect(service.deleteFlashcard(mockUserId, mockFlashcardId)).rejects.toThrow(
        'Database error: Delete failed'
      );
    });
  });

  // ============================================================================
  // TC-FLASH-006: updateFlashcard
  // ============================================================================
  describe('updateFlashcard', () => {
    it('should update flashcard and return updated data', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';
      const mockUpdatedFlashcard = {
        id: mockFlashcardId,
        front: 'Updated Question',
        back: 'Answer',
        source: 'manual',
        ease_factor: 2.5,
        interval: 1,
        repetition_count: 0,
        next_review_date: '2024-01-15T00:00:00Z',
        last_reviewed_at: null,
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
      })) as unknown as SupabaseClient['from'];

      const result = await service.updateFlashcard(mockUserId, mockFlashcardId, {
        front: 'Updated Question',
      });

      expect(result).toEqual(mockUpdatedFlashcard);
    });

    it('should update both front and back fields', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      let capturedUpdate: object | null = null;

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockImplementation((data: object) => {
          capturedUpdate = data;
          return {
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockFlashcardId, ...data },
              error: null,
            }),
          };
        }),
      })) as unknown as SupabaseClient['from'];

      await service.updateFlashcard(mockUserId, mockFlashcardId, {
        front: 'New Front',
        back: 'New Back',
      });

      expect(capturedUpdate).toEqual({
        front: 'New Front',
        back: 'New Back',
      });
    });

    it('should return null when flashcard not found (PGRST116)', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      })) as unknown as SupabaseClient['from'];

      const result = await service.updateFlashcard(mockUserId, mockFlashcardId, {
        front: 'Updated',
      });

      expect(result).toBeNull();
    });

    it('should throw error on other database errors', async () => {
      const mockUserId = 'user-123';
      const mockFlashcardId = '123e4567-e89b-12d3-a456-426614174000';

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER_ERROR', message: 'Update failed' },
        }),
      })) as unknown as SupabaseClient['from'];

      await expect(
        service.updateFlashcard(mockUserId, mockFlashcardId, { front: 'Updated' })
      ).rejects.toThrow('Database error: Update failed');
    });
  });
});

