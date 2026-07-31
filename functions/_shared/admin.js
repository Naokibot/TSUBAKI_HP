const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders
    }
  });
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

function adminEmails(env) {
  const configured = env.ADMIN_EMAILS || env.ADMIN_EMAIL || 'tsubaki.tech.jp@gmail.com';
  return configured.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export async function validateCredentials(email, password, env) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const emailAllowed = adminEmails(env).includes(normalizedEmail);
  const configuredPassword = env.ADMIN_PASSWORD || '';
  if (!configuredPassword || !env.SESSION_SECRET) return { ok: false, configurationError: true };
  const passwordAllowed = await secureEqualText(password || '', configuredPassword);
  return { ok: emailAllowed && passwordAllowed, email: normalizedEmail };
}

export async function loginRateLimited(env, ip) {
  if (!env.ADMIN_RATE_LIMIT || !ip) return false;
  const window = Math.floor(Date.now() / (15 * 60 * 1000));
  const key = `admin-login:${ip}:${window}`;
  const attempts = Number(await env.ADMIN_RATE_LIMIT.get(key) || 0);
  if (attempts >= 5) return true;
  await env.ADMIN_RATE_LIMIT.put(key, String(attempts + 1), { expirationTtl: 16 * 60 });
  return false;
}

export async function createSession(email, env) {
  const payload = {
    email,
    exp: Date.now() + 8 * 60 * 60 * 1000,
    csrf: crypto.randomUUID()
  };
  const encoded = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = bytesToBase64Url(await hmac(encoded, env.SESSION_SECRET));
  return { token: `${encoded}.${signature}`, payload };
}

function readCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  for (const item of cookie.split(';')) {
    const [key, ...parts] = item.trim().split('=');
    if (key === name) return parts.join('=');
  }
  return '';
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
    if (!adminEmails(env).includes(String(payload.email).toLowerCase())) return null;
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
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `tsubaki_admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`;
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `tsubaki_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}
