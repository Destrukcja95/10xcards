import { describe, it, expect } from 'vitest';
import {
  getFlashcardsQuerySchema,
  createFlashcardSchema,
  createFlashcardsSchema,
  flashcardIdParamSchema,
  updateFlashcardSchema,
} from './flashcards.schema';

describe('flashcards.schema', () => {
  // ============================================================================
  // getFlashcardsQuerySchema
  // ============================================================================
  describe('getFlashcardsQuerySchema', () => {
    it('should use default values when no params provided', () => {
      const result = getFlashcardsQuerySchema.parse({});

      expect(result).toEqual({
        page: 1,
        limit: 20,
        sort: 'created_at',
        order: 'desc',
      });
    });

    it('should parse valid string page and limit values', () => {
      const result = getFlashcardsQuerySchema.parse({
        page: '3',
        limit: '50',
      });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(50);
    });

    it('should accept valid sort options', () => {
      const sortOptions = ['created_at', 'updated_at', 'next_review_date'] as const;

      for (const sort of sortOptions) {
        const result = getFlashcardsQuerySchema.parse({ sort });
        expect(result.sort).toBe(sort);
      }
    });

    it('should accept valid order options', () => {
      const result1 = getFlashcardsQuerySchema.parse({ order: 'asc' });
      const result2 = getFlashcardsQuerySchema.parse({ order: 'desc' });

      expect(result1.order).toBe('asc');
      expect(result2.order).toBe('desc');
    });

    it('should reject page less than 1', () => {
      expect(() => getFlashcardsQuerySchema.parse({ page: '0' })).toThrow('Page must be at least 1');
    });

    it('should reject limit greater than 100', () => {
      expect(() => getFlashcardsQuerySchema.parse({ limit: '101' })).toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should reject invalid sort option', () => {
      expect(() => getFlashcardsQuerySchema.parse({ sort: 'invalid' })).toThrow();
    });
  });

  // ============================================================================
  // createFlashcardSchema
  // ============================================================================
  describe('createFlashcardSchema', () => {
    it('should accept valid flashcard data', () => {
      const validData = {
        front: 'What is TypeScript?',
        back: 'TypeScript is a typed superset of JavaScript.',
        source: 'manual' as const,
      };

      const result = createFlashcardSchema.parse(validData);

      expect(result).toEqual(validData);
    });

    it('should accept ai_generated source', () => {
      const result = createFlashcardSchema.parse({
        front: 'Question',
        back: 'Answer',
        source: 'ai_generated',
      });

      expect(result.source).toBe('ai_generated');
    });

    it('should reject empty front text', () => {
      expect(() =>
        createFlashcardSchema.parse({
          front: '',
          back: 'Answer',
          source: 'manual',
        })
      ).toThrow('Front text is required');
    });

    it('should reject empty back text', () => {
      expect(() =>
        createFlashcardSchema.parse({
          front: 'Question',
          back: '',
          source: 'manual',
        })
      ).toThrow('Back text is required');
    });

    it('should reject front text exceeding 500 characters', () => {
      const longFront = 'a'.repeat(501);

      expect(() =>
        createFlashcardSchema.parse({
          front: longFront,
          back: 'Answer',
          source: 'manual',
        })
      ).toThrow('Front text must be at most 500 characters');
    });

    it('should reject back text exceeding 1000 characters', () => {
      const longBack = 'a'.repeat(1001);

      expect(() =>
        createFlashcardSchema.parse({
          front: 'Question',
          back: longBack,
          source: 'manual',
        })
      ).toThrow('Back text must be at most 1000 characters');
    });

    it('should reject invalid source value', () => {
      expect(() =>
        createFlashcardSchema.parse({
          front: 'Question',
          back: 'Answer',
          source: 'invalid',
        })
      ).toThrow("Source must be 'ai_generated' or 'manual'");
    });

    it('should accept front text at maximum 500 characters', () => {
      const maxFront = 'a'.repeat(500);

      const result = createFlashcardSchema.parse({
        front: maxFront,
        back: 'Answer',
        source: 'manual',
      });

      expect(result.front.length).toBe(500);
    });

    it('should accept back text at maximum 1000 characters', () => {
      const maxBack = 'a'.repeat(1000);

      const result = createFlashcardSchema.parse({
        front: 'Question',
        back: maxBack,
        source: 'manual',
      });

      expect(result.back.length).toBe(1000);
    });
  });

  // ============================================================================
  // createFlashcardsSchema
  // ============================================================================
  describe('createFlashcardsSchema', () => {
    it('should accept array with one valid flashcard', () => {
      const result = createFlashcardsSchema.parse({
        flashcards: [
          {
            front: 'Question 1',
            back: 'Answer 1',
            source: 'manual',
          },
        ],
      });

      expect(result.flashcards).toHaveLength(1);
    });

    it('should accept array with multiple valid flashcards', () => {
      const flashcards = Array.from({ length: 10 }, (_, i) => ({
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
        source: 'ai_generated' as const,
      }));

      const result = createFlashcardsSchema.parse({ flashcards });

      expect(result.flashcards).toHaveLength(10);
    });

    it('should reject empty flashcards array', () => {
      expect(() => createFlashcardsSchema.parse({ flashcards: [] })).toThrow(
        'At least one flashcard is required'
      );
    });

    it('should reject array exceeding 100 flashcards', () => {
      const flashcards = Array.from({ length: 101 }, (_, i) => ({
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
        source: 'manual' as const,
      }));

      expect(() => createFlashcardsSchema.parse({ flashcards })).toThrow(
        'Maximum 100 flashcards can be created at once'
      );
    });

    it('should accept exactly 100 flashcards', () => {
      const flashcards = Array.from({ length: 100 }, (_, i) => ({
        front: `Question ${i + 1}`,
        back: `Answer ${i + 1}`,
        source: 'manual' as const,
      }));

      const result = createFlashcardsSchema.parse({ flashcards });

      expect(result.flashcards).toHaveLength(100);
    });

    it('should reject if any flashcard in array is invalid', () => {
      expect(() =>
        createFlashcardsSchema.parse({
          flashcards: [
            { front: 'Valid', back: 'Valid', source: 'manual' },
            { front: '', back: 'Valid', source: 'manual' }, // Invalid
          ],
        })
      ).toThrow();
    });
  });

  // ============================================================================
  // flashcardIdParamSchema
  // ============================================================================
  describe('flashcardIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';

      const result = flashcardIdParamSchema.parse({ id: validUUID });

      expect(result.id).toBe(validUUID);
    });

    it('should reject invalid UUID format', () => {
      expect(() => flashcardIdParamSchema.parse({ id: 'not-a-uuid' })).toThrow(
        'Invalid flashcard ID format'
      );
    });

    it('should reject empty string', () => {
      expect(() => flashcardIdParamSchema.parse({ id: '' })).toThrow('Invalid flashcard ID format');
    });

    it('should reject UUID with incorrect version format', () => {
      expect(() => flashcardIdParamSchema.parse({ id: '12345678-1234-1234-1234-123456789' })).toThrow(
        'Invalid flashcard ID format'
      );
    });
  });

  // ============================================================================
  // updateFlashcardSchema
  // ============================================================================
  describe('updateFlashcardSchema', () => {
    it('should accept update with only front field', () => {
      const result = updateFlashcardSchema.parse({
        front: 'Updated question',
      });

      expect(result).toEqual({ front: 'Updated question' });
    });

    it('should accept update with only back field', () => {
      const result = updateFlashcardSchema.parse({
        back: 'Updated answer',
      });

      expect(result).toEqual({ back: 'Updated answer' });
    });

    it('should accept update with both fields', () => {
      const result = updateFlashcardSchema.parse({
        front: 'Updated question',
        back: 'Updated answer',
      });

      expect(result).toEqual({
        front: 'Updated question',
        back: 'Updated answer',
      });
    });

    it('should reject update with no fields provided', () => {
      expect(() => updateFlashcardSchema.parse({})).toThrow(
        'At least one field (front or back) must be provided'
      );
    });

    it('should reject empty front text', () => {
      expect(() => updateFlashcardSchema.parse({ front: '' })).toThrow('Front text cannot be empty');
    });

    it('should reject empty back text', () => {
      expect(() => updateFlashcardSchema.parse({ back: '' })).toThrow('Back text cannot be empty');
    });

    it('should reject front text exceeding 500 characters', () => {
      const longFront = 'a'.repeat(501);

      expect(() => updateFlashcardSchema.parse({ front: longFront })).toThrow(
        'Front text must be at most 500 characters'
      );
    });

    it('should reject back text exceeding 1000 characters', () => {
      const longBack = 'a'.repeat(1001);

      expect(() => updateFlashcardSchema.parse({ back: longBack })).toThrow(
        'Back text must be at most 1000 characters'
      );
    });
  });
});

