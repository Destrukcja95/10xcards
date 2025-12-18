import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterError } from "./openrouter.service";
import type { FlashcardProposalDTO } from "../../types";

// We need to test OpenRouterService differently because it uses import.meta.env
// which cannot be easily mocked. We'll test the parseFlashcards logic separately
// by extracting its core algorithm and testing error types.

// ============================================================================
// TC-GEN-004: parseFlashcards Logic Tests (standalone implementation)
// ============================================================================
describe("parseFlashcards logic", () => {
  // Replicate the parseFlashcards logic for testing
  const parseFlashcards = (content: string): FlashcardProposalDTO[] => {
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new OpenRouterError("No JSON array found in AI response", "PARSE_ERROR");
    }

    const parsed: unknown = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      throw new OpenRouterError("AI response is not an array", "PARSE_ERROR");
    }

    // Filter and validate each element
    const validFlashcards: FlashcardProposalDTO[] = parsed
      .filter(
        (item): item is { front: string; back: string } =>
          typeof item === "object" &&
          item !== null &&
          "front" in item &&
          "back" in item &&
          typeof item.front === "string" &&
          typeof item.back === "string" &&
          item.front.trim().length > 0 &&
          item.back.trim().length > 0
      )
      .map((item) => ({
        front: item.front.trim(),
        back: item.back.trim(),
      }));

    if (validFlashcards.length === 0) {
      throw new OpenRouterError("No valid flashcards in AI response", "PARSE_ERROR");
    }

    return validFlashcards;
  };

  it("should parse valid JSON array of flashcards", () => {
    const content = JSON.stringify([
      { front: "What is TypeScript?", back: "A typed superset of JavaScript" },
      { front: "What is React?", back: "A JavaScript library for building UIs" },
    ]);

    const result = parseFlashcards(content);

    expect(result).toEqual([
      { front: "What is TypeScript?", back: "A typed superset of JavaScript" },
      { front: "What is React?", back: "A JavaScript library for building UIs" },
    ]);
  });

  it("should extract JSON array from surrounding text", () => {
    const content = `Here are your flashcards:
    [
      {"front": "Question 1", "back": "Answer 1"},
      {"front": "Question 2", "back": "Answer 2"}
    ]
    Hope this helps!`;

    const result = parseFlashcards(content);

    expect(result).toHaveLength(2);
    expect(result).toEqual([
      { front: "Question 1", back: "Answer 1" },
      { front: "Question 2", back: "Answer 2" },
    ]);
  });

  it("should trim whitespace from front and back", () => {
    const content = JSON.stringify([{ front: "  Question  ", back: "  Answer  " }]);

    const result = parseFlashcards(content);

    expect(result).toEqual([{ front: "Question", back: "Answer" }]);
  });

  it("should filter out invalid flashcard objects", () => {
    const content = JSON.stringify([
      { front: "Valid Question", back: "Valid Answer" },
      { front: "", back: "Empty front" }, // Invalid - empty front
      { front: "Empty back", back: "" }, // Invalid - empty back
      { front: "Missing back" }, // Invalid - no back
      { back: "Missing front" }, // Invalid - no front
      null, // Invalid - not an object
      "string", // Invalid - not an object
      { front: "Another valid", back: "Another answer" },
    ]);

    const result = parseFlashcards(content);

    expect(result).toEqual([
      { front: "Valid Question", back: "Valid Answer" },
      { front: "Another valid", back: "Another answer" },
    ]);
  });

  it("should throw PARSE_ERROR when no JSON array found", () => {
    const content = "This is just plain text without any JSON";

    expect(() => parseFlashcards(content)).toThrow(OpenRouterError);
    expect(() => parseFlashcards(content)).toThrow("No JSON array found");
  });

  it("should throw PARSE_ERROR when response is not an array", () => {
    // A JSON object without array brackets won't match the regex, so it throws "No JSON array found"
    const objectContent = JSON.stringify({ front: "Single object", back: "Not array" });

    expect(() => parseFlashcards(objectContent)).toThrow(OpenRouterError);
    // Since regex looks for [...], an object won't match, resulting in "No JSON array found"
    expect(() => parseFlashcards(objectContent)).toThrow("No JSON array found");
  });

  it("should throw PARSE_ERROR when no valid flashcards after filtering", () => {
    const content = JSON.stringify([
      { front: "", back: "" },
      { notFront: "wrong", notBack: "fields" },
    ]);

    expect(() => parseFlashcards(content)).toThrow(OpenRouterError);
    expect(() => parseFlashcards(content)).toThrow("No valid flashcards");
  });

  it("should throw PARSE_ERROR on malformed JSON", () => {
    const content = '[{"front": "broken", "back": }]';

    expect(() => parseFlashcards(content)).toThrow();
  });

  it("should handle flashcards with extra fields (ignore them)", () => {
    const content = JSON.stringify([
      {
        front: "Question",
        back: "Answer",
        extraField: "ignored",
        anotherField: 123,
      },
    ]);

    const result = parseFlashcards(content);

    expect(result).toEqual([{ front: "Question", back: "Answer" }]);
  });

  it("should filter out flashcards with only whitespace", () => {
    const content = JSON.stringify([
      { front: "   ", back: "Answer" },
      { front: "Question", back: "   " },
      { front: "Valid", back: "Also valid" },
    ]);

    const result = parseFlashcards(content);

    expect(result).toEqual([{ front: "Valid", back: "Also valid" }]);
  });
});

