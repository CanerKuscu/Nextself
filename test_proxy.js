const SUPABASE_URL = 'https://zikfxjclhykasobsfskw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppa2Z4amNsaHlrYXNvYnNmc2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyODE5NDUsImV4cCI6MjA4NTg1Nzk0NX0.vY3oFgKaybnVP5TwjypgfYQA3IVaqiPp1HZmQWQWw1Q';
const FUNCTION_URL = 'https://zikfxjclhykasobsfskw.functions.supabase.co/session-exchange';

(async () => {
  try {
    const tokenRes = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY },
      body: JSON.stringify({ email: 'ca.nerkuscu99@gmail.com', password: 'Legend.45' })
    });
    const tokenJson = await tokenRes.json();
    const rt = tokenJson.refresh_token;

    const setRes = await fetch(FUNCTION_URL + '/set-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON_KEY },
      body: JSON.stringify({ refresh_token: rt })
    });
    
    const setJson = await setRes.json();
    console.log('Set-Session Response:', setJson);

    const cookieStr = `sb_refresh_token=${encodeURIComponent(rt)}; sb_csrf_token=${setJson.csrf_token}`;

    const proxyRes = await fetch(FUNCTION_URL + '/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ANON_KEY,
        'Cookie': cookieStr,
        'X-CSRF-Token': setJson.csrf_token
      },
      body: JSON.stringify({ method: 'GET', path: 'auth/v1/user' })
    });
    
    console.log('Proxy Status:', proxyRes.status);
    const proxyText = await proxyRes.text();
    console.log('Proxy Output:', proxyText.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
})();
