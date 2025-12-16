import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Wylogowuje użytkownika i usuwa sesję
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  const { error } = await locals.supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
  }

  // Zawsze przekieruj do strony głównej po wylogowaniu
  return redirect("/", 302);
};

