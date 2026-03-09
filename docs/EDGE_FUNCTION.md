# Edge Function: session-exchange

This document explains the `session-exchange` Edge Function and how the app integrates with it.

Purpose
- Exchange Supabase refresh tokens for HttpOnly cookies on web.
- Provide a proxied endpoint so the web client can make authenticated REST requests without storing tokens in JS storage.

Key endpoints
- `POST /set-session` — accepts `{ refresh_token }` in JSON, exchanges with Supabase `/auth/v1/token`, and sets `sb_refresh_token` as an HttpOnly Secure cookie.
- `POST /proxy` — accepts `{ method, path, query, body }` and forwards the request to Supabase (same project) using the server-side session cookie.

Required environment / secrets
- `SUPABASE_URL` — your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (store in secrets for deployment; never commit).
- `COOKIE_DOMAIN` — domain for the HttpOnly cookie (e.g., `localhost` for local dev or your production domain).

Local testing
1. Build & deploy the function with the Supabase CLI (logged in to the right project):

```bash
supabase functions deploy session-exchange --project-ref <project-ref>
# set secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<value>" COOKIE_DOMAIN="localhost"
```

2. In the app `.env` (or environment), set `EXPO_PUBLIC_SESSION_EXCHANGE_URL` to the deployed function URL, e.g.: `https://<project>.functions.supabase.co/session-exchange`.

Client integration notes
- The web client calls `signInAndExchange()` which signs in using Supabase and then posts the `refresh_token` to `/set-session` with credentials included. The Edge Function sets an HttpOnly cookie.
- All subsequent requests from web to Supabase should be proxied via `/proxy` so they include the cookie (credentials: include) and avoid exposing tokens to JavaScript.

Security notes
- Do NOT commit `SUPABASE_SERVICE_ROLE_KEY` to the repo.
- Use SameSite=Strict, Secure, and a short cookie path where appropriate.

Troubleshooting
- If you see a 404 from the functions gateway, verify the function is deployed to the same project-ref as your `SUPABASE_URL`.

Additional resources
- See `supabase/functions/session-exchange` for the function source in this repo.
