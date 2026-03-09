Session-exchange Edge Function

Purpose
- Accept a refresh token from the browser and set a Secure, HttpOnly cookie (`sb_refresh_token`).
- Provide a simple `proxy` endpoint that uses the cookie-stored refresh token to obtain a short-lived access token and proxy calls to Supabase REST endpoints.

Endpoints (within the single function):
- POST /set-session  -> Body: { refresh_token }
  - Sets HttpOnly cookie `sb_refresh_token` containing the refresh token. Returns { success: true }.

- POST /proxy -> Body: { method, path, query?, body? }
  - Reads `sb_refresh_token` cookie, exchanges it for an access token, then forwards the request to Supabase REST (`/rest/v1/${path}`) and returns the response.

Environment variables required when deploying
- SUPABASE_URL            (e.g. https://xyz.supabase.co)
- SUPABASE_SERVICE_ROLE_KEY  (recommended for token exchange)
- SUPABASE_ANON_KEY       (used for proxied requests)
- COOKIE_DOMAIN           (optional; sets Domain attribute for the cookie)

Security notes
- Cookie is `HttpOnly`, `Secure`, `SameSite=Strict`.
- The function uses the service role key (recommended) to reliably exchange refresh tokens for access tokens on the server.
- After calling `POST /set-session`, the frontend should remove any client-side persisted tokens (do not store tokens in localStorage).

Deployment (Supabase CLI)

1) Build / deploy this function:

```bash
# inside your project
supabase functions deploy session-exchange --project-ref <project-ref>
```

2) Set environment secrets for the deployed function:

```bash
supabase secrets set SUPABASE_URL="https://<project>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  SUPABASE_ANON_KEY="<anon-key>" \
  COOKIE_DOMAIN="yourdomain.com"
```

3) Call the function from the browser using the functions URL:

```js
// show example URL format
const FN_BASE = 'https://<project>.functions.supabase.co/session-exchange';

// set cookie (post sign-in)
await fetch(`${FN_BASE}/set-session`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token })
});
```

Client migration notes
- Disable `persistSession` on web (already done in the project).
- After sign-in, send the refresh token to `/set-session` (with credentials: 'include'). Immediately clear the in-memory client session to avoid storing tokens.
- Use the proxy endpoint for authenticated REST calls from the browser (or continue using server-side endpoints). This keeps secrets out of the browser and prevents tokens from being stored in localStorage.

Example client snippets are included in the project documentation.
