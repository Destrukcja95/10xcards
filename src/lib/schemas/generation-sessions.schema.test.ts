import { describe, it, expect } from 'vitest';
import {
  generationSessionsQuerySchema,
  sessionIdParamSchema,
  updateSessionSchema,
} from './generation-sessions.schema';

describe('generation-sessions.schema', () => {
  // ============================================================================
  // generationSessionsQuerySchema
  // ============================================================================
  describe('generationSessionsQuerySchema', () => {
    it('should use default values when no params provided', () => {
      const result = generationSessionsQuerySchema.parse({});

      expect(result).toEqual({
        page: 1,
        limit: 20,
      });
    });

    it('should parse valid string page and limit values', () => {
      const result = generationSessionsQuerySchema.parse({
        page: '5',
        limit: '50',
      });

      expect(result.page).toBe(5);
      expect(result.limit).toBe(50);
    });

    it('should accept maximum limit of 100', () => {
      const result = generationSessionsQuerySchema.parse({ limit: '100' });

      expect(result.limit).toBe(100);
    });

    it('should accept minimum limit of 1', () => {
      const result = generationSessionsQuerySchema.parse({ limit: '1' });

      expect(result.limit).toBe(1);
    });

    it('should accept minimum page of 1', () => {
      const result = generationSessionsQuerySchema.parse({ page: '1' });

      expect(result.page).toBe(1);
    });

    it('should reject page less than 1', () => {
      expect(() => generationSessionsQuerySchema.parse({ page: '0' })).toThrow(
        'Page must be at least 1'
      );
    });

    it('should reject negative page', () => {
      expect(() => generationSessionsQuerySchema.parse({ page: '-5' })).toThrow();
    });

    it('should reject limit greater than 100', () => {
      expect(() => generationSessionsQuerySchema.parse({ limit: '101' })).toThrow(
        'Limit must be between 1 and 100'
      );
    });

    it('should reject limit less than 1', () => {
      expect(() => generationSessionsQuerySchema.parse({ limit: '0' })).toThrow();
    });
  });

  // ============================================================================
  // sessionIdParamSchema
  // ============================================================================
  describe('sessionIdParamSchema', () => {
    it('should accept valid UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';

      const result = sessionIdParamSchema.parse({ id: validUUID });

      expect(result.id).toBe(validUUID);
    });

    it('should accept UUID v4 format', () => {
      const uuidV4 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const result = sessionIdParamSchema.parse({ id: uuidV4 });

      expect(result.id).toBe(uuidV4);
    });

    it('should reject invalid UUID format', () => {
      expect(() => sessionIdParamSchema.parse({ id: 'invalid-uuid' })).toThrow(
        'Invalid session ID format'
      );
    });

    it('should reject empty string', () => {
      expect(() => sessionIdParamSchema.parse({ id: '' })).toThrow('Invalid session ID format');
    });

    it('should reject too short UUID', () => {
      expect(() => sessionIdParamSchema.parse({ id: '550e8400-e29b-41d4' })).toThrow(
        'Invalid session ID format'
      );
    });

    it('should reject UUID with wrong separator', () => {
      expect(() =>
        sessionIdParamSchema.parse({ id: '550e8400_e29b_41d4_a716_446655440000' })
      ).toThrow('Invalid session ID format');
    });

    it('should reject missing id field', () => {
      expect(() => sessionIdParamSchema.parse({})).toThrow();
    });
  });

  // ============================================================================
  // updateSessionSchema
  // ============================================================================
  describe('updateSessionSchema', () => {
    it('should accept zero accepted_count', () => {
      const result = updateSessionSchema.parse({ accepted_count: 0 });

      expect(result.accepted_count).toBe(0);
    });

    it('should accept positive accepted_count', () => {
      const result = updateSessionSchema.parse({ accepted_count: 15 });

      expect(result.accepted_count).toBe(15);
    });

    it('should accept large accepted_count', () => {
      const result = updateSessionSchema.parse({ accepted_count: 1000 });

      expect(result.accepted_count).toBe(1000);
    });

    it('should reject negative accepted_count', () => {
      expect(() => updateSessionSchema.parse({ accepted_count: -1 })).toThrow(
        'accepted_count must be non-negative'
      );
    });

    it('should reject non-integer accepted_count', () => {
      expect(() => updateSessionSchema.parse({ accepted_count: 5.5 })).toThrow(
        'accepted_count must be an integer'
      );
    });

    it('should reject missing accepted_count', () => {
      expect(() => updateSessionSchema.parse({})).toThrow();
    });

    it('should reject string accepted_count', () => {
      expect(() => updateSessionSchema.parse({ accepted_count: '10' })).toThrow();
    });

    it('should reject null accepted_count', () => {
      expect(() => updateSessionSchema.parse({ accepted_count: null })).toThrow();
    });
  });
});

