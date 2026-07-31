import assert from 'node:assert/strict';
import { onRequestPost as requestCode } from '../functions/api/admin/login.js';
import { onRequestPost as verifyCode } from '../functions/api/admin/verify.js';
import { createSession, isAllowedAdminEmail, readSession } from '../functions/_shared/admin.js';

class MemoryKV {
  constructor() { this.values = new Map(); }
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
}

const kv = new MemoryKV();
const env = {
  SESSION_SECRET: 'test-session-secret-at-least-32-characters-long',
  ADMIN_AUTH_KV: kv,
  RESEND_API_KEY: 're_test',
  ADMIN_FROM_EMAIL: 'TSUBAKI Tech <login@example.com>'
};
let sentPayload = null;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  sentPayload = JSON.parse(options.body);
  return new Response(JSON.stringify({ id: 'email_test' }), { status: 200 });
};

const makeRequest = (path, body, cookie = '') => new Request(`https://example.com${path}`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'CF-Connecting-IP': '203.0.113.10',
    ...(cookie ? { cookie } : {})
  },
  body: JSON.stringify(body)
});

try {
  assert.equal(isAllowedAdminEmail('tomatonabe0120@gmail.com'), true);
  assert.equal(isAllowedAdminEmail('tsubaki.tech.jp@gmail.com'), true);
  assert.equal(isAllowedAdminEmail('other@example.com'), false);

  sentPayload = null;
  const denied = await requestCode({ request: makeRequest('/api/admin/login', { email: 'other@example.com' }), env });
  assert.equal(denied.status, 200);
  assert.equal(sentPayload, null);

  const loginResponse = await requestCode({
    request: makeRequest('/api/admin/login', { email: 'tomatonabe0120@gmail.com' }),
    env
  });
  assert.equal(loginResponse.status, 200);
  assert.ok(sentPayload);
  assert.deepEqual(sentPayload.to, ['tomatonabe0120@gmail.com']);
  const code = sentPayload.text.match(/\b(\d{6})\b/)?.[1];
  assert.match(code, /^\d{6}$/);
  const challengeCookie = loginResponse.headers.get('set-cookie').split(';')[0];
  assert.match(challengeCookie, /^tsubaki_admin_challenge=/);

  const wrongResponse = await verifyCode({
    request: makeRequest('/api/admin/verify', { email: 'tomatonabe0120@gmail.com', code: '000000' }, challengeCookie),
    env
  });
  if (code !== '000000') assert.equal(wrongResponse.status, 401);

  const verifyResponse = await verifyCode({
    request: makeRequest('/api/admin/verify', { email: 'tomatonabe0120@gmail.com', code }, challengeCookie),
    env
  });
  assert.equal(verifyResponse.status, 200);
  const body = await verifyResponse.json();
  assert.equal(body.email, 'tomatonabe0120@gmail.com');
  const setCookie = verifyResponse.headers.get('set-cookie');
  assert.match(setCookie, /tsubaki_admin=/);

  const session = await createSession('tsubaki.tech.jp@gmail.com', env);
  const sessionRequest = new Request('https://example.com/api/admin/session', {
    headers: { cookie: `tsubaki_admin=${session.token}` }
  });
  const read = await readSession(sessionRequest, env);
  assert.equal(read.email, 'tsubaki.tech.jp@gmail.com');

  await assert.rejects(() => createSession('other@example.com', env));
  console.log('Administrator email authentication tests passed.');
} finally {
  globalThis.fetch = originalFetch;
}
