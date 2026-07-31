const encoder = new TextEncoder();
const decoder = new TextDecoder();

const ALLOWED_ADMIN_EMAILS = Object.freeze([
  'tomatonabe0120@gmail.com',
  'tsubaki.tech.jp@gmail.com'
]);
const OTP_TTL_SECONDS = 10 * 60;
const OTP_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60;

export function json(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  for (const [name, rawValue] of Object.entries(extraHeaders)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) headers.append(name, String(value));
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

async function secureEqualText(left, right) {
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(String(left))),
    crypto.subtle.digest('SHA-256', encoder.encode(String(right)))
  ]);
  const aa = new Uint8Array(a);
  const bb = new Uint8Array(b);
  let diff = aa.length ^ bb.length;
  for (let index = 0; index < Math.max(aa.length, bb.length); index += 1) {
    diff |= (aa[index] || 0) ^ (bb[index] || 0);
  }
  return diff === 0;
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isAllowedAdminEmail(value) {
  return ALLOWED_ADMIN_EMAILS.includes(normalizeEmail(value));
}

export function adminAuthConfigured(env) {
  return Boolean(
    env.SESSION_SECRET &&
    env.ADMIN_AUTH_KV &&
    env.RESEND_API_KEY &&
    (env.ADMIN_FROM_EMAIL || env.CONTACT_FROM_EMAIL)
  );
}

function randomCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(bytes[0] % 1_000_000).padStart(6, '0');
}

async function otpHash(challengeId, email, code, secret) {
  return bytesToBase64Url(await hmac(`otp:${challengeId}:${email}:${code}`, secret));
}

function readCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  for (const item of cookie.split(';')) {
    const [key, ...parts] = item.trim().split('=');
    if (key === name) return parts.join('=');
  }
  return '';
}

function cookieSecurity(request) {
  return new URL(request.url).protocol === 'https:' ? '; Secure' : '';
}

export function challengeCookie(request, challengeId) {
  return `tsubaki_admin_challenge=${challengeId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${OTP_TTL_SECONDS}${cookieSecurity(request)}`;
}

export function clearChallengeCookie(request) {
  return `tsubaki_admin_challenge=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${cookieSecurity(request)}`;
}

async function rateLimitBucket(kv, key, limit, ttl) {
  const count = Number(await kv.get(key) || 0);
  if (count >= limit) return true;
  await kv.put(key, String(count + 1), { expirationTtl: ttl });
  return false;
}

export async function loginRequestRateLimited(env, ip, email) {
  if (!env.ADMIN_AUTH_KV) return { limited: false, configurationError: true };
  const window = Math.floor(Date.now() / (LOGIN_WINDOW_SECONDS * 1000));
  const ipKey = `admin-request:ip:${ip || 'unknown'}:${window}`;
  const emailKey = `admin-request:email:${email || 'unknown'}:${window}`;
  const [ipLimited, emailLimited] = await Promise.all([
    rateLimitBucket(env.ADMIN_AUTH_KV, ipKey, 8, LOGIN_WINDOW_SECONDS + 60),
    rateLimitBucket(env.ADMIN_AUTH_KV, emailKey, 4, LOGIN_WINDOW_SECONDS + 60)
  ]);
  return { limited: ipLimited || emailLimited, configurationError: false };
}

export async function createLoginChallenge(email, env) {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedAdminEmail(normalizedEmail)) return null;
  if (!env.ADMIN_AUTH_KV || !env.SESSION_SECRET) throw new Error('Admin authentication is not configured.');

  const challengeId = crypto.randomUUID();
  const code = randomCode();
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
  const value = {
    email: normalizedEmail,
    hash: await otpHash(challengeId, normalizedEmail, code, env.SESSION_SECRET),
    attempts: 0,
    expiresAt
  };
  await env.ADMIN_AUTH_KV.put(`admin-otp:${challengeId}`, JSON.stringify(value), {
    expirationTtl: OTP_TTL_SECONDS
  });
  return { challengeId, code, expiresAt };
}

export async function deleteLoginChallenge(challengeId, env) {
  if (challengeId && env.ADMIN_AUTH_KV) await env.ADMIN_AUTH_KV.delete(`admin-otp:${challengeId}`);
}

