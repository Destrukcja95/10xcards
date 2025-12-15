import type { FlashcardProposalDTO } from "../../types";

/**
 * Konfiguracja dla OpenRouter API
 */
interface OpenRouterConfig {
  apiKey: string;
  model: string;
  timeout: number;
}

/**
 * Błędy specyficzne dla OpenRouter
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: "RATE_LIMITED" | "SERVICE_UNAVAILABLE" | "PARSE_ERROR"
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Serwis do komunikacji z OpenRouter API dla generowania fiszek przez AI
 */
export class OpenRouterService {
  private config: OpenRouterConfig;

  constructor() {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }

    this.config = {
      apiKey,
      model: "openai/gpt-4o-mini", // Model zoptymalizowany pod kątem kosztów i szybkości
      timeout: 30000, // 30 sekund timeout
    };
  }

  /**
   * Generuje propozycje fiszek na podstawie tekstu źródłowego
   * @param sourceText - Tekst źródłowy (1000-10000 znaków)
   * @returns Tablica propozycji fiszek wygenerowanych przez AI
   * @throws OpenRouterError przy błędach rate limiting, niedostępności serwisu lub parsowania
   */
  async generateFlashcards(sourceText: string): Promise<FlashcardProposalDTO[]> {
    const systemPrompt = `You are a flashcard generator. Generate educational flashcards from the provided text.
Each flashcard should have a clear question (front) and concise answer (back).
Return ONLY a valid JSON array of objects with "front" and "back" fields.
Generate 5-15 flashcards depending on content richness.
Make questions specific and answers concise but complete.
Example format: [{"front": "What is X?", "back": "X is..."}]`;

    const response = await this.makeRequest(systemPrompt, sourceText);
    return this.parseFlashcards(response);
  }

  /**
   * Wykonuje żądanie do OpenRouter API z retry logic
   * @param systemPrompt - Prompt systemowy
   * @param userContent - Treść od użytkownika
   * @returns Odpowiedź tekstowa od modelu
   */
  private async makeRequest(systemPrompt: string, userContent: string): Promise<string> {
    const maxRetries = 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Exponential backoff dla retry
        if (attempt > 0) {
          await this.delay(1000 * Math.pow(2, attempt - 1));
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://10xcards.app",
            "X-Title": "10xCards Flashcard Generator",
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new OpenRouterError("Rate limit exceeded from OpenRouter", "RATE_LIMITED");
          }

          // Retry przy błędach 5xx
          if (response.status >= 500 && attempt < maxRetries) {
            lastError = new Error(`OpenRouter returned ${response.status}`);
            continue;
          }

          throw new OpenRouterError("AI service is temporarily unavailable", "SERVICE_UNAVAILABLE");
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content || typeof content !== "string") {
          throw new OpenRouterError("Invalid response structure from OpenRouter", "PARSE_ERROR");
        }

        return content;
      } catch (error) {
        if (error instanceof OpenRouterError) {
          throw error;
        }

        // Timeout lub błąd sieci
        if (error instanceof Error && error.name === "TimeoutError") {
          if (attempt < maxRetries) {
            lastError = error;
            continue;
          }
          throw new OpenRouterError("Request to AI service timed out", "SERVICE_UNAVAILABLE");
        }

        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          continue;
        }
      }
    }

    throw new OpenRouterError(lastError?.message || "AI service is temporarily unavailable", "SERVICE_UNAVAILABLE");
  }

  /**
   * Parsuje odpowiedź z modelu do tablicy FlashcardProposalDTO
   * @param content - Surowa odpowiedź tekstowa od modelu
   * @returns Tablica zwalidowanych propozycji fiszek
   */
  private parseFlashcards(content: string): FlashcardProposalDTO[] {
    try {
      // Ekstrakcja tablicy JSON z odpowiedzi (model może dodać tekst przed/po JSON)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new OpenRouterError("No JSON array found in AI response", "PARSE_ERROR");
      }

      const parsed: unknown = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        throw new OpenRouterError("AI response is not an array", "PARSE_ERROR");
      }

      // Filtruj i waliduj każdy element
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
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw new OpenRouterError("Failed to parse AI response", "PARSE_ERROR");
    }
  }

  /**
   * Helper do opóźnienia przy retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
