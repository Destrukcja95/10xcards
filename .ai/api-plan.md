# REST API Plan

## 1. Resources

The API is organized around the following main resources, mapped directly to database entities:

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Flashcards | `flashcards` | User's flashcards with spaced repetition data |
| Generations | `generation_sessions` | AI generation sessions for statistics |

**Note:** Authentication is handled by Supabase Auth, which provides built-in endpoints for user management. The API leverages Supabase's `auth.users` table through foreign key relationships.

---

## 2. Endpoints

### 2.1 Flashcards

#### GET /api/flashcards

Retrieves a paginated list of flashcards for the authenticated user.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-based) |
| `limit` | integer | No | 20 | Items per page (max: 100) |
| `sort` | string | No | `created_at` | Sort field: `created_at`, `updated_at`, `next_review_date` |
| `order` | string | No | `desc` | Sort order: `asc`, `desc` |

**Response Payload (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "source": "ai_generated" | "manual",
      "ease_factor": 2.50,
      "interval": 0,
      "repetition_count": 0,
      "next_review_date": "2024-01-15T10:00:00Z",
      "last_reviewed_at": null,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 400 | Invalid query parameters | Invalid pagination or sort parameters |

---

#### GET /api/flashcards/:id

Retrieves a single flashcard by ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Flashcard identifier |

**Response Payload (200 OK):**

```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "source": "ai_generated" | "manual",
  "ease_factor": 2.50,
  "interval": 0,
  "repetition_count": 0,
  "next_review_date": "2024-01-15T10:00:00Z",
  "last_reviewed_at": null,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Flashcard not found | Flashcard doesn't exist or belongs to another user |

---

#### POST /api/flashcards

Creates one or more flashcards manually or from AI-approved proposals.

**Request Payload:**

```json
{
  "flashcards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "manual"
    }
  ]
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| `front` | Required, 1-500 characters |
| `back` | Required, 1-1000 characters |
| `source` | Required, enum: `ai_generated`, `manual` |

**Response Payload (201 Created):**

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "manual",
      "ease_factor": 2.50,
      "interval": 0,
      "repetition_count": 0,
      "next_review_date": "2024-01-15T10:00:00Z",
      "last_reviewed_at": null,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 400 | Validation error | Invalid request payload |
| 422 | Unprocessable Entity | Business logic validation failed |

---

#### PUT /api/flashcards/:id

Updates an existing flashcard.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Flashcard identifier |

**Request Payload:**

