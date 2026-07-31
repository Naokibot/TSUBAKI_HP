import { createSession, json, loginRateLimited, sessionCookie, validateCredentials } from '../../_shared/admin.js';

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (await loginRateLimited(env, ip)) {
    return json({ error: 'ログイン試行回数が多すぎます。15分ほど待ってください。' }, 429);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: '入力内容を確認してください。' }, 400); }
  const result = await validateCredentials(body.email, body.password, env);
  if (result.configurationError) {
    return json({ error: '管理者ログインの秘密変数が設定されていません。' }, 503);
  }
  if (!result.ok) return json({ error: 'メールアドレスまたはパスワードが違います。' }, 401);

  const session = await createSession(result.email, env);
  return json(
    { ok: true, email: result.email, csrf: session.payload.csrf },
    200,
    { 'set-cookie': sessionCookie(request, session.token) }
  );
}
