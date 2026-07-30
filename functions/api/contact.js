const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS'
  }
});

const clean = (value, max) => String(value || '').trim().slice(0, max);

async function validateTurnstile(token, secret, ip) {
  if (!secret) return { success: true, skipped: true };
  if (!token) return { success: false };
  const form = new FormData();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  return response.json();
}

async function rateLimited(env, ip) {
  if (!env.CONTACT_RATE_LIMIT || !ip) return false;
  const bucket = Math.floor(Date.now() / 60000);
  const key = `contact:${ip}:${bucket}`;
  const count = Number(await env.CONTACT_RATE_LIMIT.get(key) || 0);
  if (count >= 3) return true;
  await env.CONTACT_RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 120 });
  return false;
}

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (await rateLimited(env, ip)) return json({ error: 'Too many messages. Please try again later.' }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  if (clean(body.website, 100)) return json({ ok: true });
  const startedAt = Number(body.startedAt || 0);
  const elapsed = Date.now() - startedAt;
  if (!startedAt || elapsed < 3000 || elapsed > 2 * 60 * 60 * 1000) return json({ error: 'Form timing validation failed.' }, 400);

  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const organization = clean(body.organization, 160);
  const message = clean(body.message, 5000);
  const locale = clean(body.locale, 8);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 5) return json({ error: 'Please complete all required fields.' }, 400);

  const turnstile = await validateTurnstile(body['cf-turnstile-response'], env.TURNSTILE_SECRET, ip);
  if (!turnstile.success) return json({ error: 'Spam verification failed.' }, 403);

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    return json({ error: 'Contact delivery is not configured. Please use the displayed email address.' }, 503);
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `[TSUBAKI Portfolio] Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nOrganization: ${organization || '-'}\nLocale: ${locale || '-'}\n\n${message}`
    })
  });

  if (!response.ok) return json({ error: 'The message service returned an error.' }, 502);
  return json({ ok: true });
}