```json
{
  "front": "Updated question",
  "back": "Updated answer"
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| `front` | Optional, 1-500 characters |
| `back` | Optional, 1-1000 characters |

**Response Payload (200 OK):**

```json
{
  "id": "uuid",
  "front": "Updated question",
  "back": "Updated answer",
  "source": "manual",
  "ease_factor": 2.50,
  "interval": 0,
  "repetition_count": 0,
  "next_review_date": "2024-01-15T10:00:00Z",
  "last_reviewed_at": null,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Flashcard not found | Flashcard doesn't exist or belongs to another user |
| 400 | Validation error | Invalid request payload |

---

#### DELETE /api/flashcards/:id

Permanently deletes a flashcard.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Flashcard identifier |

**Response Payload (204 No Content):**

Empty response body.

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Flashcard not found | Flashcard doesn't exist or belongs to another user |

---

### 2.2 AI Generation

#### POST /api/generations

Generates flashcard proposals from source text using AI (LLM via Openrouter.ai).

**Request Payload:**

```json
{
  "source_text": "Long text content between 1000 and 10000 characters..."
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| `source_text` | Required, 1000-10000 characters |

**Response Payload (200 OK):**

```json
{
  "generation_id": "uuid",
  "proposals": [
    {
      "front": "Generated question 1?",
      "back": "Generated answer 1"
    },
    {
      "front": "Generated question 2?",
      "back": "Generated answer 2"
    }
  ],
  "generated_count": 5
}
```

**Note:** Proposals are not persisted to the database. They exist only in the response and must be explicitly saved via POST /api/flashcards if accepted by the user. The `generation_id` can be used to track the session when flashcards are created.

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 400 | Validation error | Source text length outside 1000-10000 range |
| 503 | AI Service Unavailable | OpenRouter API error or timeout |
| 429 | Too Many Requests | Rate limit exceeded |

---

### 2.3 Study Session

#### GET /api/study-session

Retrieves flashcards due for review based on the SM-2 spaced repetition algorithm.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 20 | Maximum flashcards to return (max: 50) |

**Response Payload (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "front": "Question text",
      "back": "Answer text",
      "ease_factor": 2.50,
      "interval": 1,
      "repetition_count": 2
    }
  ],
  "count": 10,
  "total_due": 25
}
```

**Note:** Only returns flashcards where `next_review_date <= now()`.

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |

---

#### POST /api/study-session/review

Records a review result and updates SM-2 algorithm parameters.

**Request Payload:**

```json
{
  "flashcard_id": "uuid",
  "rating": 4
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| `flashcard_id` | Required, valid UUID |
| `rating` | Required, integer 0-5 (SM-2 quality rating) |

**SM-2 Rating Scale:**

| Rating | Meaning |
|--------|---------|
| 0 | Complete blackout, no recall |
| 1 | Incorrect, but recognized correct answer |
| 2 | Incorrect, but correct answer seemed easy |
| 3 | Correct with serious difficulty |
| 4 | Correct with some hesitation |
| 5 | Perfect response |

**Response Payload (200 OK):**

```json
{
  "id": "uuid",
  "ease_factor": 2.60,
  "interval": 6,
  "repetition_count": 3,
  "next_review_date": "2024-01-21T10:00:00Z",
  "last_reviewed_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Flashcard not found | Flashcard doesn't exist or belongs to another user |
| 400 | Validation error | Invalid rating value |

---

### 2.4 Generation Sessions (Statistics)

#### GET /api/generation-sessions

Retrieves generation session history for statistics.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page (max: 100) |

**Response Payload (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "generated_count": 10,
      "accepted_count": 7,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  },
  "summary": {
    "total_generated": 150,
    "total_accepted": 112,
    "acceptance_rate": 74.67
  }
}
```

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |

---

#### PATCH /api/generation-sessions/:id

Updates a generation session with accepted flashcard count (called when user saves accepted flashcards).

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Generation session identifier |

**Request Payload:**

```json
{
  "accepted_count": 5
}
```

**Validation Rules:**

| Field | Rule |
|-------|------|
| `accepted_count` | Required, integer >= 0 |

**Response Payload (200 OK):**

```json
{
  "id": "uuid",
  "generated_count": 10,
  "accepted_count": 5,
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**

| Code | Message | Description |
|------|---------|-------------|
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Session not found | Session doesn't exist or belongs to another user |
| 400 | Validation error | Invalid accepted_count value |

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Auth** with JWT (JSON Web Token) for authentication:

1. **Token Acquisition:** Users authenticate via Supabase Auth SDK (client-side) using email/password
2. **Token Transport:** JWT is sent in the `Authorization` header: `Bearer <token>`
3. **Token Validation:** Astro middleware validates JWT on each request using Supabase client

### 3.2 Implementation Details

```
┌─────────────────────────────────────────────────────────────┐
│                      Authentication Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client                    Supabase Auth                    │
│    │                            │                           │
│    │── signUp(email,pass) ─────►│                           │
│    │◄─── JWT + Refresh Token ───│                           │
│    │                            │                           │
│    │── signIn(email,pass) ─────►│                           │
│    │◄─── JWT + Refresh Token ───│                           │
│                                                             │
│  Client                    Astro API                        │
│    │                            │                           │
│    │── Request + Bearer JWT ───►│                           │
│    │                            │── Validate JWT ──┐        │
│    │                            │◄─────────────────┘        │
│    │                            │── Extract user_id         │
│    │◄────── Response ───────────│                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Middleware Configuration

All `/api/*` routes (except public endpoints if any) require authentication:

- **Location:** `src/middleware/index.ts`
- **Behavior:** Validates JWT, extracts `user_id`, attaches to request context
- **Failure Response:** 401 Unauthorized with JSON error body

### 3.4 Authorization (Row Level Security)

Database-level authorization is enforced through Supabase RLS policies:

| Table | Policy | Rule |
|-------|--------|------|
| `flashcards` | SELECT, INSERT, UPDATE, DELETE | `user_id = auth.uid()` |
| `generation_sessions` | SELECT, INSERT | `user_id = auth.uid()` |

This provides defense-in-depth: even if API authorization is bypassed, RLS prevents unauthorized data access.

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Flashcards

| Field | Type | Constraints | Error Message |
|-------|------|-------------|---------------|
| `front` | string | Required, 1-500 chars | "Front text must be 1-500 characters" |
| `back` | string | Required, 1-1000 chars | "Back text must be 1-1000 characters" |
| `source` | enum | Required, `ai_generated` or `manual` | "Source must be 'ai_generated' or 'manual'" |

#### Generation Request

| Field | Type | Constraints | Error Message |
|-------|------|-------------|---------------|
| `source_text` | string | Required, 1000-10000 chars | "Source text must be between 1000 and 10000 characters" |

#### Study Session Review

| Field | Type | Constraints | Error Message |
|-------|------|-------------|---------------|
| `flashcard_id` | UUID | Required, valid UUID | "Invalid flashcard ID format" |
| `rating` | integer | Required, 0-5 | "Rating must be an integer between 0 and 5" |

### 4.2 Business Logic Implementation

#### AI Flashcard Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AI Generation Flow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User submits source_text (1000-10000 chars)             │
│                      │                                      │
│                      ▼                                      │
│  2. Validate input length                                   │
│                      │                                      │
│                      ▼                                      │
│  3. Create generation_session record                        │
│     (source_text, generated_count=0, accepted_count=0)      │
│                      │                                      │
│                      ▼                                      │
│  4. Call OpenRouter API with source_text                    │
│                      │                                      │
│                      ▼                                      │
│  5. Parse LLM response into flashcard proposals             │
│                      │                                      │
│                      ▼                                      │
│  6. Update generation_session.generated_count               │
│                      │                                      │
│                      ▼                                      │
│  7. Return proposals to client (NOT saved to flashcards)    │
│                                                             │
│  ─────────────── User Review Phase ───────────────          │
│                                                             │
│  8. User reviews, edits, accepts/rejects proposals          │
│                      │                                      │
│                      ▼                                      │
│  9. User saves accepted flashcards via POST /api/flashcards │
│     (with source='ai_generated' and generation_id)          │
│                      │                                      │
│                      ▼                                      │
│  10. Update generation_session.accepted_count               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### SM-2 Algorithm Implementation

The Spaced Repetition algorithm (SM-2) updates are calculated server-side:

```typescript
// SM-2 Algorithm Parameters
interface SM2Params {
  ease_factor: number;      // EF >= 1.30
  interval: number;         // Days until next review
  repetition_count: number; // Consecutive correct responses
}

// SM-2 Update Logic
function calculateSM2(current: SM2Params, rating: number): SM2Params {
  let { ease_factor, interval, repetition_count } = current;
  
  // Rating < 3 means incorrect response
  if (rating < 3) {
    repetition_count = 0;
    interval = 1;
  } else {
    // Correct response
    repetition_count += 1;
    
    if (repetition_count === 1) {
      interval = 1;
    } else if (repetition_count === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
  }
  
  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  ease_factor = Math.max(1.30, ease_factor);
  
  return { ease_factor, interval, repetition_count };
}
```

#### Study Session Query Logic

Flashcards due for review are selected using:

```sql
SELECT * FROM flashcards 
WHERE user_id = auth.uid() 
  AND next_review_date <= now()
ORDER BY next_review_date ASC
LIMIT :limit;
```

### 4.3 Error Response Format

All error responses follow a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error message",
    "details": [
      {
        "field": "front",
        "message": "Front text must be 1-500 characters"
      }
    ]
  }
}
```

**Standard Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNPROCESSABLE_ENTITY` | 422 | Business logic validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | External service (AI) unavailable |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### 4.4 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/generations | 10 requests | 1 hour |
| Other endpoints | 100 requests | 1 minute |

Rate limiting is implemented per authenticated user using their `user_id`.

### 4.5 Database Constraints Enforcement

The API validates data before database operations, but database constraints provide additional safety:

| Constraint | Location | Purpose |
|------------|----------|---------|
| `ease_factor >= 1.30` | Database CHECK | Prevent invalid SM-2 values |
| `interval >= 0` | Database CHECK | Ensure non-negative intervals |
| `repetition_count >= 0` | Database CHECK | Ensure non-negative counts |
| `char_length(source_text) BETWEEN 1000 AND 10000` | Database CHECK | Enforce text limits |
| `ON DELETE CASCADE` | Foreign Key | GDPR compliance - auto-delete user data |