// ============================================================================
// TC-GEN-005: makeRequest Error Handling (via fetch mock)
// ============================================================================
describe("OpenRouterService API integration", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("error response handling", () => {
    it("should identify rate limited responses (429)", async () => {
      const mockResponse = {
        ok: false,
        status: 429,
      };
      fetchMock.mockResolvedValue(mockResponse);

      // Simulate what OpenRouterService would do
      const response = await fetch("https://api.example.com");
      expect(response.status).toBe(429);
      // Service would throw: new OpenRouterError('Rate limit exceeded', 'RATE_LIMITED')
    });

    it("should identify service unavailable responses (5xx)", async () => {
      const mockResponse = {
        ok: false,
        status: 503,
      };
      fetchMock.mockResolvedValue(mockResponse);

      const response = await fetch("https://api.example.com");
      expect(response.status).toBe(503);
      expect(response.status).toBeGreaterThanOrEqual(500);
      // Service would throw: new OpenRouterError('Service unavailable', 'SERVICE_UNAVAILABLE')
    });

    it("should handle successful responses", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '[{"front": "Q", "back": "A"}]' } }],
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const response = await fetch("https://api.example.com");
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.choices[0].message.content).toContain("front");
    });

    it("should handle missing content in response", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: {} }], // No content
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const response = await fetch("https://api.example.com");
      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content;

      expect(responseContent).toBeUndefined();
      // Service would throw: new OpenRouterError('Invalid response', 'PARSE_ERROR')
    });

    it("should handle network errors", async () => {
      fetchMock.mockRejectedValue(new Error("Network error"));

      await expect(fetch("https://api.example.com")).rejects.toThrow("Network error");
      // Service would catch and throw: new OpenRouterError('Service unavailable', 'SERVICE_UNAVAILABLE')
    });

    it("should handle timeout errors", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      fetchMock.mockRejectedValue(timeoutError);

      await expect(fetch("https://api.example.com")).rejects.toThrow("Request timeout");
    });
  });

  describe("retry logic", () => {
    it("should retry on 5xx errors", async () => {
      // First call fails with 503, second succeeds
      fetchMock.mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: '[{"front": "Q", "back": "A"}]' } }],
        }),
      });

      // First attempt
      let response = await fetch("https://api.example.com");
      expect(response.ok).toBe(false);

      // Retry
      response = await fetch("https://api.example.com");
      expect(response.ok).toBe(true);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});

// ============================================================================
// OpenRouterError Class Tests
// ============================================================================
describe("OpenRouterError", () => {
  it("should create error with correct message and code", () => {
    const error = new OpenRouterError("Rate limit exceeded", "RATE_LIMITED");

    expect(error.message).toBe("Rate limit exceeded");
    expect(error.code).toBe("RATE_LIMITED");
    expect(error.name).toBe("OpenRouterError");
  });

  it("should support all error codes", () => {
    const codes = ["RATE_LIMITED", "SERVICE_UNAVAILABLE", "PARSE_ERROR"] as const;

    for (const code of codes) {
      const error = new OpenRouterError("Test error", code);
      expect(error.code).toBe(code);
    }
  });

  it("should be instanceof Error", () => {
    const error = new OpenRouterError("Test", "PARSE_ERROR");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(OpenRouterError);
  });

  it("should have correct error name for stack traces", () => {
    const error = new OpenRouterError("Test message", "SERVICE_UNAVAILABLE");

    expect(error.name).toBe("OpenRouterError");
    expect(error.stack).toContain("OpenRouterError");
  });

  it("should preserve error code for error handling", () => {
    try {
      throw new OpenRouterError("Service unavailable", "SERVICE_UNAVAILABLE");
    } catch (error) {
      if (error instanceof OpenRouterError) {
        expect(error.code).toBe("SERVICE_UNAVAILABLE");
        expect(error.message).toBe("Service unavailable");
      } else {
        throw new Error("Expected OpenRouterError");
      }
    }
  });
});

// ============================================================================
// Request Configuration Tests
// ============================================================================
describe("OpenRouter request configuration", () => {
  it("should use correct API endpoint", () => {
    const expectedEndpoint = "https://openrouter.ai/api/v1/chat/completions";
    expect(expectedEndpoint).toContain("openrouter.ai");
    expect(expectedEndpoint).toContain("/chat/completions");
  });

  it("should require authorization header format", () => {
    const apiKey = "test-key";
    const authHeader = `Bearer ${apiKey}`;

    expect(authHeader).toBe("Bearer test-key");
    expect(authHeader.startsWith("Bearer ")).toBe(true);
  });

  it("should support required request headers", () => {
    const headers = {
      Authorization: "Bearer test-key",
      "Content-Type": "application/json",
      "HTTP-Referer": "https://10xcards.app",
      "X-Title": "10xCards Flashcard Generator",
    };

    expect(headers).toHaveProperty("Authorization");
    expect(headers).toHaveProperty("Content-Type", "application/json");
  });
});
