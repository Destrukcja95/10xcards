import { describe, it, expect } from "vitest";
import { generateFlashcardsSchema } from "./generations.schema";

describe("generations.schema", () => {
  // ============================================================================
  // generateFlashcardsSchema
  // ============================================================================
  describe("generateFlashcardsSchema", () => {
    it("should accept text at minimum length (1000 characters)", () => {
      const minText = "a".repeat(1000);

      const result = generateFlashcardsSchema.parse({ source_text: minText });

      expect(result.source_text).toBe(minText);
      expect(result.source_text.length).toBe(1000);
    });

    it("should accept text at maximum length (10000 characters)", () => {
      const maxText = "a".repeat(10000);

      const result = generateFlashcardsSchema.parse({ source_text: maxText });

      expect(result.source_text).toBe(maxText);
      expect(result.source_text.length).toBe(10000);
    });

    it("should accept text within valid range", () => {
      const validText = "This is educational content about programming. ".repeat(50);
      // Ensure it's within range
      const trimmed = validText.substring(0, 5000);
      // Pad to minimum if needed
      const paddedText = trimmed.padEnd(1000, " ");

      const result = generateFlashcardsSchema.parse({ source_text: paddedText });

      expect(result.source_text.length).toBeGreaterThanOrEqual(1000);
      expect(result.source_text.length).toBeLessThanOrEqual(10000);
    });

    it("should reject text shorter than 1000 characters", () => {
      const shortText = "a".repeat(999);

      expect(() => generateFlashcardsSchema.parse({ source_text: shortText })).toThrow(
        "Source text must be at least 1000 characters"
      );
    });

    it("should reject text longer than 10000 characters", () => {
      const longText = "a".repeat(10001);

      expect(() => generateFlashcardsSchema.parse({ source_text: longText })).toThrow(
        "Source text must be at most 10000 characters"
      );
    });

    it("should reject empty text", () => {
      expect(() => generateFlashcardsSchema.parse({ source_text: "" })).toThrow(
        "Source text must be at least 1000 characters"
      );
    });

    it("should reject missing source_text field", () => {
      expect(() => generateFlashcardsSchema.parse({})).toThrow();
    });

    it("should reject non-string source_text", () => {
      expect(() => generateFlashcardsSchema.parse({ source_text: 12345 })).toThrow();
    });

    it("should accept text with exactly 1000 characters of real content", () => {
      // Simulate real educational content
      const contentBlock = `
        Machine learning is a subset of artificial intelligence (AI) that provides 
        systems the ability to automatically learn and improve from experience without 
        being explicitly programmed. Machine learning focuses on the development of 
        computer programs that can access data and use it to learn for themselves.
        The process of learning begins with observations or data, such as examples, 
        direct experience, or instruction, in order to look for patterns in data and 
        make better decisions in the future based on the examples that we provide.
      `.trim();

      // Repeat to get to 1000 characters
      let text = contentBlock;
      while (text.length < 1000) {
        text += " " + contentBlock;
      }
      text = text.substring(0, 1000);

      const result = generateFlashcardsSchema.parse({ source_text: text });

      expect(result.source_text.length).toBe(1000);
    });

    it("should handle text with special characters", () => {
      const specialText = `
        Mathematical formulas: E = mc², a² + b² = c²
        Programming symbols: const fn = () => { return x && y || z; };
        Special characters: äöü ñ 中文 日本語 한국어 العربية
        Emojis: 🎓📚✨ 
      `.repeat(30);

      // Ensure minimum length
      const paddedText = specialText.padEnd(1000, ".");
      const trimmedText = paddedText.substring(0, 5000);

      const result = generateFlashcardsSchema.parse({ source_text: trimmedText });

      expect(result.source_text).toBe(trimmedText);
    });

    it("should handle text with newlines and whitespace", () => {
      const textWithNewlines = "Line 1\nLine 2\n\nLine 3\t\tTabbed content".repeat(100);
      const paddedText = textWithNewlines.padEnd(1000, " ");

      const result = generateFlashcardsSchema.parse({
        source_text: paddedText.substring(0, 2000),
      });

      expect(result.source_text).toContain("\n");
      expect(result.source_text).toContain("\t");
    });
  });
});
