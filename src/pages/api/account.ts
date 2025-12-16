import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { ErrorDTO } from '../../types';

export const prerender = false;

/**
 * DELETE /api/account
 * Usuwa konto aktualnie zalogowanego użytkownika.
 * Wymaga autoryzacji (middleware sprawdza sesję).
 * 
 * Używa Supabase Admin API do usunięcia użytkownika.
 * RLS CASCADE automatycznie usuwa powiązane dane (flashcards, generation_sessions).
 * 
 * Response:
 * - 204 No Content - sukces
 * - 401 Unauthorized - brak autoryzacji
 * - 500 Internal Error - błąd serwera
 */
export const DELETE: APIRoute = async ({ locals }) => {
  // Sprawdzenie autoryzacji - middleware już to robi, ale dla bezpieczeństwa
  const user = locals.user;

  if (!user) {
    const errorResponse: ErrorDTO = {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authentication token',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Tworzenie klienta admin Supabase z service_role key
    // WAŻNE: service_role key ma pełny dostęp, używać tylko po stronie serwera
    const supabaseAdmin = createClient<Database>(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Usunięcie użytkownika przez Admin API
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('[DELETE /api/account] Supabase admin error:', error);
      
      const errorResponse: ErrorDTO = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Nie udało się usunąć konta. Spróbuj ponownie później.',
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[DELETE /api/account] User deleted successfully:', user.id);

    // 204 No Content - sukces bez body
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error('[DELETE /api/account] Unexpected error:', error);

    const errorResponse: ErrorDTO = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.',
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