export async function sendLoginCode(email, code, env) {
  const from = env.ADMIN_FROM_EMAIL || env.CONTACT_FROM_EMAIL;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: '[TSUBAKI Tech] 管理者ログイン認証コード',
      text: `TSUBAKI Tech 管理画面の認証コードは ${code} です。\n\nこのコードは10分間だけ有効です。心当たりがない場合は、このメールを無視してください。`,
      html: `<div style="font-family:system-ui,sans-serif;line-height:1.7"><h1 style="font-size:22px">TSUBAKI Tech 管理者ログイン</h1><p>次の6桁の認証コードを管理画面へ入力してください。</p><p style="font-size:32px;font-weight:800;letter-spacing:.28em">${code}</p><p>このコードは10分間だけ有効です。心当たりがない場合は、このメールを無視してください。</p></div>`
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Login email delivery failed (${response.status}): ${detail.slice(0, 240)}`);
  }
}

export async function verifyLoginCode(request, email, code, env) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = String(code || '').replace(/\D/g, '').slice(0, 6);
  const challengeId = readCookie(request, 'tsubaki_admin_challenge');
  if (!challengeId || !isAllowedAdminEmail(normalizedEmail) || !/^\d{6}$/.test(normalizedCode)) {
    return { ok: false };
  }
  if (!env.ADMIN_AUTH_KV || !env.SESSION_SECRET) return { ok: false, configurationError: true };

  const key = `admin-otp:${challengeId}`;
  const raw = await env.ADMIN_AUTH_KV.get(key);
  if (!raw) return { ok: false };

  let challenge;
  try { challenge = JSON.parse(raw); } catch { await env.ADMIN_AUTH_KV.delete(key); return { ok: false }; }
  if (challenge.email !== normalizedEmail || Number(challenge.expiresAt) < Date.now()) {
    await env.ADMIN_AUTH_KV.delete(key);
    return { ok: false };
  }

  const expected = await otpHash(challengeId, normalizedEmail, normalizedCode, env.SESSION_SECRET);
  if (!(await secureEqualText(expected, challenge.hash))) {
    challenge.attempts = Number(challenge.attempts || 0) + 1;
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await env.ADMIN_AUTH_KV.delete(key);
      return { ok: false, locked: true };
    }
    const remaining = Math.max(60, Math.ceil((Number(challenge.expiresAt) - Date.now()) / 1000));
    await env.ADMIN_AUTH_KV.put(key, JSON.stringify(challenge), { expirationTtl: remaining });
    return { ok: false, attemptsRemaining: OTP_MAX_ATTEMPTS - challenge.attempts };
  }

  await env.ADMIN_AUTH_KV.delete(key);
  return { ok: true, email: normalizedEmail };
}

export async function createSession(email, env) {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedAdminEmail(normalizedEmail)) throw new Error('Administrator email is not allowed.');
  const payload = {
    email: normalizedEmail,
    exp: Date.now() + 8 * 60 * 60 * 1000,
    csrf: crypto.randomUUID()
  };
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = bytesToBase64Url(await hmac(encoded, env.SESSION_SECRET));
  return { token: `${encoded}.${signature}`, payload };
}

export async function readSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const token = readCookie(request, 'tsubaki_admin');
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = bytesToBase64Url(await hmac(encoded, env.SESSION_SECRET));
  if (!(await secureEqualText(signature, expected))) return null;
  try {
    const payload = JSON.parse(decoder.decode(base64UrlToBytes(encoded)));
    if (!payload.email || !payload.csrf || Number(payload.exp) < Date.now()) return null;
    if (!isAllowedAdminEmail(payload.email)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdmin(request, env, { csrf = false } = {}) {
  const session = await readSession(request, env);
  if (!session) return { response: json({ error: 'ログインが必要です。' }, 401) };
  if (csrf && request.headers.get('x-csrf-token') !== session.csrf) {
    return { response: json({ error: 'セキュリティ確認に失敗しました。再ログインしてください。' }, 403) };
  }
  return { session };
}

export function sessionCookie(request, token) {
  return `tsubaki_admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${cookieSecurity(request)}`;
}

export function clearSessionCookie(request) {
  return `tsubaki_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${cookieSecurity(request)}`;
}
