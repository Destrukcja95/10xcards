/**
 * Prosty in-memory rate limiter
 *
 * UWAGA: Ta implementacja działa tylko w pojedynczej instancji serwera.
 * W środowisku produkcyjnym z wieloma instancjami należy użyć Redis.
 *
 * Rate limiter jest resetowany przy restarcie serwera.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store dla rate limit
const rateLimitStore = new Map<string, RateLimitRecord>();

// Czyści wygasłe rekordy co 5 minut
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Uruchom cleanup tylko raz
let cleanupStarted = false;

function startCleanup(): void {
  if (cleanupStarted) return;
  cleanupStarted = true;

  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Sprawdza czy użytkownik może wykonać akcję w ramach limitu
 *
 * @param key - Unikalny klucz (np. "generations:user-id")
 * @param limit - Maksymalna liczba żądań w oknie czasowym
 * @param windowMs - Okno czasowe w milisekundach
 * @returns true jeśli żądanie jest dozwolone, false jeśli limit przekroczony
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  startCleanup();

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Brak rekordu lub wygasły - utwórz nowy
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Sprawdź limit
  if (record.count >= limit) {
    return false;
  }

  // Inkrementuj licznik
  record.count++;
  return true;
}

/**
 * Pobiera informacje o pozostałym limicie dla użytkownika
 *
 * @param key - Unikalny klucz
 * @param limit - Maksymalna liczba żądań
 * @param windowMs - Okno czasowe w milisekundach
 * @returns Obiekt z informacjami o limicie
 */
export function getRateLimitInfo(
  key: string,
  limit: number,
  windowMs: number
): {
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
} {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    return {
      remaining: limit,
      resetAt: new Date(now + windowMs),
      isLimited: false,
    };
  }

  return {
    remaining: Math.max(0, limit - record.count),
    resetAt: new Date(record.resetAt),
    isLimited: record.count >= limit,
  };
}

// ============================================================================
// PREDEFINIOWANE LIMITY
// ============================================================================

/**
 * Limit dla generowania fiszek: 10 żądań na godzinę per użytkownik
 */
export const GENERATIONS_RATE_LIMIT = {
  limit: 10,
  windowMs: 60 * 60 * 1000, // 1 godzina
};

/**
 * Sprawdza rate limit dla generowania fiszek
 * @param userId - ID użytkownika
 * @returns true jeśli dozwolone, false jeśli limit przekroczony
 */
export function checkGenerationsRateLimit(userId: string): boolean {
  const key = `generations:${userId}`;
  return checkRateLimit(key, GENERATIONS_RATE_LIMIT.limit, GENERATIONS_RATE_LIMIT.windowMs);
}

/**
 * Pobiera informacje o limicie generowania dla użytkownika
 */
export function getGenerationsRateLimitInfo(userId: string): {
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
} {
  const key = `generations:${userId}`;
  return getRateLimitInfo(key, GENERATIONS_RATE_LIMIT.limit, GENERATIONS_RATE_LIMIT.windowMs);
}
