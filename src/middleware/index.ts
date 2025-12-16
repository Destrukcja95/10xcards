import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

import type { Database } from '../db/database.types';

export const onRequest = defineMiddleware(async (context, next) => {
  const cookieHeader = context.request.headers.get('Cookie') ?? '';
  const parsedCookies = parseCookieHeader(cookieHeader);
  
  // Debug logging
  console.log('[Middleware] Path:', context.url.pathname);
  console.log('[Middleware] Cookie header:', cookieHeader.substring(0, 200) + '...');
  console.log('[Middleware] Parsed cookies:', parsedCookies.map(c => c.name));
  console.log('[Middleware] SUPABASE_URL:', import.meta.env.SUPABASE_URL);
  
  // Utworzenie klienta Supabase z obsługą cookies dla SSR
  const supabase = createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return parsedCookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  context.locals.supabase = supabase;

  // Dla ścieżek API - weryfikacja użytkownika
  // Wyjątek: /api/auth/* - endpointy auth mogą działać bez/z sesją
  const isApiRoute = context.url.pathname.startsWith('/api');
  const isAuthRoute = context.url.pathname.startsWith('/api/auth');
  
  if (isApiRoute && !isAuthRoute) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log('[Middleware] API route auth check - user:', user?.email, 'error:', error?.message);

    if (error || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid authentication token',
          },
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    context.locals.user = user;
  }

  return next();
});
