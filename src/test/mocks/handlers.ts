import { http, HttpResponse } from "msw";

// Define API handlers for mocking
// Add your API endpoints here as needed

export const handlers = [
  // Example: Mock health check endpoint
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "ok" });
  }),

  // Example: Mock authentication endpoint
  // http.post('/api/auth/login', async ({ request }) => {
  //   const body = await request.json();
  //   return HttpResponse.json({
  //     user: { id: '1', email: body.email },
  //     token: 'mock-token',
  //   });
  // }),

  // Add more handlers as needed for your API endpoints
];
