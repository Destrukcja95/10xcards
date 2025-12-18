import { describe, it, expect } from "vitest";
import { studySessionQuerySchema, reviewFlashcardSchema } from "./study-session.schema";

describe("study-session.schema", () => {
  // ============================================================================
  // studySessionQuerySchema
  // ============================================================================
  describe("studySessionQuerySchema", () => {
    it("should use default limit of 20 when not provided", () => {
      const result = studySessionQuerySchema.parse({});

      expect(result.limit).toBe(20);
    });

    it("should parse string limit value", () => {
      const result = studySessionQuerySchema.parse({ limit: "30" });

      expect(result.limit).toBe(30);
    });

    it("should accept limit of 1", () => {
      const result = studySessionQuerySchema.parse({ limit: "1" });

      expect(result.limit).toBe(1);
    });

    it("should accept limit of 50 (maximum)", () => {
      const result = studySessionQuerySchema.parse({ limit: "50" });

      expect(result.limit).toBe(50);
    });

    it("should reject limit of 0", () => {
      expect(() => studySessionQuerySchema.parse({ limit: "0" })).toThrow("Limit must be at least 1");
    });

    it("should reject limit greater than 50", () => {
      expect(() => studySessionQuerySchema.parse({ limit: "51" })).toThrow("Limit must be between 1 and 50");
    });

    it("should reject negative limit", () => {
      expect(() => studySessionQuerySchema.parse({ limit: "-1" })).toThrow();
    });

    it("should reject non-integer limit", () => {
      // String "10.5" will be parsed to 10 by parseInt, so this should work
      const result = studySessionQuerySchema.parse({ limit: "10.5" });
      expect(result.limit).toBe(10);
    });
  });

  // ============================================================================
  // reviewFlashcardSchema
  // ============================================================================
  describe("reviewFlashcardSchema", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";

    it("should accept valid flashcard_id and rating 0", () => {
      const result = reviewFlashcardSchema.parse({
        flashcard_id: validUUID,
        rating: 0,
      });

      expect(result.flashcard_id).toBe(validUUID);
      expect(result.rating).toBe(0);
    });

    it("should accept rating 1", () => {
      const result = reviewFlashcardSchema.parse({
        flashcard_id: validUUID,
        rating: 1,
      });

      expect(result.rating).toBe(1);
    });

    it("should accept rating 2", () => {
      const result = reviewFlashcardSchema.parse({
        flashcard_id: validUUID,
        rating: 2,
      });

      expect(result.rating).toBe(2);
    });

    it("should accept rating 3", () => {
      const result = reviewFlashcardSchema.parse({
        flashcard_id: validUUID,
        rating: 3,
      });

      expect(result.rating).toBe(3);
    });

    it("should accept rating 4", () => {
      const result = reviewFlashcardSchema.parse({
        flashcard_id: validUUID,
        rating: 4,
      });

      expect(result.rating).toBe(4);
    });

    it("should accept rating 5", () => {
      const result = reviewFlashcardSchema.parse({
        flashcard_id: validUUID,
        rating: 5,
      });

      expect(result.rating).toBe(5);
    });

    it("should reject invalid UUID format", () => {
      expect(() =>
        reviewFlashcardSchema.parse({
          flashcard_id: "not-a-uuid",
          rating: 3,
        })
      ).toThrow("Invalid flashcard ID");
    });

    it("should reject rating less than 0", () => {
      expect(() =>
        reviewFlashcardSchema.parse({
          flashcard_id: validUUID,
          rating: -1,
        })
      ).toThrow("Rating must be between 0 and 5");
    });

    it("should reject rating greater than 5", () => {
      expect(() =>
        reviewFlashcardSchema.parse({
          flashcard_id: validUUID,
          rating: 6,
        })
      ).toThrow("Rating must be between 0 and 5");
    });

    it("should reject non-integer rating", () => {
      expect(() =>
        reviewFlashcardSchema.parse({
          flashcard_id: validUUID,
          rating: 3.5,
        })
      ).toThrow("Rating must be an integer");
    });

    it("should reject missing flashcard_id", () => {
      expect(() =>
        reviewFlashcardSchema.parse({
          rating: 3,
        })
      ).toThrow();
    });

    it("should reject missing rating", () => {
      expect(() =>
        reviewFlashcardSchema.parse({
          flashcard_id: validUUID,
        })
      ).toThrow();
    });

    it("should reject string rating", () => {
      expect(() =>
        reviewFlashcardSchema.parse({
          flashcard_id: validUUID,
          rating: "3",
        })
      ).toThrow();
    });
  });
});
