import {
  clearChallengeCookie,
  createSession,
  json,
  sessionCookie,
  verifyLoginCode
} from '../../_shared/admin.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: '入力内容を確認してください。' }, 400); }

  const result = await verifyLoginCode(request, body.email, body.code, env);
  if (result.configurationError) return json({ error: 'メール認証のCloudflare設定が不足しています。' }, 503);
  if (!result.ok) {
    const message = result.locked
      ? '認証コードの入力回数が上限に達しました。新しいコードを送信してください。'
      : '認証コードが違うか、有効期限が切れています。';
    return json({ error: message, attemptsRemaining: result.attemptsRemaining }, 401);
  }

  const session = await createSession(result.email, env);
  return json(
    { ok: true, email: result.email, csrf: session.payload.csrf },
    200,
    { 'set-cookie': [sessionCookie(request, session.token), clearChallengeCookie(request)] }
  );
}
